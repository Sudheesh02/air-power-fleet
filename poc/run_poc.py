"""End-to-end proof of concept.

One command, from this folder, with the Python that has LightGBM installed
(Python 3.11 on this machine):

    py -3.11 run_poc.py --data ..\\CMAPSSData

The test RUL files are opened only after member predictions have been checked
against the saved weights. That check does not use the labels.
"""
import argparse
import json
import sqlite3
import zipfile
from io import BytesIO
from pathlib import Path

import mlflow
import numpy as np
import pandas as pd

from agent import MODEL_VERSION, TIERS, anomaly_flags, top_sensors, walk_unit
from model import (
    CAP,
    PPREFIX,
    PRED_ZIP,
    ROOT,
    Ensemble,
    apply_gate,
    gbm_matrix,
    saved_test_pred,
    score_pair,
    train_high_cap,
)
from rls_demo import run_retrain_demo

# Members are the round-2 ensemble. The nested gate decision is read from disk.
MEMBERS = {
    "FD001": ["lgb_cyc", "gru30", "cnngru30"],
    "FD002": ["lgb_v2", "gru30"],
    "FD003": ["lgb_cyc", "lgb_v2", "cnngru30"],
    "FD004": ["lgb_cyc", "lgb_v2", "gru30", "cnngru30"],
}
# Per-subset gate policy for submission: gate off on single-condition subsets
# (FD001, FD003) and gate on for multi-condition subsets (FD002, FD004).
SUBMIT_GATE = {
    "FD001": False,
    "FD002": True,
    "FD003": False,
    "FD004": True,
}
RUN = ROOT / "results" / "run"


def spread_from_fleet(fleet, members):
    z = zipfile.ZipFile(PRED_ZIP)
    cols = [np.load(BytesIO(z.read(f"{PPREFIX}/{fleet.subset}/oof_{m}.npy"))) for m in members]
    std = np.std(np.vstack(cols), axis=0)
    mask = fleet.cyc_tr >= 20
    if len(std) != len(mask):
        raise RuntimeError(f"{fleet.subset} OOF length {len(std)} != train rows {len(mask)}")
    return float(np.quantile(std[mask], 0.90))


