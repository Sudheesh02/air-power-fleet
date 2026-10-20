"""Frozen C-MAPSS ensemble: same preprocessing and weights as the round-2 package.

Inference only. The base LightGBM and GRU weights are loaded, not retrained.
The high-cap LightGBM used by the gate is trained only when a subset's nested
decision turned the gate on, because that model was never saved.
"""
import json
import zipfile
from io import BytesIO
from pathlib import Path

import lightgbm as lgb
import numpy as np
import pandas as pd
from numpy.lib.stride_tricks import sliding_window_view
from sklearn.cluster import KMeans

ROOT = Path(__file__).resolve().parent
WEIGHT_ZIP = ROOT.parent / "Bhavesh Claude" / "part1_code_results_best_weights.zip"
PRED_ZIP = ROOT.parent / "Bhavesh Claude" / "cmapss_rul_package.zip"
WPREFIX = "cmapss_rul_package/models"
PPREFIX = "cmapss_rul_package/results/sota"

COLS = ["unit", "cycle", "op1", "op2", "op3"] + [f"s{i}" for i in range(1, 22)]
OPS = ["op1", "op2", "op3"]
SENS = [f"s{i}" for i in range(1, 22)]
CAP = 125
HI_CAP = 175
HEAL_W = 0.3
SENSOR_NAME = {
    "s1": "T2 fan inlet temp",
    "s2": "T24 LPC outlet temp",
    "s3": "T30 HPC outlet temp",
    "s4": "T50 LPT outlet temp",
    "s5": "P2 fan inlet pressure",
    "s6": "P15 bypass pressure",
    "s7": "P30 HPC outlet pressure",
    "s8": "Nf fan speed",
    "s9": "Nc core speed",
    "s10": "epr pressure ratio",
    "s11": "Ps30 HPC static pressure",
    "s12": "phi fuel-flow ratio",
    "s13": "NRf corrected fan speed",
    "s14": "NRc corrected core speed",
    "s15": "BPR bypass ratio",
    "s16": "farB fuel-air ratio",
    "s17": "htBleed bleed enthalpy",
    "s18": "Nf_dmd demanded fan speed",
    "s19": "PCNfR_dmd demanded corrected fan speed",
    "s20": "W31 HPT coolant bleed",
    "s21": "W32 LPT coolant bleed",
}


def nasa_vec(d):
    d = np.asarray(d, float)
    return np.where(d < 0, np.exp(-d / 13.0) - 1.0, np.exp(d / 10.0) - 1.0)


def nasa_score(d):
    return float(nasa_vec(d).sum())


def rmse(d):
    return float(np.sqrt(np.mean(np.square(d))))


def load_table(path):
    df = pd.read_csv(path, sep=r"\s+", header=None, names=COLS)
    return df.sort_values(["unit", "cycle"]).reset_index(drop=True)


class Fleet:
    """Train-fitted regime scaling. Transform is identical for train and test."""

    def __init__(self, data_dir, subset):
        data_dir = Path(data_dir)
        self.subset = subset
        self.train = load_table(data_dir / f"train_{subset}.txt")
        self.test = load_table(data_dir / f"test_{subset}.txt")
        self.n_missing = int(self.train[SENS].isna().sum().sum() + self.test[SENS].isna().sum().sum())
        nc = 6 if subset in ("FD002", "FD004") else 1
        km = KMeans(nc, n_init=10, random_state=0).fit(self.train[OPS]) if nc > 1 else None
        c_tr = km.predict(self.train[OPS]) if km is not None else np.zeros(len(self.train), int)
        c_te = km.predict(self.test[OPS]) if km is not None else np.zeros(len(self.test), int)
        g = self.train[SENS].groupby(c_tr)
        mu, sd = g.mean(), g.std()
        self.sensors = [s for s in SENS if (sd[s] > 1e-9).all()]
        self.nsens = len(self.sensors)
        self.nc = nc

        def engines(df, cond):
            Z = (df[self.sensors].to_numpy(float) - mu.loc[cond, self.sensors].to_numpy(float))
            Z = Z / sd.loc[cond, self.sensors].to_numpy(float)
            out = []
            for u in df["unit"].drop_duplicates():
                m = df["unit"].to_numpy() == u
                z = Z[m]
                z = z - z[:20].mean(0)
                eye = np.eye(nc, dtype=np.float32)[cond[m]]
                cyc = (np.arange(1, len(z) + 1) / 250.0)[:, None]
                out.append(np.hstack([z, eye, cyc]).astype(np.float32))
            return out

        self.eng_tr = engines(self.train, c_tr)
        self.eng_te = engines(self.test, c_te)
        life = self.train.groupby("unit")["cycle"].transform("max").to_numpy()
        self.rul_tr = (life - self.train["cycle"].to_numpy()).astype(np.float32)
        self.unit_tr = self.train["unit"].to_numpy()
        self.cyc_tr = self.train["cycle"].to_numpy()


