"""Reproduce the recorded merge50minC winner, without rerunning model selection.

Run with the research venv. Private pipeline artifacts stay outside this public repo.
Only save artifacts after all three split metrics match the recorded notebook.
"""
import argparse
import ast
import hashlib
import importlib.util
import json
import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import sklearn
import xgboost
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project-dir", type=Path, default=Path(r"D:\AI_Workspace\car-project"))
    parser.add_argument("--output-dir", type=Path, default=Path(r"D:\AI_Workspace\artifacts\xgb_merge50minc_browser"))
    args = parser.parse_args()
    root = args.project_dir
    notebook = root / "reports/car-price-v5/XGB/XGB_merge50minC.ipynb"
    dataset = root / "data/main/merge_50min_clean.csv"
    dest = args.output_dir
    nb = json.loads(notebook.read_text(encoding="utf-8"))
    results = [json.loads(line.removeprefix("RESULT_JSON="))
               for cell in nb["cells"] for out in cell.get("outputs", [])
               for line in "".join(out.get("text", [])).splitlines()
               if line.startswith("RESULT_JSON=")]
    assert len(results) == 1, "expected one recorded notebook result"
    result = results[0]
    assert result["run_id"] == "XGB_merge50minC" and result["variant"] == "base"

    # Import precisely the notebook's encoder and model factory, not the old model's preprocessing.
    definitions = []
    constants = {}
    wanted = {"SEED", "NUM_COLS", "CAT_COLS", "CURRENT_YEAR", "LEARNING_RATE", "MODEL_THREADS"}
    for cell in nb["cells"]:
        if cell["cell_type"] != "code":
            continue
        for node in ast.parse("".join(cell["source"])).body:
            if isinstance(node, (ast.ClassDef, ast.FunctionDef)) and node.name in {"FoldOneHot", "make_model"}:
                definitions.append(ast.unparse(node))
            if isinstance(node, ast.Assign) and len(node.targets) == 1 and isinstance(node.targets[0], ast.Name):
                if node.targets[0].id in wanted:
                    constants[node.targets[0].id] = ast.literal_eval(node.value)
    assert set(constants) == wanted and len(definitions) == 2
    dest.mkdir(parents=True, exist_ok=True)
    source = "import numpy as np\nimport pandas as pd\nfrom sklearn.base import BaseEstimator, TransformerMixin\nfrom sklearn.pipeline import Pipeline\nfrom xgboost import XGBRegressor\n"
    source += "\n".join(f"{k} = {v!r}" for k, v in constants.items()) + "\n"
    source += "FEATURES = NUM_COLS + CAT_COLS\nMODEL_ALIASES = {'ALTIS': 'COROLLAALTIS', 'NP300NAVARA': 'NAVARA'}\n"
    source += "\n\n".join(definitions) + "\n"
    (dest / "model_def.py").write_text(source, encoding="utf-8")
    spec = importlib.util.spec_from_file_location("model_def", dest / "model_def.py")
    md = importlib.util.module_from_spec(spec)
    sys.modules["model_def"] = md
    spec.loader.exec_module(md)

    raw = pd.read_csv(dataset, encoding="utf-8-sig")
    df = raw.assign(car_age=md.CURRENT_YEAR - raw["year"]).drop(columns=["year", "color"])
    assert df[md.FEATURES + ["price"]].notna().all().all()
    keys = df["brand"] + "|" + df["model"]
    train, temp = train_test_split(df, train_size=0.8, stratify=keys, random_state=md.SEED)
    val, test = train_test_split(temp, test_size=0.5, stratify=keys.loc[temp.index], random_state=md.SEED)
    pipe = md.Pipeline([("encode", md.FoldOneHot(md.NUM_COLS, md.CAT_COLS)), ("model", md.make_model())])
    pipe.set_params(**{"model__" + k: v for k, v in result["best_params"].items()})
    print("Refitting recorded winner:", result["best_params"], flush=True)
    pipe.fit(train[md.FEATURES], train["price"])
    metrics = {}
    for name, part in [("train", train), ("validation", val), ("test", test)]:
        pred = pipe.predict(part[md.FEATURES])
        actual = part["price"]
        metrics[name] = {"RMSE": mean_squared_error(actual, pred) ** 0.5,
                         "MAE": mean_absolute_error(actual, pred), "R2": r2_score(actual, pred),
                         "MAPE": float(np.mean(np.abs(pred / actual - 1)))}
        for metric, value in metrics[name].items():
            assert np.isclose(value, result[name][metric], rtol=1e-6, atol=1e-6), (name, metric, value, result[name][metric])
        print(name, len(part), metrics[name], flush=True)

    pairs = raw[["brand", "model"]].drop_duplicates()
    key_map = {f"{b}|{''.join(c for c in m.upper() if c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')}": m
               for b, m in pairs.itertuples(index=False)}
    assert len(key_map) == len(pairs), "ambiguous normalized model names"
    # Exact normalized names win. Add aliases only when the canonical target exists for that brand.
    for b in raw["brand"].unique():
        for alias, target in md.MODEL_ALIASES.items():
            if f"{b}|{target}" in key_map:
                key_map.setdefault(f"{b}|{alias}", key_map[f"{b}|{target}"])
    meta = {"model_id": result["run_id"], "dataset": result["dataset"], "best_params": result["best_params"],
            "dataset_sha256": hashlib.sha256(dataset.read_bytes()).hexdigest(),
            "notebook_sha256": hashlib.sha256(notebook.read_bytes()).hexdigest(),
            "notebook_metrics": {k: result[k] for k in metrics}, "reproduced_metrics": metrics,
            "n_rows": {"train": len(train), "validation": len(val), "test": len(test)},
            "versions": {"xgboost": xgboost.__version__, "scikit-learn": sklearn.__version__, "pandas": pd.__version__},
            "known_brand_model_pairs": sorted(f"{b}|{m}" for b, m in pairs.itertuples(index=False)),
            "model_key_map": key_map, "year_range": [int(raw.year.min()), int(raw.year.max())],
            "engine_range": [int(raw.engine.min()), int(raw.engine.max())],
            "body_map": {b: b for b in sorted(raw.car_type.unique())}}
    joblib.dump(pipe, dest / "model.joblib", compress=3)
    (dest / "meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    print("Saved private artifacts:", dest)


if __name__ == "__main__":
    main()