def health_curves(fleet):
    blocks = [a[:, :fleet.nsens] for a in fleet.eng_tr]
    stacked = np.vstack(blocks)
    mu = stacked.mean(0)
    _, _, vt = np.linalg.svd(stacked - mu, full_matrices=False)
    comp = vt[0]
    early = np.concatenate([((a[:, :fleet.nsens] - mu) @ comp)[:max(1, len(a) // 5)] for a in fleet.eng_tr])
    late = np.concatenate([((a[:, :fleet.nsens] - mu) @ comp)[-max(1, len(a) // 5):] for a in fleet.eng_tr])
    if early.mean() < late.mean():
        comp = -comp
    train_h = (stacked - mu) @ comp
    lo, hi = np.quantile(train_h, [0.05, 0.95])

    def scale(engines):
        out = []
        for a in engines:
            h = (a[:, :fleet.nsens] - mu) @ comp
            out.append(np.clip((h - lo) / (hi - lo + 1e-9), 0, 1).astype(np.float32))
        return out

    return scale(fleet.eng_te)


def verify_members(ens):
    per, mean, std = ens.test_last()
    errors = {}
    for member, pred in per.items():
        ref = saved_test_pred(member, ens.subset)
        err = float(np.sqrt(np.mean((pred - ref) ** 2)))
        errors[member] = err
        if err > 1e-3:
            raise SystemExit(
                f"{ens.subset} {member} does not match the saved weights "
                f"(prediction RMSE {err:.4f}). Test labels were not read."
            )
    return per, mean, std, errors


def run_subset(data_dir, subset, decision):
    print(f"[{subset}] loading frozen ensemble", flush=True)
    ens = Ensemble(data_dir, subset, MEMBERS[subset])
    fleet = ens.fleet
    if fleet.n_missing != 0:
        raise SystemExit(f"{subset} has {fleet.n_missing} missing sensor values; the loader does not impute.")
    _, capped, member_std, errors = verify_members(ens)
    print(f"[{subset}] weights match saved predictions {errors}", flush=True)

    gate = decision["operating_point"] if decision["use_gate"] else None
    gated = capped.copy()
    if gate:
        print(f"[{subset}] training the high-cap head (train labels only)", flush=True)
        high_model, pca = train_high_cap(fleet)
        Xte = gbm_matrix(fleet.eng_te, fleet.nsens, cyc=True, v2=True, pca=pca)
        ends = np.cumsum([len(a) for a in fleet.eng_te]) - 1
        high_last = np.clip(high_model.predict(Xte)[ends], 0, 175)
        gated = apply_gate(capped, high_last, gate["tau"], gate["alpha"]).astype(np.float32)

        # Labels are read here, once, after the model outputs exist.
    truth = pd.read_csv(Path(data_dir) / f"RUL_{subset}.txt", header=None)[0].to_numpy(float)
    if len(truth) != len(capped):
        raise SystemExit(f"{subset} RUL file has {len(truth)} rows, predictions have {len(capped)}")
    official = score_pair(gated, truth)
    plain = score_pair(capped, truth)
    submission = official if SUBMIT_GATE[subset] else plain
    sub_pred = gated if SUBMIT_GATE[subset] else capped
    print(f"[{subset}] submission RMSE {submission['rmse']} NASA {submission['nasa']} (nested-gate RMSE {official['rmse']})", flush=True)

    print(f"[{subset}] per-cycle predictions for the agent", flush=True)
    pred, std, _ = ens.predict_engines(fleet.eng_te)
    flags = anomaly_flags(fleet)
    health = health_curves(fleet)
    limit = spread_from_fleet(fleet, MEMBERS[subset])
    gain = ens.feature_gain()

    units = fleet.test["unit"].drop_duplicates().to_numpy()
    lengths = [len(a) for a in fleet.eng_te]
    bounds = np.cumsum([0] + lengths)
    fleet_rows = []
    orders = []
    traj_frames = []
    critical_miss = 0
    critical_n = 0
    leads = []
    for i, unit in enumerate(units):
        a, b = int(bounds[i]), int(bounds[i + 1])
        block = fleet.eng_te[i][:, :fleet.nsens]
        cycles = []
        for t in range(b - a):
            p = float(pred[a + t])
            s = float(std[a + t])
            cons = float(np.clip(p - s, 0, CAP))
            cycles.append({
                "cycle": t + 1,
                "pred": p,
                "std": s,
                "cons": cons,
                "low": cons,
                "high": float(np.clip(p + s, 0, CAP)),
                "flag": bool(flags["flag_test"][a + t]),
                "anomaly_score": float(flags["score_test"][a + t]),
                "health": float(health[i][t]),
                "top_sensors": top_sensors(block[t], fleet.sensors),
            })
        states, order, review = walk_unit(cycles, limit)
        true = float(truth[i])
        final = states[-1]
        if true <= 15:
            critical_n += 1
            if final < 2:
                critical_miss += 1
            if order is not None and order["tier"] >= 2:
                high_cyc = order.get("cycle_high_raised") or order["cycle_raised"]
                leads.append((cycles[-1]["cycle"] + true) - high_cyc)
        if order is not None:
            order = dict(order)
            order["subset"] = subset
            order["unit"] = int(unit)
            order["top_sensors"] = ", ".join(order["top_sensors"])
            orders.append(order)
        fleet_rows.append({
            "subset": subset,
            "unit": int(unit),
            "true_rul": true,
            "pred_capped": round(float(capped[i]), 2),
            "pred_official": round(float(sub_pred[i]), 2),
            "std": round(float(member_std[i]), 2),
            "conservative_rul": round(cycles[-1]["cons"], 2),
            "severity": TIERS[final],
            "anomaly_flag": int(cycles[-1]["flag"]),
            "human_review": int(review),
            "order_cycle": None if order is None else order["cycle_raised"],
            "order_severity": None if order is None else order["severity"],
        })
        traj_frames.append(pd.DataFrame({
            "subset": subset,
            "unit": int(unit),
            "cycle": [c["cycle"] for c in cycles],
            "pred_rul": [c["pred"] for c in cycles],
            "health": [c["health"] for c in cycles],
            "anomaly_flag": [int(c["flag"]) for c in cycles],
            "severity_state": [TIERS[s] for s in states],
            "order_cycle": None if order is None else order["cycle_raised"],
        }))

    caught = critical_n - critical_miss
    summary = {
        "subset": subset,
        "n_engines": int(len(units)),
        "n_missing_sensor_values": int(fleet.n_missing),
        "n_clipped_sensor_values": 0,
        "members": MEMBERS[subset],
        "weight_check_rmse": errors,
        "gate": gate,
        "submit_gate": SUBMIT_GATE[subset],
        "submission": submission,
        "official": official,
        "without_gate": plain,
        "false_alarm_rate_healthy": flags["false_alarm_rate_healthy"],
        "anomaly_sensors": flags["sensors"],
        "spread_limit": limit,
        "orders": len(orders),
        "orders_by_severity": {name: sum(o["severity"] == name for o in orders) for name in TIERS},
        "human_review_rate": float(np.mean([r["human_review"] for r in fleet_rows])),
        "critical_engines": critical_n,
        "critical_missed": critical_miss,
        "critical_caught": caught,
        "median_lead_cycles_critical": None if not leads else float(np.median(leads)),
        "top_sensors_by_gain": [{"sensor": s, "name": n, "gain": round(g, 1)} for s, n, g in gain[:6]],
        "model_version": MODEL_VERSION,
    }
    return summary, fleet_rows, orders, traj_frames


def write_outputs(summaries, fleet_rows, orders, traj_frames):
    RUN.mkdir(parents=True, exist_ok=True)
    fleet = pd.DataFrame(fleet_rows)
    order_df = pd.DataFrame(orders)
    db = RUN / "fleet.db"
    if db.exists():
        db.unlink()
    con = sqlite3.connect(db)
    fleet.to_sql("fleet", con, index=False)
    if len(order_df):
        order_df.to_sql("work_orders", con, index=False)
    else:
        pd.DataFrame(columns=["subset", "unit", "severity"]).to_sql("work_orders", con, index=False)
    con.close()
    (RUN / "work_orders.json").write_text(order_df.to_json(orient="records", indent=2), encoding="utf-8")
    (RUN / "metrics.json").write_text(json.dumps(summaries, indent=2), encoding="utf-8")
    traj_dir = RUN / "trajectories"
    traj_dir.mkdir(exist_ok=True)
    for frame in traj_frames:
        subset = frame["subset"].iloc[0]
        path = traj_dir / f"{subset}.csv"
        frame.to_csv(path, mode="a", header=not path.exists(), index=False)
    return fleet, order_df


def write_scorecard(summaries, retrain):
    card = {
        "primary_convention": "Last cycle of each test engine. Error is the prediction minus the true RUL. The truth is not capped.",
        "secondary_convention": "Same predictions, but the true RUL is capped at 125 before scoring. Report this beside the primary number, never instead of it.",
        "model": "Round-2 average of the frozen LightGBM and GRU members. No shift. High-RUL gate only where the nested training-fold rule kept it.",
        "test_labels": "Opened once, after the reloaded weights matched the saved member predictions. Earlier project rounds had already scored this test set, so the figures are still mildly optimistic.",
        "agent": "Severity uses the capped ensemble (mean minus one member-standard-deviation). The gate does not change alarms. Anomaly does not add a severity point.",
        "published_reference_rmse_best_listed": {
            "source": "Chaoub et al. 2021 Table 4, as compiled in the project harness. The paper does not say whether FD002 and FD004 were scored with a capped truth.",
            "FD001": 10.71,
            "FD002": 12.49,
            "FD003": 11.48,
            "FD004": 13.97,
        },
        "will_not_say": "Do not say state of the art, and do not compare a capped-truth RMSE with those published figures.",
        "cycle_index": "Removed, LightGBM validation RMSE was 1.9 to 2.7 worse (lgb_nocyc). Kept, because operating hours are known on a real fleet. On C-MAPSS it is also helped by similar engine lives.",
        "retrain_rule": retrain["rule"],
        "subsets": summaries,
    }
    path = ROOT / "scorecard.json"
    path.write_text(json.dumps(card, indent=2), encoding="utf-8")
    return path


def log_mlflow(summaries):
    db_path = (ROOT / "mlflow.db").resolve().as_posix()
    mlflow.set_tracking_uri(f"sqlite:///{db_path}")
    mlflow.set_experiment("cmapss-poc")
    for summary in summaries:
        with mlflow.start_run(run_name=summary["subset"]):
            mlflow.log_params({
                "members": "+".join(summary["members"]),
                "gate": json.dumps(summary["gate"]),
                "model_version": summary["model_version"],
                "missing_policy": "none; C-MAPSS has no missing values",
            })
            mlflow.log_metrics({
                "rmse": summary["official"]["rmse"],
                "nasa": summary["official"]["nasa"],
                "rmse_capped_truth": summary["official"]["rmse_capped_truth"],
                "nasa_capped_truth": summary["official"]["nasa_capped_truth"],
                "rmse_without_gate": summary["without_gate"]["rmse"],
                "false_alarm_rate_healthy": summary["false_alarm_rate_healthy"] or 0.0,
                "human_review_rate": summary["human_review_rate"],
                "orders": summary["orders"],
                "critical_missed": summary["critical_missed"],
            })


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data", default=str(ROOT.parent / "CMAPSSData"))
    parser.add_argument("--subset", nargs="*", default=list(MEMBERS))
    args = parser.parse_args()
    decision = json.loads((ROOT / "results" / "gate_decision.json").read_text(encoding="utf-8"))
    by_subset = {d["subset"]: d for d in decision["decisions"]}
    traj_dir = RUN / "trajectories"
    if traj_dir.exists():
        for old in traj_dir.glob("*.csv"):
            old.unlink()
    summaries, rows, orders, frames = [], [], [], []
    for subset in args.subset:
        summary, fleet_rows, subset_orders, traj = run_subset(args.data, subset, by_subset[subset])
        summaries.append(summary)
        rows.extend(fleet_rows)
        orders.extend(subset_orders)
        frames.extend(traj)
    write_outputs(summaries, rows, orders, frames)
    print("[retrain] stationary holdout versus drifted holdout", flush=True)
    retrain = run_retrain_demo(args.data)
    card = write_scorecard(summaries, retrain)
    log_mlflow(summaries)
    print(f"scorecard {card}")
    for s in summaries:
        print(f"{s['subset']}: RMSE {s['official']['rmse']}  NASA {s['official']['nasa']}  "
              f"orders {s['orders']}  critical missed {s['critical_missed']}/{s['critical_engines']}  "
              f"review {s['human_review_rate']:.1%}")


if __name__ == "__main__":
    main()
