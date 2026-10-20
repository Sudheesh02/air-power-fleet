"""Held-out-engine attempt to beat the frozen FD001 ensemble.

Early stopping uses an inner slice of the training engines. The scored fold is
not used for that choice. The test RUL file is not read unless --score-test
is passed, and that flag refuses to run unless this screen already adopted
the model.
"""
import argparse
import json
import zipfile
from io import BytesIO
from pathlib import Path

import numpy as np
import torch
from torch import nn

from model import CAP, Ensemble, rmse, windows_of

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT.parent / "CMAPSSData"
PRED_ZIP = ROOT.parent / "Bhavesh Claude" / "cmapss_rul_package.zip"
PREFIX = "cmapss_rul_package/results/sota"
HORIZONS = np.array([15, 30, 45, 60, 75, 90, 105, 125])
MEMBERS = {
    "FD001": ["lgb_cyc", "gru30", "cnngru30"],
    "FD002": ["lgb_v2", "gru30"],
    "FD003": ["lgb_cyc", "lgb_v2", "cnngru30"],
    "FD004": ["lgb_cyc", "lgb_v2", "gru30", "cnngru30"],
}
MAX_EPOCHS = 60
PATIENCE = 10
BATCH = 256
ADOPT_MARGIN = 0.30


class Net(nn.Module):
    def __init__(self, n_in, residual=False):
        super().__init__()
        self.residual = residual
        self.convs = nn.ModuleList([
            nn.Conv1d(n_in, 32, k, padding=k // 2) for k in (3, 5, 7)
        ])
        self.drop = nn.Dropout(0.2)
        self.lstm = nn.LSTM(96, 64, batch_first=True, bidirectional=True)
        self.head = nn.Sequential(
            nn.Linear(128, 64), nn.ReLU(), nn.Dropout(0.2), nn.Linear(64, 1),
        )

    def forward(self, x):
        h = x.transpose(1, 2)
        h = torch.cat([torch.relu(conv(h)) for conv in self.convs], dim=1)
        h = self.drop(h.transpose(1, 2))
        out, _ = self.lstm(h)
        raw = self.head(out[:, -1, :]).squeeze(1)
        if self.residual:
            return 30.0 * torch.tanh(raw)
        return torch.sigmoid(raw) * CAP


def engine_folds(engines, oof_fold):
    starts = np.r_[0, np.cumsum([len(a) for a in engines])[:-1]]
    if int(starts[-1] + len(engines[-1])) != len(oof_fold):
        raise SystemExit(f"row mismatch {starts[-1] + len(engines[-1])} vs {len(oof_fold)}")
    return np.array([int(oof_fold[s]) for s in starts])


def pack(engines):
    xs, ys = [], []
    for eng in engines:
        xs.append(windows_of(eng, 30))
        ys.append(np.arange(len(eng) - 1, -1, -1, dtype=np.float32))
    return np.concatenate(xs), np.concatenate(ys)


def batches(x, y, w, rng):
    order = rng.permutation(len(x))
    for start in range(0, len(x), BATCH):
        take = order[start:start + BATCH]
        yield x[take], y[take], w[take]


def horizon_rmse(pred, truth):
    mask = np.isin(truth, HORIZONS)
    return rmse(pred[mask] - truth[mask])


def fit_fold(x_tr, y_tr, x_va, y_va, device, seed, base_tr=None, base_va=None):
    """If base_* is set, the network learns the ensemble's leftover error."""
    residual = base_tr is not None
    torch.manual_seed(seed)
    model = Net(x_tr.shape[-1], residual=residual).to(device)
    opt = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
    if residual:
        target = (np.minimum(y_tr, CAP) - np.clip(base_tr, 0, CAP)).astype(np.float32)
    else:
        target = np.minimum(y_tr, CAP).astype(np.float32)
    weight = np.minimum(1.0, CAP / np.maximum(y_tr, 1.0)).astype(np.float32)
    x_tr_t = torch.from_numpy(np.ascontiguousarray(x_tr))
    y_t = torch.from_numpy(target)
    w_t = torch.from_numpy(weight)
    x_va_t = torch.from_numpy(np.ascontiguousarray(x_va)).to(device)
    rng = np.random.default_rng(seed)
    best_score, best_state, wait = 1e9, None, 0
    history = []
    for epoch in range(MAX_EPOCHS):
        model.train()
        for xb, yb, wb in batches(x_tr_t, y_t, w_t, rng):
            xb, yb, wb = xb.to(device, non_blocking=True), yb.to(device), wb.to(device)
            opt.zero_grad(set_to_none=True)
            err = (model(xb) - yb) ** 2
            loss = (err * wb).sum() / wb.sum()
            loss.backward()
            nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            opt.step()
        model.eval()
        with torch.no_grad():
            pred = model(x_va_t).detach().cpu().numpy()
        if residual:
            pred = base_va + pred
        score = horizon_rmse(pred, y_va)
        history.append(round(float(score), 4))
        if score < best_score - 1e-4:
            best_score = float(score)
            best_state = {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}
            wait = 0
        else:
            wait += 1
            if wait >= PATIENCE:
                break
    model.load_state_dict(best_state)
    return model, history


def predict(model, engines, device):
    model.eval()
    out = []
    with torch.no_grad():
        for eng in engines:
            x = torch.from_numpy(windows_of(eng, 30)).to(device)
            pred = []
            for start in range(0, len(x), 1024):
                pred.append(model(x[start:start + 1024]).detach().cpu().numpy())
            out.append(np.concatenate(pred))
    return out


def ensemble_oof(subset):
    z = zipfile.ZipFile(PRED_ZIP)
    cols = [np.load(BytesIO(z.read(f"{PREFIX}/{subset}/oof_{m}.npy"))) for m in MEMBERS[subset]]
    fold = np.load(BytesIO(z.read(f"{PREFIX}/{subset}/oof_fold.npy"))).astype(int)
    return np.mean(cols, axis=0).astype(np.float32), fold


def screen(subset, device, residual=False):
    ens = Ensemble(DATA_DIR, subset, MEMBERS[subset][:1])
    engines = ens.fleet.eng_tr
    base, oof_fold = ensemble_oof(subset)
    fold = engine_folds(engines, oof_fold)
    windows, rul = pack(engines)
    oof = np.zeros(len(rul), np.float32)
    rows = []
    out_dir = ROOT / "results" / "beat"
    out_dir.mkdir(parents=True, exist_ok=True)
    for f in range(5):
        inner = (f + 1) % 5
        tr = ~np.isin(oof_fold, (f, inner))
        va = oof_fold == inner
        outer = oof_fold == f
        model, history = fit_fold(
            windows[tr], rul[tr], windows[va], rul[va], device, seed=0,
            base_tr=base[tr] if residual else None,
            base_va=base[va] if residual else None,
        )
        pred = np.concatenate(predict(model, [engines[i] for i in range(len(engines)) if fold[i] == f], device))
        if residual:
            pred = base[outer] + pred
        oof[outer] = pred
        truth = rul[oof_fold == f]
        base_f = base[oof_fold == f]
        rows.append({
            "fold": f,
            "epochs": len(history),
            "inner_best": history[int(np.argmin(history))],
            "new_rmse": round(horizon_rmse(pred, truth), 4),
            "ensemble_rmse": round(horizon_rmse(base_f, truth), 4),
        })
        torch.save(model.state_dict(), out_dir / f"{subset}_fold{f}.pt")
        print(json.dumps(rows[-1]), flush=True)
    # Blend weight chosen on the other folds, then scored on the held-out fold.
    blend_rows = []
    for f in range(5):
        best_w, best_err = 1.0, 1e9
        for w in np.linspace(0, 1, 21):
            pred = w * base[oof_fold != f] + (1 - w) * oof[oof_fold != f]
            err = horizon_rmse(pred, rul[oof_fold != f])
            if err < best_err:
                best_w, best_err = float(w), err
        held = oof_fold == f
        mix = best_w * base[held] + (1 - best_w) * oof[held]
        blend_rows.append({
            "fold": f,
            "ensemble_weight": round(best_w, 2),
            "blend_rmse": round(horizon_rmse(mix, rul[held]), 4),
            "ensemble_rmse": rows[f]["ensemble_rmse"],
            "new_rmse": rows[f]["new_rmse"],
        })
    new_mean = float(np.mean([r["new_rmse"] for r in rows]))
    ens_mean = float(np.mean([r["ensemble_rmse"] for r in rows]))
    blend_mean = float(np.mean([r["blend_rmse"] for r in blend_rows]))
    adopt = min(new_mean, blend_mean) <= ens_mean - ADOPT_MARGIN
    summary = {
        "subset": subset,
        "residual": residual,
        "device": str(device),
        "new_mean": round(new_mean, 4),
        "ensemble_mean": round(ens_mean, 4),
        "blend_mean": round(blend_mean, 4),
        "adopt_margin": ADOPT_MARGIN,
        "adopt": adopt,
        "folds": rows,
        "blend": blend_rows,
    }
    np.save(out_dir / f"{subset}_oof.npy", oof)
    (out_dir / f"{subset}_cv.json").write_text(json.dumps(summary, indent=2))
    print(json.dumps({k: summary[k] for k in ("subset", "new_mean", "ensemble_mean", "blend_mean", "adopt")}))
    return summary


def score_test(subset, device):
    summary = json.loads((ROOT / "results" / "beat" / f"{subset}_cv.json").read_text())
    if not summary.get("adopt"):
        raise SystemExit(f"refusing test look: {subset} was not adopted on the training folds")
    ens = Ensemble(DATA_DIR, subset, MEMBERS[subset])
    n_in = ens.fleet.eng_tr[0].shape[1]
    models = []
    for f in range(5):
        model = Net(n_in, residual=bool(summary.get("residual"))).to(device)
        model.load_state_dict(torch.load(ROOT / "results" / "beat" / f"{subset}_fold{f}.pt", map_location=device))
        model.eval()
        models.append(model)
    per, mean, _ = ens.test_last()
    new = []
    with torch.no_grad():
        for eng in ens.fleet.eng_te:
            x = torch.from_numpy(windows_of(eng, 30)[-1:]).to(device)
            preds = [float(m(x).cpu()) for m in models]
            new.append(float(np.mean(preds)))
    new = np.asarray(new, np.float32)
    if summary.get("residual"):
        new = mean + new
    # One weight, chosen on every training fold. The test labels are not in that choice.
    cv = summary["blend"]
    w = float(np.mean([r["ensemble_weight"] for r in cv]))
    mix = w * mean + (1 - w) * new
    truth = np.loadtxt(DATA_DIR / f"RUL_{subset}.txt")
    from model import score_pair
    out = {
        "subset": subset,
        "ensemble_weight": round(w, 3),
        "new": score_pair(new, truth),
        "ensemble": score_pair(mean, truth),
        "blend": score_pair(mix, truth),
    }
    (ROOT / "results" / "beat" / f"{subset}_test.json").write_text(json.dumps(out, indent=2))
    print(json.dumps(out, indent=2))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--subset", default="FD001")
    parser.add_argument("--score-test", action="store_true")
    parser.add_argument("--residual", action="store_true")
    args = parser.parse_args()
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    if args.score_test:
        score_test(args.subset, device)
    else:
        screen(args.subset, device, residual=args.residual)


if __name__ == "__main__":
    main()