def windows_of(A, W):
    pad = np.vstack([np.repeat(A[:1], W - 1, 0), A])
    view = sliding_window_view(pad, W, axis=0).transpose(0, 2, 1)
    return np.ascontiguousarray(view)


def gbm_matrix(engines, nsens, cyc=True, v2=False, pca=None):
    """Column layout must match the saved LightGBM models."""
    rows = []
    for A in engines:
        A = A[:, :nsens]
        T = len(A)
        cs = np.cumsum(np.vstack([np.zeros((1, nsens)), A]), 0)
        idx = np.arange(1, T + 1)
        blocks = [A]
        for w in (5, 15, 30):
            lo = np.maximum(idx - w, 0)
            blocks.append((cs[idx] - cs[lo]) / (idx - lo)[:, None])
        win = sliding_window_view(np.vstack([np.repeat(A[:1], 29, 0), A]), 30, axis=0)
        for w in (15, 30):
            t = np.arange(w) - (w - 1) / 2.0
            blocks.append((win[:, :, -w:] * t).sum(-1) / (t ** 2).sum())
        blocks += [win[:, :, -15:].std(-1), win.std(-1)]
        if v2:
            blocks += [win.max(-1), win.min(-1)]
            frame = pd.DataFrame(A)
            blocks += [frame.ewm(alpha=0.1).mean().to_numpy(), frame.ewm(alpha=0.3).mean().to_numpy()]
            if pca is not None:
                mu, comps = pca
                H = (A - mu) @ comps.T
                hs = pd.DataFrame(H)
                t = np.arange(30) - 14.5
                hw = sliding_window_view(np.vstack([np.repeat(H[:1], 29, 0), H]), 30, axis=0)
                blocks += [
                    H,
                    hs.rolling(10, min_periods=1).mean().to_numpy(),
                    hs.rolling(30, min_periods=1).mean().to_numpy(),
                    (hw * t).sum(-1) / (t ** 2).sum(),
                ]
        if cyc:
            blocks.append(idx[:, None].astype(float))
        rows.append(np.hstack(blocks))
    return np.vstack(rows).astype(np.float32)


def sensor_groups(nsens, v2=False, pca_dim=0, with_cycle=True):
    """Map each feature column back to a sensor index, or None for cycle / health index."""
    groups = []

    def add(sensor_idx):
        groups.append(sensor_idx)

    for _ in range(1 + 3 + 2 + 2):
        for i in range(nsens):
            add(i)
    if v2:
        for _ in range(4):
            for i in range(nsens):
                add(i)
        for _ in range(1 + 2 + 1):
            for _j in range(pca_dim):
                add(None)
    if with_cycle:
        add(None)
    return groups


def _sigmoid(x):
    return 1.0 / (1.0 + np.exp(-np.clip(x, -40, 40)))


def _gru(Wx, Wh, b, x):
    H = Wh.shape[0]
    xi = x @ Wx + b
    h = np.zeros((x.shape[0], H), np.float32)
    for t in range(x.shape[1]):
        xt = xi[:, t]
        hh = h @ Wh
        r = _sigmoid(xt[:, :H] + hh[:, :H])
        z = _sigmoid(xt[:, H:2 * H] + hh[:, H:2 * H])
        n = np.tanh(xt[:, 2 * H:] + r * hh[:, 2 * H:])
        h = (1.0 - z) * n + z * h
    return h


def _conv_same(x, w, b):
    k = w.shape[0]
    pad = k // 2
    xp = np.pad(x, ((0, 0), (pad, pad), (0, 0)))
    T = x.shape[1]
    y = np.zeros((x.shape[0], T, w.shape[2]), np.float32)
    for i in range(k):
        y += xp[:, i:i + T, :] @ w[i]
    return y + b


