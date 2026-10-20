"""One held-out fold of a wider GRU, compared with the saved FD001 GRU.

Fold 0 of the saved out-of-fold file is the baseline. This script trains only
on the other folds. It does not read the test RUL file.
"""
import json
import zipfile
from io import BytesIO
from pathlib import Path

import jax
import jax.numpy as jnp
import numpy as np
import optax

from model import CAP, Ensemble, rmse, windows_of

ROOT = Path(__file__).resolve().parent
DATA = ROOT.parent / "CMAPSSData"
HORIZONS = np.array([15, 30, 45, 60, 75, 90, 105, 125])
HIDDEN = 96
MAX_EPOCHS = 25
PATIENCE = 6
BATCH = 256


def pack(engines):
    xs, ys, units = [], [], []
    for i, eng in enumerate(engines):
        xs.append(windows_of(eng, 30))
        ys.append(np.arange(len(eng) - 1, -1, -1, dtype=np.float32))
        units.append(np.full(len(eng), i, np.int32))
    return np.concatenate(xs), np.concatenate(ys), np.concatenate(units)


def init_params(key, n_in, hidden):
    def g(k, fan_in, fan_out):
        lim = np.sqrt(6 / (fan_in + fan_out))
        return jax.random.uniform(k, (fan_in, fan_out), minval=-lim, maxval=lim)

    keys = jax.random.split(key, 8)
    p = {}
    for name, fin, k0 in (("z", n_in, keys[0]), ("r", n_in, keys[1]), ("n", n_in, keys[2])):
        p[f"Wx{name}"] = g(k0, fin, hidden)
    p["Whz"] = g(keys[3], hidden, hidden)
    p["Whr"] = g(keys[4], hidden, hidden)
    p["Whn"] = g(keys[5], hidden, hidden)
    p["b"] = jnp.zeros((3 * hidden,))
    p["out"] = g(keys[6], hidden, 1)
    p["bo"] = jnp.zeros((1,))
    return p


def apply(params, x):
    # x: (B, T, C). Returns remaining-life in cycles, in (0, 125).
    h = jnp.zeros((x.shape[0], HIDDEN))
    xt = jnp.swapaxes(x, 0, 1)

    def step(h, x_t):
        z = jax.nn.sigmoid(x_t @ params["Wxz"] + h @ params["Whz"] + params["b"][:HIDDEN])
        r = jax.nn.sigmoid(x_t @ params["Wxr"] + h @ params["Whr"] + params["b"][HIDDEN:2 * HIDDEN])
        n = jnp.tanh(x_t @ params["Wxn"] + (r * h) @ params["Whn"] + params["b"][2 * HIDDEN:])
        h = (1.0 - z) * h + z * n
        return h, None

    h, _ = jax.lax.scan(step, h, xt)
    y = jax.nn.sigmoid(h @ params["out"] + params["bo"])
    return (y[:, 0] * CAP).astype(jnp.float32)


def main():
    ens = Ensemble(DATA, "FD001", ["lgb_cyc"])
    engines = ens.fleet.eng_tr
    z = zipfile.ZipFile(ROOT.parent / "Bhavesh Claude" / "cmapss_rul_package.zip")
    oof = np.load(BytesIO(z.read("cmapss_rul_package/results/sota/FD001/oof_gru30.npy")))
    oof_fold = np.load(BytesIO(z.read("cmapss_rul_package/results/sota/FD001/oof_fold.npy")))
    # One fold id per engine, in the same order the fleet was built.
    fold = np.array([int(oof_fold[s]) for s in np.r_[0, np.cumsum([len(a) for a in engines])[:-1]]])
    x_tr, y_tr, _ = pack([engines[i] for i in range(len(engines)) if fold[i] != 0])
    x_va, y_va, _ = pack([engines[i] for i in range(len(engines)) if fold[i] == 0])
    horizon = np.isin(y_va, HORIZONS)
    weight = np.minimum(1.0, CAP / np.maximum(y_tr, 1.0)).astype(np.float32)
    y_scaled = np.minimum(y_tr, CAP)

    # Rebuild the validation targets in the same row order as the oof file.
    lengths = [len(a) for a in engines]
    rul_all = np.concatenate([np.arange(t - 1, -1, -1) for t in lengths])
    base_mask = (oof_fold == 0) & np.isin(rul_all, HORIZONS)
    baseline = rmse(oof[base_mask] - rul_all[base_mask])

    params = init_params(jax.random.PRNGKey(0), x_tr.shape[-1], HIDDEN)
    opt = optax.chain(optax.clip_by_global_norm(1.0), optax.adam(1e-3))
    state = opt.init(params)
    apply_jit = jax.jit(apply)

    def loss(p, xb, yb, wb):
        pred = apply(p, xb)
        err = (pred - yb) ** 2
        return (err * wb).sum() / wb.sum()

    loss_jit = jax.jit(loss)
    step_jit = jax.jit(lambda p, s, xb, yb, wb: _step(p, s, xb, yb, wb, opt, loss))

    best, best_score, wait = None, 1e9, 0
    history = []
    rng = np.random.default_rng(0)
    x_va_j = jnp.asarray(x_va)
    for epoch in range(MAX_EPOCHS):
        order = rng.permutation(len(x_tr))
        for start in range(0, len(x_tr), BATCH):
            take = order[start:start + BATCH]
            params, state = step_jit(
                params, state,
                jnp.asarray(x_tr[take]),
                jnp.asarray(y_scaled[take]),
                jnp.asarray(weight[take]),
            )
        pred = np.asarray(apply_jit(params, x_va_j))
        score = rmse(pred[horizon] - y_va[horizon])
        history.append(round(float(score), 4))
        print(f"epoch {epoch:02d} horizon_rmse {score:.4f}", flush=True)
        if score < best_score - 1e-4:
            best_score = float(score)
            best = {k: np.asarray(v) for k, v in params.items()}
            wait = 0
        else:
            wait += 1
            if wait >= PATIENCE:
                break

    out = {
        "fold": 0,
        "saved_gru_horizon_rmse": round(float(baseline), 4),
        "new_gru_horizon_rmse": round(float(best_score), 4),
        "history": history,
        "hidden": HIDDEN,
        "beats_saved_gru": bool(best_score < baseline - 0.3),
    }
    path = ROOT / "results" / "fd001_gru_screen.json"
    path.write_text(json.dumps(out, indent=2))
    np.savez(ROOT / "results" / "fd001_gru_fold0.npz", **best)
    print(json.dumps(out, indent=2))


def _step(params, state, xb, yb, wb, opt, loss):
    grads = jax.grad(loss)(params, xb, yb, wb)
    updates, state = opt.update(grads, state, params)
    params = optax.apply_updates(params, updates)
    return params, state


if __name__ == "__main__":
    main()
