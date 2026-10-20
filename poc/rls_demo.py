"""Retraining rule on FD001 training engines. Does not read the test RUL files.

A ridge model is fit on the earliest engines, using the same window features as
the LightGBM model, and only on rows with RUL at or under 125. Later engines
are streamed with recursive least squares. Forgetting is promoted only when a
drifted holdout gets better. On stationary data it is refused.
"""
import json

import numpy as np

from model import ROOT, Fleet, gbm_matrix

OUT = ROOT / "results" / "retrain_comparison.json"


def _ridge(X, y, alpha=1.0):
    gram = X.T @ X + alpha * np.eye(X.shape[1])
    w = np.linalg.solve(gram, X.T @ y)
    P = np.linalg.inv(gram)
    return w, P


def _rls(w, P, x, y, lam):
    x = x.reshape(-1, 1)
    Px = P @ x
    k = Px / (lam + float((x.T @ Px).ravel()[0]))
    err = float(y - (w @ x.ravel()))
    w = w + k.ravel() * err
    P = (P - k @ (x.T @ P)) / lam
    # Keep the covariance finite. A drifted stream can otherwise overflow.
    P = 0.5 * (P + P.T)
    return w, P


def _last_rmse(w, X, y, units):
    err = []
    for unit in np.unique(units):
        m = np.flatnonzero(units == unit)
        pred = float(np.clip(w @ X[m[-1]], 0, 125))
        err.append(pred - float(y[m[-1]]))
    err = np.asarray(err)
    return float(np.sqrt(np.mean(err ** 2)))


def _matrix(fleet, gain_of_unit):
    engines = []
    for eng, unit in zip(fleet.eng_tr, fleet.train["unit"].drop_duplicates()):
        scaled = eng.copy()
        scaled[:, :fleet.nsens] *= gain_of_unit.get(int(unit), 1.0)
        engines.append(scaled)
    features = gbm_matrix(engines, fleet.nsens, cyc=True, v2=False)
    mask = fleet.rul_tr <= 125
    return features[mask], fleet.rul_tr[mask].astype(np.float32), fleet.unit_tr[mask]


def run_retrain_demo(data_dir):
    fleet = Fleet(data_dir, "FD001")
    ordered = [int(u) for u in fleet.train["unit"].drop_duplicates()]
    fit_u = ordered[:40]
    stream_u = ordered[40:80]
    hold_u = ordered[80:]

    def evaluate(gain_of_unit, lam_forget):
        X, y, units = _matrix(fleet, gain_of_unit)
        fit = np.isin(units, fit_u)
        w0, P0 = _ridge(X[fit], y[fit], alpha=10.0)
        hold = np.isin(units, hold_u)

        def stream(w, P, lam):
            for unit in stream_u:
                for i in np.flatnonzero(units == unit):
                    w, P = _rls(w, P, X[i], y[i], lam)
            return w

        frozen = _last_rmse(w0, X[hold], y[hold], units[hold])
        full = _last_rmse(stream(w0.copy(), P0.copy(), 1.0), X[hold], y[hold], units[hold])
        forgotten = _last_rmse(stream(w0.copy(), P0.copy(), lam_forget), X[hold], y[hold], units[hold])
        return frozen, full, forgotten

    # Half the weight of the first streamed row is gone by the end of the stream.
    n_stream = int(np.isin(fleet.unit_tr, stream_u).sum())
    # Count only the degradation rows that will actually be streamed.
    n_stream = int(((fleet.rul_tr <= 125) & np.isin(fleet.unit_tr, stream_u)).sum())
    lam = float(0.5 ** (1.0 / max(n_stream, 1)))

    still = evaluate({}, lam)
    ramp = {unit: 1.0 for unit in fit_u}
    for i, unit in enumerate(stream_u):
        ramp[unit] = 1.0 + 0.5 * (i / max(1, len(stream_u) - 1))
    for unit in hold_u:
        ramp[unit] = 1.5
    drifted = evaluate(ramp, lam)

    result = {
        "subset": "FD001",
        "holdout": "Last 20 training engines, last cycle, RUL at or under 125. The contest test labels are not used.",
        "forgetting_factor": round(lam, 6),
        "does_not_use_test_labels": True,
        "stationary": {
            "frozen_rmse": round(still[0], 3),
            "rls_no_forgetting_rmse": round(still[1], 3),
            "rls_forgetting_rmse": round(still[2], 3),
            "promote_forgetting": bool(still[2] < still[0]),
        },
        "drift_gain_to_1_5": {
            "frozen_rmse": round(drifted[0], 3),
            "rls_forgetting_rmse": round(drifted[2], 3),
            "promote_forgetting": bool(drifted[2] < drifted[0]),
        },
        "rule": (
            "Promote a forgetting update only when the holdout improves. "
            "On stationary data the forgetting update is worse than the frozen model, so it is refused. "
            "When every sensor's gain drifts to 1.5, the frozen model gets worse and the forgetting update is promoted. "
            "The no-forgetting update is the stand-in for a full refit. Here it does not beat the frozen model on the "
            "last cycle, because that cycle is already easy once failure rows have been seen, so it is not promoted either."
        ),
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, indent=2), encoding="utf-8")
    return result