def _forward(params, x, arch):
    if arch == "gru":
        h = _gru(params["gru2/Wx"], params["gru2/Wh"], params["gru2/b"],
                 _gru_seq(params, x))
    elif arch == "cnngru":
        h = np.maximum(_conv_same(x, params["c1/w"], params["c1/b"]), 0)
        h = _gru(params["gru1/Wx"], params["gru1/Wh"], params["gru1/b"], h)
    else:
        raise ValueError(arch)
    h = np.maximum(h @ params["h1/w"] + params["h1/b"], 0)
    return (h @ params["out/w"] + params["out/b"])[:, 0]


def _gru_seq(params, x):
    # Two stacked GRUs need the full sequence from the first layer, not only the last state.
    Wx, Wh, b = params["gru1/Wx"], params["gru1/Wh"], params["gru1/b"]
    H = Wh.shape[0]
    xi = x @ Wx + b
    h = np.zeros((x.shape[0], H), np.float32)
    seq = np.zeros((x.shape[0], x.shape[1], H), np.float32)
    for t in range(x.shape[1]):
        xt = xi[:, t]
        hh = h @ Wh
        r = _sigmoid(xt[:, :H] + hh[:, :H])
        z = _sigmoid(xt[:, H:2 * H] + hh[:, H:2 * H])
        n = np.tanh(xt[:, 2 * H:] + r * hh[:, 2 * H:])
        h = (1.0 - z) * n + z * h
        seq[:, t] = h
    return seq


def nn_predict(params, X, arch, cap, chunk=4096):
    out = []
    for i in range(0, len(X), chunk):
        out.append(_forward(params, X[i:i + chunk], arch) * cap)
    return np.concatenate(out).astype(np.float32)


def _zip_read(z, name):
    return z.read(name)


def load_nn(z, kind, subset):
    models = []
    for seed in range(3):
        raw = np.load(BytesIO(_zip_read(z, f"{WPREFIX}/{kind}/weights/{subset}/seed{seed}.npz")))
        models.append({k: raw[k] for k in raw.files})
    meta = json.loads(_zip_read(z, f"{WPREFIX}/{kind}/weights/{subset}/meta.json"))
    return models, meta


def load_lgb(z, kind, subset):
    blob = _zip_read(z, f"{WPREFIX}/{kind}/weights/{subset}/model.txt")
    path = ROOT / "results" / f"_{kind}_{subset}_model.txt"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(blob)
    booster = lgb.Booster(model_file=str(path))
    meta = json.loads(_zip_read(z, f"{WPREFIX}/{kind}/weights/{subset}/meta.json"))
    pca = None
    pca_name = f"{WPREFIX}/{kind}/weights/{subset}/pca.npz"
    if meta.get("v2") and pca_name in z.namelist():
        raw = np.load(BytesIO(_zip_read(z, pca_name)))
        pca = (raw["mean"], raw["components"])
    return booster, meta, pca


def saved_test_pred(kind, subset):
    z = zipfile.ZipFile(PRED_ZIP)
    return np.load(BytesIO(z.read(f"{PPREFIX}/{subset}/testpred_{kind}.npy"))).astype(np.float32)


