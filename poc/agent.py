"""Rule-based triage. No language model.

Severity comes from the capped ensemble only. The high-RUL gate is not allowed
to raise or lower an alarm. Anomaly is an early-warning channel: it can open a
Medium order, and it does not add a severity point by itself.
"""
import numpy as np
from sklearn.ensemble import IsolationForest

from model import SENSOR_NAME

TIERS = ("Normal", "Medium", "High", "Critical")
MODEL_VERSION = "round2-ensemble+nested-gate"
GOOD = ["s14", "s9", "s11", "s12", "s4", "s7", "s2", "s3", "s15", "s17", "s20", "s21"]


def tier_of(cons):
    if cons <= 15:
        return 3
    if cons <= 40:
        return 2
    if cons <= 80:
        return 1
    return 0


def anomaly_flags(fleet):
    """Isolation forest on healthy cycles, then 3-of-5 persistence. Fit on train only."""
    use = [s for s in GOOD if s in fleet.sensors]
    idx = [fleet.sensors.index(s) for s in use]
    tr = np.vstack([a[:, idx] for a in fleet.eng_tr])
    te = np.vstack([a[:, idx] for a in fleet.eng_te])
    units = fleet.unit_tr
    life = fleet.rul_tr + fleet.cyc_tr
    healthy = fleet.cyc_tr <= 0.4 * life
    engines = np.unique(units)
    rng = np.random.RandomState(0)
    rng.shuffle(engines)
    cut = int(0.8 * len(engines))
    fit_eng, cal_eng = engines[:cut], engines[cut:]
    fit_mask = healthy & np.isin(units, fit_eng)
    cal_mask = healthy & np.isin(units, cal_eng)
    iso = IsolationForest(n_estimators=300, random_state=0, n_jobs=1).fit(tr[fit_mask])
    # Threshold from held-out healthy engines: about a 1% false-alarm rate on raw scores.
    cal_score = -iso.score_samples(tr[cal_mask])
    delta = float(np.quantile(cal_score, 0.99))

    def flags_for(matrix, unit_ids):
        score = -iso.score_samples(matrix)
        raw = score > delta
        flag = np.zeros(len(score), dtype=bool)
        # unit_ids may repeat. Apply a trailing 5-cycle count inside each unit.
        # Rows of one unit are contiguous because engines were concatenated in order.
        cuts = np.flatnonzero(np.diff(unit_ids)) + 1
        bounds = np.concatenate([[0], cuts, [len(unit_ids)]])
        for a, b in zip(bounds[:-1], bounds[1:]):
            window = 0
            buf = []
            for i, bit in enumerate(raw[a:b]):
                buf.append(bool(bit))
                if len(buf) > 5:
                    buf.pop(0)
                if sum(buf) >= 3:
                    flag[a + i] = True
        return score, flag

    tr_units = fleet.unit_tr
    te_units = fleet.test["unit"].to_numpy()
    _, f_tr = flags_for(tr, tr_units)
    score_te, f_te = flags_for(te, te_units)
    fa = float(f_tr[cal_mask].mean()) if cal_mask.any() else None
    return {
        "sensors": use,
        "delta": delta,
        "false_alarm_rate_healthy": fa,
        "heldout_engines": int(len(cal_eng)),
        "flag_test": f_te,
        "score_test": score_te,
    }


def walk_unit(cycles, spread_limit):
    """cycles: list of dicts with cycle, pred, std, cons, flag, anomaly_score. Causal."""
    state = 0
    down_count = 0
    prev_raw = 0
    order = None
    cycle_high_raised = None
    states = []
    for row in cycles:
        raw = tier_of(row["cons"])
        # Escalate after two consecutive cycles above the current state.
        # Use min(prev_raw, raw) so alternating High/Critical raw tiers
        # still escalate to at least High instead of blocking each other.
        if raw > state:
            down_count = 0
            if prev_raw > state:
                state = min(prev_raw, raw)
        elif raw < state:
            down_count += 1
            if down_count >= 5:
                state = raw
                down_count = 0
        else:
            down_count = 0
        prev_raw = raw
        states.append(state)
        if state >= 2 and cycle_high_raised is None:
            cycle_high_raised = int(row["cycle"])
        open_medium = state == 1 and row["flag"]
        if (state >= 2 or open_medium) and order is None:
            order = _order(row, state)
            order["cycle_high_raised"] = cycle_high_raised
        elif order is not None and state > order["tier"]:
            updated = _order(row, state)
            updated["cycle_raised"] = order["cycle_raised"]
            updated["cycle_high_raised"] = cycle_high_raised
            order = updated
        elif order is not None and order.get("cycle_high_raised") is None and cycle_high_raised is not None:
            order["cycle_high_raised"] = cycle_high_raised
    last = cycles[-1]
    disagree = (bool(last["flag"]) and last["cons"] > 80) or ((not last["flag"]) and last["cons"] <= 15)
    review = bool(last["std"] > spread_limit or disagree)
    if order is not None:
        order["human_review"] = review
    return states, order, review


def _order(row, state):
    name = TIERS[state]
    if state >= 3:
        rule = "RUL_CRITICAL"
    elif state == 2:
        rule = "RUL_HIGH"
    else:
        rule = "RUL_MEDIUM_ANOMALY"
    return {
        "tier": state,
        "severity": name,
        "cycle_raised": int(row["cycle"]),
        "due_cycles": round(float(row["cons"]), 1),
        "pred_rul": round(float(row["pred"]), 2),
        "rul_low": round(float(row["low"]), 2),
        "rul_high": round(float(row["high"]), 2),
        "rule_id": rule,
        "model_version": MODEL_VERSION,
        "status": "open",
        "top_sensors": row["top_sensors"],
    }


def top_sensors(values, sensor_names, k=3):
    order = np.argsort(-np.abs(values))[:k]
    return [f"{sensor_names[i]} ({SENSOR_NAME.get(sensor_names[i], sensor_names[i])})" for i in order]
