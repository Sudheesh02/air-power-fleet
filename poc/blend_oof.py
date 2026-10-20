"""Nested blend of the saved out-of-fold predictions.

Weights are chosen on the other training folds and scored on the held-out
fold, at fixed remaining lives. The test RUL files are not read.
"""
import json
import zipfile
from io import BytesIO
from pathlib import Path

import numpy as np
import pandas as pd

from model import CAP, COLS, rmse

ROOT = Path(__file__).resolve().parent
ZIP = ROOT.parent / "Bhavesh Claude" / "cmapss_rul_package.zip"
PREFIX = "cmapss_rul_package/results/sota"
HORIZONS = np.array([15, 30, 45, 60, 75, 90, 105, 125])


def load(z, name):
    return np.load(BytesIO(z.read(name)))


def weights():
    grid = []
    for a in np.linspace(0, 1, 11):
        for b in np.linspace(0, 1 - a, 11):
            c = 1 - a - b
            if c < -1e-9:
                continue
            grid.append((a, b, max(c, 0.0)))
    return np.array(grid)


def main():
    z = zipfile.ZipFile(ZIP)
    names = ["lgb_cyc", "gru30", "cnngru30"]
    P = np.column_stack([load(z, f"{PREFIX}/FD001/oof_{n}.npy") for n in names])
    fold = load(z, f"{PREFIX}/FD001/oof_fold.npy").astype(int)
    train = pd.read_csv(ROOT.parent / "CMAPSSData" / "train_FD001.txt", sep=r"\s+", header=None, names=COLS)
    train = train.sort_values(["unit", "cycle"]).reset_index(drop=True)
    if len(train) != len(P):
        raise SystemExit(f"row mismatch {len(train)} vs {len(P)}")
    life = train.groupby("unit")["cycle"].transform("max")
    rul = (life - train["cycle"]).to_numpy()
    mask = np.isin(rul, HORIZONS)
    W = weights()
    rows = []
    for f in range(5):
        sel = mask & (fold != f)
        held = mask & (fold == f)
        err = P[sel] @ W.T - rul[sel, None]
        score = np.sqrt((err ** 2).mean(0))
        w = W[int(score.argmin())]
        pred = P[held] @ w
        truth = rul[held].astype(float)
        equal = P[held].mean(1)
        rows.append({
            "fold": f,
            "weights": {n: round(float(x), 2) for n, x in zip(names, w)},
            "equal_rmse": round(rmse(equal - truth), 4),
            "blend_rmse": round(rmse(pred - truth), 4),
            "equal_capped": round(rmse(np.clip(equal, 0, CAP) - np.minimum(truth, CAP)), 4),
            "blend_capped": round(rmse(np.clip(pred, 0, CAP) - np.minimum(truth, CAP)), 4),
        })
    out = {"members": names, "folds": rows}
    path = ROOT / "results" / "blend_oof.json"
    path.write_text(json.dumps(out, indent=2))
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
