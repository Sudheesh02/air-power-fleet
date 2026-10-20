"""Training-fold screen for a model that can beat the published FD001 number.

The frozen ensemble was fit on every training engine, so it has already seen
the engines this script holds out. A challenger that still beats it on those
engines is worth a single test look. This file never reads RUL_FD00x.txt.
"""
import json
from pathlib import Path

import numpy as np
from sklearn.decomposition import PCA

from model import CAP, Ensemble, rmse

ROOT = Path(__file__).resolve().parent
DATA = ROOT.parent / "CMAPSSData"
HORIZONS = (15, 30, 45, 60, 75, 90, 105, 125)
MEMBERS = ["lgb_cyc", "gru30", "cnngru30"]


def truncation(engine, horizon):
    """Prefix whose last cycle has this many cycles of life left."""
    keep = len(engine) - horizon
    if keep < 20:
        return None
    return engine[:keep]


def smooth_last(pred, width):
    width = min(width, len(pred))
    return float(pred[-width:].mean())


def hi_library(engines, nsens):
    """One health-index path per engine. Sign is fixed so the index rises with age."""
    rows = np.vstack([a[:, :nsens] for a in engines])
    pca = PCA(1, random_state=0).fit(rows)
    paths = []
    for eng in engines:
        h = ((eng[:, :nsens] - pca.mean_) @ pca.components_.T).ravel()
        # Rising degradation: correlate with time. Flip once, from the first engine,
        # after all paths exist. Placeholder; flipped below.
        paths.append(h.astype(np.float64))
    ref = paths[0]
    if np.corrcoef(ref, np.arange(len(ref)))[0, 1] < 0:
        pca.components_ *= -1
        paths = [-h for h in paths]
    return pca, paths


def query_features(engine, nsens, pca):
    sens = engine[:, :nsens]
    h = ((sens - pca.mean_) @ pca.components_.T).ravel()
    tail = h[-20:]
    t = np.arange(len(tail)) - (len(tail) - 1) / 2.0
    slope = float((tail * t).sum() / (t ** 2).sum())
    last = sens[-1]
    mean10 = sens[-10:].mean(0)
    return np.concatenate([last, mean10, [h[-1], h[-10:].mean(), slope]])


def library_matrix(engines, nsens, pca, step=2):
    feats, rul = [], []
    for eng in engines:
        T = len(eng)
        for end in range(20, T + 1, step):
            feats.append(query_features(eng[:end], nsens, pca))
            rul.append(T - end)
    return np.vstack(feats), np.asarray(rul, np.float64)


def knn_predict(lib_x, lib_y, query, k):
    # Scale by the library's own spread so a slope does not dominate a sensor.
    scale = lib_x.std(0)
    scale[scale < 1e-6] = 1.0
    d = np.sqrt((((lib_x - query) / scale) ** 2).sum(1))
    take = np.argpartition(d, k)[:k]
    w = 1.0 / np.maximum(d[take], 1e-6)
    return float((w * np.minimum(lib_y[take], CAP)).sum() / w.sum())


def main():
    ens = Ensemble(DATA, "FD001", MEMBERS)
    engines = ens.fleet.eng_tr
    nsens = ens.fleet.nsens
    n = len(engines)
    fold = np.arange(n) % 5

    cases = []
    for i, eng in enumerate(engines):
        for horizon in HORIZONS:
            part = truncation(eng, horizon)
            if part is None:
                continue
            cols = [ens._member_matrix([part], m) for m in MEMBERS]
            mean = np.mean(cols, axis=0)
            cases.append({
                "fold": int(fold[i]),
                "horizon": horizon,
                "truth": horizon,
                "traj": mean,
            })

    # Smoothing width is chosen on the other folds, then scored on the held-out fold.
    widths = (1, 3, 5, 9)
    picked = []
    for f in range(5):
        best_w, best_err = 1, 1e9
        for w in widths:
            err = [smooth_last(c["traj"], w) - c["truth"] for c in cases if c["fold"] != f]
            e = rmse(err)
            if e < best_err:
                best_w, best_err = w, e
        held = [c for c in cases if c["fold"] == f]
        pred = np.array([smooth_last(c["traj"], best_w) for c in held])
        truth = np.array([c["truth"] for c in held], float)
        base = np.array([smooth_last(c["traj"], 1) for c in held])
        picked.append({
            "fold": f,
            "width": best_w,
            "base_rmse": round(rmse(base - truth), 4),
            "smooth_rmse": round(rmse(pred - truth), 4),
            "base_capped": round(rmse(np.clip(base, 0, CAP) - np.minimum(truth, CAP)), 4),
            "smooth_capped": round(rmse(np.clip(pred, 0, CAP) - np.minimum(truth, CAP)), 4),
        })

    # Similarity, fit without the held-out engines. k chosen on the other folds.
    knn_rows = []
    ks = (5, 15, 40)
    for f in range(5):
        train_eng = [engines[i] for i in range(n) if fold[i] != f]
        pca, _ = hi_library(train_eng, nsens)
        lib_x, lib_y = library_matrix(train_eng, nsens, pca)
        held_cases = [c for c in cases if c["fold"] == f]
        # Rebuild queries from the engines. cases do not store the window, so recompute.
        queries = []
        truths = []
        for i, eng in enumerate(engines):
            if fold[i] != f:
                continue
            for horizon in HORIZONS:
                part = truncation(eng, horizon)
                if part is None:
                    continue
                queries.append(query_features(part, nsens, pca))
                truths.append(horizon)
        queries = np.vstack(queries)
        truths = np.asarray(truths, float)
        # Choose k on a half of the training engines, not on this fold.
        rng = np.random.default_rng(f)
        perm = rng.permutation(len(train_eng))
        cut = max(10, len(train_eng) // 5)
        inner_eng = [train_eng[j] for j in perm[:cut]]
        outer_eng = [train_eng[j] for j in perm[cut:]]
        pca_o, _ = hi_library(outer_eng, nsens)
        lib_o_x, lib_o_y = library_matrix(outer_eng, nsens, pca_o)
        best_k, best_err = ks[0], 1e9
        for k in ks:
            err = []
            for eng in inner_eng:
                for horizon in HORIZONS:
                    part = truncation(eng, horizon)
                    if part is None:
                        continue
                    err.append(knn_predict(lib_o_x, lib_o_y, query_features(part, nsens, pca_o), k) - horizon)
            e = rmse(err)
            if e < best_err:
                best_k, best_err = k, e
        pred = np.array([knn_predict(lib_x, lib_y, q, best_k) for q in queries])
        ens_pred = np.array([
            smooth_last(c["traj"], 1) for c in cases if c["fold"] == f
        ])
        knn_rows.append({
            "fold": f,
            "k": int(best_k),
            "knn_rmse": round(rmse(pred - truths), 4),
            "ensemble_rmse": round(rmse(ens_pred - truths), 4),
            "knn_capped": round(rmse(np.clip(pred, 0, CAP) - np.minimum(truths, CAP)), 4),
            "ensemble_capped": round(rmse(np.clip(ens_pred, 0, CAP) - np.minimum(truths, CAP)), 4),
        })

    out = {"protocol": "train-engine truncations at fixed remaining lives", "smoothing": picked, "similarity": knn_rows}
    path = ROOT / "results" / "improve_screen.json"
    path.write_text(json.dumps(out, indent=2))
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
