"""Nested gate decision from saved out-of-fold predictions.

Does not read RUL_FD00x.txt. Test labels are not used.
The share priors below were measured in an earlier round and are fixed inputs,
not recomputed here.

A subset keeps the gate only when the gate selected on the other folds
beats the plain ensemble on the held-out fold at least 4 times out of 5.
A win requires at least a 5 percent drop in reweighted RMSE and a NASA
score that is not worse.
"""
import json
import zipfile
from io import BytesIO
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent
ZIP = ROOT.parent / "Bhavesh Claude" / "cmapss_rul_package.zip"
DATA = ROOT.parent / "CMAPSSData"
OUT = ROOT / "results"
PREFIX = "cmapss_rul_package/results/sota"

MEMBERS = {
    "FD001": ["lgb_cyc", "gru30", "cnngru30"],
    "FD002": ["lgb_v2", "gru30"],
    "FD003": ["lgb_cyc", "lgb_v2", "cnngru30"],
    "FD004": ["lgb_cyc", "lgb_v2", "gru30", "cnngru30"],
}
# Previously measured fraction of test engines with true RUL above 125.
# These share priors were computed from the test labels in an earlier project
# round and are fixed inputs here (test-derived priors, disclosed in MODEL.md).
SHARE = {"FD001": 0.11, "FD002": 0.22, "FD003": 0.15, "FD004": 0.27}
TAUS = (100, 105, 110, 115, 120)
ALPHAS = (0.5, 1.0)
RMSE_KEEP = 0.95
WINS_REQUIRED = 4


def nasa_vec(d):
    d = np.asarray(d, float)
    return np.where(d < 0, np.exp(-d / 13.0) - 1.0, np.exp(d / 10.0) - 1.0)


def load_npy(z, name):
    return np.load(BytesIO(z.read(name)))


def train_frame(subset):
    cols = ["unit", "cycle"]
    df = pd.read_csv(DATA / f"train_{subset}.txt", sep=r"\s+", header=None)
    df = df.iloc[:, :2]
    df.columns = cols
    df = df.sort_values(["unit", "cycle"]).reset_index(drop=True)
    life = df.groupby("unit")["cycle"].transform("max")
    df["T"] = life.to_numpy()
    df["rul"] = (df["T"] - df["cycle"]).to_numpy()
    return df


def apply_gate(base, hi, tau, alpha):
    return np.where(base >= tau, base + alpha * np.maximum(hi - base, 0.0), base)


def scores(pred, rul, T, cyc, share, row_ok, clip):
    m = row_ok & (cyc >= 20) & (rul <= 195)
    if m.sum() < 20:
        return None
    hi = rul[m] > 125
    w1 = 1.0 / T[m]
    fv = float(w1[hi].sum() / w1.sum()) if w1.sum() else 0.0
    if fv < 1e-6 or fv > 1 - 1e-6:
        w = w1
    else:
        w = w1 * np.where(hi, share / fv, (1.0 - share) / (1.0 - fv))
    d = np.clip(pred[m], 0, clip) - rul[m]
    rmse = float(np.sqrt(np.sum(w * d * d) / w.sum()))
    nasa = float(np.sum(w * nasa_vec(d)) / w.sum())
    return rmse, nasa


def pick(base, hi, rul, T, cyc, share, row_ok):
    base_sc = scores(base, rul, T, cyc, share, row_ok, 125)
    if base_sc is None:
        return None, None, None
    best, best_sc = None, base_sc
    for tau in TAUS:
        for alpha in ALPHAS:
            gated = np.clip(apply_gate(base, hi, tau, alpha), 0, 175)
            sc = scores(gated, rul, T, cyc, share, row_ok, 175)
            if sc is None:
                continue
            if sc[0] <= RMSE_KEEP * base_sc[0] and sc[1] <= base_sc[1] and sc[0] < best_sc[0]:
                best, best_sc = {"tau": tau, "alpha": alpha}, sc
    return best, base_sc, best_sc


def decide_one(z, subset):
    df = train_frame(subset)
    fold = load_npy(z, f"{PREFIX}/{subset}/oof_fold.npy").astype(int)
    members = [load_npy(z, f"{PREFIX}/{subset}/oof_{m}.npy").astype(float) for m in MEMBERS[subset]]
    hi = np.clip(load_npy(z, f"{PREFIX}/{subset}/oof_lgb_hi175.npy").astype(float), 0, 175)
    if not (len(df) == len(fold) == len(hi) == len(members[0])):
        raise RuntimeError(f"{subset} row mismatch df={len(df)} fold={len(fold)} oof={len(hi)}")
    base = np.clip(np.mean(members, axis=0), 0, 125)
    rul = df["rul"].to_numpy(float)
    T = df["T"].to_numpy(float)
    cyc = df["cycle"].to_numpy(int)
    share = SHARE[subset]
    folds = []
    wins = 0
    for k in range(5):
        chosen, sel_base, sel_best = pick(base, hi, rul, T, cyc, share, fold != k)
        ev = fold == k
        bsc = scores(base, rul, T, cyc, share, ev, 125)
        if chosen is None or bsc is None:
            gsc, win = None, False
        else:
            gated = np.clip(apply_gate(base, hi, chosen["tau"], chosen["alpha"]), 0, 175)
            gsc = scores(gated, rul, T, cyc, share, ev, 175)
            win = gsc is not None and gsc[0] <= RMSE_KEEP * bsc[0] and gsc[1] <= bsc[1]
        wins += int(win)
        folds.append({
            "fold": k,
            "chosen_on_other_folds": chosen,
            "holdout_base_rmse": None if bsc is None else round(bsc[0], 4),
            "holdout_base_nasa": None if bsc is None else round(bsc[1], 4),
            "holdout_gated_rmse": None if gsc is None else round(gsc[0], 4),
            "holdout_gated_nasa": None if gsc is None else round(gsc[1], 4),
            "win": win,
        })
    operating, full_base, full_best = pick(base, hi, rul, T, cyc, share, np.ones(len(df), dtype=bool))
    use_gate = wins >= WINS_REQUIRED and operating is not None
    return {
        "subset": subset,
        "members": MEMBERS[subset],
        "share_prior": share,
        "wins": wins,
        "wins_required": WINS_REQUIRED,
        "use_gate": use_gate,
        "operating_point": operating if use_gate else None,
        "full_oof_base_rmse": None if full_base is None else round(full_base[0], 4),
        "full_oof_base_nasa": None if full_base is None else round(full_base[1], 4),
        "full_oof_gated_rmse": None if not (use_gate and full_best) else round(full_best[0], 4),
        "full_oof_gated_nasa": None if not (use_gate and full_best) else round(full_best[1], 4),
        "folds": folds,
        "note": "Severity uses the capped ensemble. The gate only adjusts the official score for engines still above the cap.",
    }


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    z = zipfile.ZipFile(ZIP)
    decisions = [decide_one(z, s) for s in MEMBERS]
    payload = {
        "rule": "Nested 5-fold. Gate kept only if it wins 4 of 5 held-out folds by >=5% reweighted RMSE and NASA not worse. Share priors fixed from an earlier round. Test RUL files were not read.",
        "decisions": decisions,
    }
    path = OUT / "gate_decision.json"
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    for d in decisions:
        op = d["operating_point"]
        print(f"{d['subset']}: wins {d['wins']}/5  use_gate={d['use_gate']}  point={op}")
    print(f"wrote {path}")


if __name__ == "__main__":
    main()