class Ensemble:
    def __init__(self, data_dir, subset, members):
        self.fleet = Fleet(data_dir, subset)
        self.subset = subset
        self.members = members
        self.z = zipfile.ZipFile(WEIGHT_ZIP)
        self.kind = {}
        for m in members:
            if m.startswith("lgb"):
                booster, meta, pca = load_lgb(self.z, m, subset)
                self.kind[m] = ("lgb", booster, meta, pca)
            else:
                models, meta = load_nn(self.z, m, subset)
                self.kind[m] = ("nn", models, meta, None)

    def _member_matrix(self, engines, member):
        tag, model, meta, pca = self.kind[member]
        if tag == "lgb":
            X = gbm_matrix(engines, self.fleet.nsens, cyc=meta.get("cyc", True), v2=meta.get("v2", False), pca=pca)
            pred = model.predict(X).astype(np.float32)
            return np.clip(pred, 0, meta.get("cap", CAP))
        W = meta["W"]
        arch = meta["arch"]
        blocks = [windows_of(a, W) for a in engines]
        X = np.concatenate(blocks, axis=0)
        seeds = [np.clip(nn_predict(params, X, arch, CAP), 0, CAP) for params in model]
        return np.mean(seeds, axis=0).astype(np.float32)

    def predict_engines(self, engines):
        cols = [self._member_matrix(engines, m) for m in self.members]
        stacked = np.vstack(cols)
        return stacked.mean(0), stacked.std(0), cols

    def test_last(self):
        """Last-cycle prediction of each test engine, per member and as an average."""
        per = {}
        for m in self.members:
            tag, model, meta, pca = self.kind[m]
            if tag == "lgb":
                X = gbm_matrix(self.fleet.eng_te, self.fleet.nsens, cyc=meta.get("cyc", True),
                               v2=meta.get("v2", False), pca=pca)
                ends = np.cumsum([len(a) for a in self.fleet.eng_te]) - 1
                per[m] = np.clip(model.predict(X)[ends], 0, CAP).astype(np.float32)
            else:
                W = meta["W"]
                X = np.stack([windows_of(a, W)[-1] for a in self.fleet.eng_te])
                seeds = [np.clip(nn_predict(params, X, meta["arch"], CAP), 0, CAP) for params in model]
                per[m] = np.mean(seeds, axis=0).astype(np.float32)
        mean = np.mean([per[m] for m in self.members], axis=0)
        std = np.std([per[m] for m in self.members], axis=0)
        return per, mean.astype(np.float32), std.astype(np.float32)

    def feature_gain(self):
        """Sum LightGBM gain back onto physical sensors. First tree member only."""
        for m in self.members:
            tag, model, meta, pca = self.kind[m]
            if tag != "lgb":
                continue
            gain = model.feature_importance(importance_type="gain")
            groups = sensor_groups(self.fleet.nsens, v2=bool(meta.get("v2")), pca_dim=3 if meta.get("v2") else 0)
            if len(groups) != len(gain):
                groups = groups[:len(gain)] + [None] * max(0, len(gain) - len(groups))
            total = {s: 0.0 for s in self.fleet.sensors}
            for g, col in zip(groups, gain):
                if g is None:
                    continue
                total[self.fleet.sensors[g]] += float(col)
            ranked = sorted(total, key=total.get, reverse=True)
            return [(s, SENSOR_NAME.get(s, s), total[s]) for s in ranked if total[s] > 0]
        return []


def train_high_cap(fleet):
    """One LightGBM with the label cap at 175. Trained on train engines only."""
    from sklearn.decomposition import PCA
    sensors = np.vstack([a[:, :fleet.nsens] for a in fleet.eng_tr])
    pca_model = PCA(3, random_state=0).fit(sensors)
    pca = (pca_model.mean_.astype(np.float32), pca_model.components_.astype(np.float32))
    X = gbm_matrix(fleet.eng_tr, fleet.nsens, cyc=True, v2=True, pca=pca)
    y = np.minimum(fleet.rul_tr, HI_CAP)
    w = np.where(fleet.rul_tr > HI_CAP, HEAL_W, 1.0)
    model = lgb.LGBMRegressor(
        n_estimators=800, learning_rate=0.03, num_leaves=31, min_child_samples=40,
        subsample=0.8, subsample_freq=1, colsample_bytree=0.7, reg_lambda=1.0,
        n_jobs=1, verbose=-1,
    )
    model.fit(X, y, sample_weight=w)
    return model, pca


def apply_gate(base, high, tau, alpha):
    base = np.asarray(base, float)
    high = np.clip(high, 0, HI_CAP)
    out = np.where(base >= tau, base + alpha * np.maximum(high - base, 0.0), base)
    return np.clip(out, 0, HI_CAP)


def score_pair(pred, truth):
    pred = np.asarray(pred, float)
    truth = np.asarray(truth, float)
    du = pred - truth
    dc = np.clip(pred, 0, CAP) - np.minimum(truth, CAP)
    return {
        "rmse": round(rmse(du), 4),
        "nasa": round(nasa_score(du), 2),
        "rmse_capped_truth": round(rmse(dc), 4),
        "nasa_capped_truth": round(nasa_score(dc), 2),
    }
