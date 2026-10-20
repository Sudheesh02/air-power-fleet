"""Monitoring view. Reads the files written by run_poc.py. Does not retrain anything.

    py -3.14 -m streamlit run dashboard.py
"""
import json
import sqlite3
from pathlib import Path

import pandas as pd
import streamlit as st

ROOT = Path(__file__).resolve().parent
RUN = ROOT / "results" / "run"
SCORECARD = ROOT / "scorecard.json"
RETRAIN = ROOT / "results" / "retrain_comparison.json"


def load_frame(sql):
    con = sqlite3.connect(RUN / "fleet.db")
    try:
        return pd.read_sql(sql, con)
    finally:
        con.close()


def main():
    st.set_page_config(page_title="Self-healing machines", layout="wide")
    st.title("Self-healing machines")
    st.caption("C-MAPSS fleet. Predictions, work orders, and the retraining check from the local proof of concept.")
    if not (RUN / "fleet.db").exists() or not SCORECARD.exists():
        st.error("No results yet. Run run_poc.py first.")
        return

    card = json.loads(SCORECARD.read_text(encoding="utf-8"))
    metrics = json.loads((RUN / "metrics.json").read_text(encoding="utf-8"))
    by_name = {row["subset"]: row for row in metrics}

    st.subheader("Official score")
    st.write(card["primary_convention"])
    score_rows = []
    for row in metrics:
        sub = row.get("submission", row["official"])
        score_rows.append({
            "subset": row["subset"],
            "gate": "on" if row.get("submit_gate", True) else "off",
            "RMSE": sub["rmse"],
            "NASA": sub["nasa"],
            "RMSE, truth capped at 125": sub["rmse_capped_truth"],
            "NASA, truth capped at 125": sub["nasa_capped_truth"],
            "RMSE with gate": row["official"]["rmse"],
            "RMSE without gate": row["without_gate"]["rmse"],
            "critical missed": f"{row['critical_missed']}/{row['critical_engines']}",
            "orders": row["orders"],
            "human review": f"{row['human_review_rate']:.0%}",
        })
    shown = pd.DataFrame(score_rows)
    st.dataframe(shown, hide_index=True, width="stretch")
    # The page and the scorecard are the same file. A mismatch here is a bug.
    for row in shown.itertuples(index=False):
        source = by_name[row.subset].get("submission", by_name[row.subset]["official"])["rmse"]
        if float(row.RMSE) != float(source):
            st.error(f"{row.subset} dashboard RMSE does not match metrics.json")

    fleet = load_frame("select * from fleet")
    orders = load_frame("select * from work_orders")
    left, right = st.columns(2)
    with left:
        subset = st.selectbox("Subset", ["All"] + sorted(fleet["subset"].unique()))
    with right:
        severity = st.selectbox("Severity", ["All", "Critical", "High", "Medium", "Normal"])
    view = fleet
    if subset != "All":
        view = view[view["subset"] == subset]
    if severity != "All":
        view = view[view["severity"] == severity]
    st.subheader("Fleet")
    st.dataframe(view, hide_index=True, width="stretch")

    st.subheader("One engine")
    if view.empty:
        st.info("No engines in this filter.")
    else:
        pick = st.selectbox("Unit", [f"{r.subset} unit {r.unit}" for r in view.itertuples(index=False)])
        chosen = view.iloc[[i for i, r in enumerate(view.itertuples(index=False)) if f"{r.subset} unit {r.unit}" == pick][0]]
        path = RUN / "trajectories" / f"{chosen['subset']}.csv"
        traj = pd.read_csv(path)
        traj = traj[(traj["unit"] == int(chosen["unit"]))]
        st.line_chart(traj.set_index("cycle")[["pred_rul", "health"]], height=280)
        st.write(
            f"Predicted RUL at the last cycle: {chosen['pred_capped']} "
            f"(official, with the gate: {chosen['pred_official']}). "
            f"True RUL: {chosen['true_rul']}. Severity now: {chosen['severity']}."
        )
        if pd.notna(chosen["order_cycle"]):
            st.write(f"Work order raised at cycle {int(chosen['order_cycle'])} ({chosen['order_severity']}).")
        else:
            st.write("No work order for this engine.")

    st.subheader("Work orders")
    if orders.empty:
        st.info("No work orders.")
    else:
        order_view = orders
        if subset != "All" and "subset" in orders.columns:
            order_view = orders[orders["subset"] == subset]
        st.dataframe(order_view, hide_index=True, width="stretch")

    st.subheader("Retraining check")
    if not RETRAIN.exists():
        st.info("Retrain comparison has not been written.")
        return
    retrain = json.loads(RETRAIN.read_text(encoding="utf-8"))
    st.write(retrain["rule"])
    a, b = st.columns(2)
    with a:
        st.markdown("**Stationary holdout**")
        st.json(retrain["stationary"])
    with b:
        st.markdown("**Sensor gain drifted to 1.5**")
        st.json(retrain["drift_gain_to_1_5"])
    st.caption("This check uses a held-out slice of FD001 training engines. It does not score the contest test set a second time.")


if __name__ == "__main__":
    main()
else:
    main()
