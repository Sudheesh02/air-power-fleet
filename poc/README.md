# Self-healing machines: C-MAPSS proof of concept

Predict remaining useful life for the NASA turbofan fleet, then raise a maintenance work order with a rule-based agent. No language model.

The frozen weights live in `Bhavesh Claude` and are not modified. This folder only reads them.

## Run

Use Python 3.11 (it has LightGBM). From this folder:

```
py -3.11 run_poc.py --data ..\CMAPSSData
```

That writes `scorecard.json`, `results/run/fleet.db`, `results/run/work_orders.json`, `results/run/metrics.json`, trajectory csv files, `results/retrain_comparison.json`, and an MLflow sqlite store at `mlflow.db`.

The monitoring page, from a Python that has Streamlit:

```
py -3.14 -m streamlit run dashboard.py
```

## What is frozen

- Ensemble members are the round-2 averages. See `MODEL.md`.
- The high-RUL gate was chosen by `decide_gate.py` on training folds only. The test RUL files are not an input to that script.
- `run_poc.py` checks that the reloaded weights reproduce the saved member predictions before it opens a test RUL file.

## Reading the score

The official number is RMSE and the NASA score on the last cycle of each test engine, against the true RUL. The column where the truth is also capped at 125 is a second number, not a replacement.
