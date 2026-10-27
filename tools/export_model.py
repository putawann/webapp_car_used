"""Export the trained XGB_merge50minC pipeline to compact JSON for the browser.

Reads the read-only model folder (model.joblib, meta.json, model_def.py) and writes:
  model/xgb_merge50minc_trees.json  every tree + base_score (XGBoost's own JSON model is the source)
  model/encoder.json              FoldOneHot column order/levels + meta used by app.py

No data rows are written. Run with the research venv:
  python -X utf8 tools/export_model.py
"""
import json
import argparse
import sys
from pathlib import Path

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument("--model-dir", type=Path, default=Path(r"D:\AI_Workspace\artifacts\xgb_merge50minc_browser"))
MODEL_DIR = parser.parse_args().model_dir
OUT_DIR = Path(__file__).resolve().parent.parent / "model"

sys.path.insert(0, str(MODEL_DIR))
import joblib  # noqa: E402
import model_def as md  # noqa: E402  (must be importable for the pickle)

META = json.loads((MODEL_DIR / "meta.json").read_text(encoding="utf-8"))


def main():
    pipe = joblib.load(MODEL_DIR / "model.joblib")
    enc = pipe.named_steps["encode"]
    booster = pipe.named_steps["model"].get_booster()

    # --- trees: XGBoost's own JSON model, not a re-derived dump ---
    raw = json.loads(booster.save_raw("json"))
    learner = raw["learner"]
    gbm = learner["gradient_booster"]["model"]
    params = learner["learner_model_param"]
    base_score = float(str(params["base_score"]).strip("[]"))
    n_features = int(params["num_feature"])
    trees = gbm["trees"]

    assert learner["objective"]["name"] == "reg:squarederror", "unexpected objective"
    assert len(trees) == int(gbm["gbtree_model_param"]["num_trees"])
    assert all(x == 0 for t in trees for x in t["split_type"]), "categorical splits are not supported"
    assert all(len(t["categories"]) == 0 for t in trees)
    assert list(enc.get_feature_names_out()) == booster.feature_names, "encoder/booster column order differs"

    out = []
    for t in trees:
        left, right = t["left_children"], t["right_children"]
        split_idx, split_val, default_left, weight = (
            t["split_indices"], t["split_conditions"], t["default_left"], t["base_weights"])
        f, th, lc, rc, dl, val = [], [], [], [], [], []
        for i in range(len(left)):
            if left[i] == -1:  # leaf: only the value matters
                f.append(0)
                th.append(0)
                lc.append(-1)
                rc.append(-1)
                dl.append(0)
                val.append(float(weight[i]))
            else:
                assert right[i] != -1
                f.append(int(split_idx[i]))
                th.append(float(split_val[i]))  # float32 shortest repr; JS converts to float32
                lc.append(int(left[i]))
                rc.append(int(right[i]))
                dl.append(1 if default_left[i] == 1 else 0)
                val.append(0)  # internal base_weights are unused
        out.append({"f": f, "t": th, "l": lc, "r": rc, "d": dl, "v": val})

    trees_doc = {
        "model_id": META["model_id"],
        "n_features": n_features,
        "n_trees": len(out),
        "base_score": base_score,
        "objective": learner["objective"]["name"],
        "trees": out,
    }

    # --- encoder: FoldOneHot's own fitted order/levels ---
    cats = [{"name": c, "levels": [str(x) for x in enc.levels_[c]]} for c in enc.categorical_]
    encoder_doc = {
        "model_id": META["model_id"],
        "numeric_columns": list(enc.numeric_),
        "categorical_columns": cats,
        "n_features": n_features,
        "CURRENT_YEAR": int(md.CURRENT_YEAR),
        "engine_range": [int(x) for x in META["engine_range"]],
        "year_range": [int(x) for x in META["year_range"]],
        "known_brand_model_pairs": META["known_brand_model_pairs"],
        "model_key_map": META["model_key_map"],
        "model_aliases": {},  # exact normalized names + aliases are resolved in model_key_map
        "body_map": META["body_map"],
        "unknown_model": "__unknown__",  # app.py UNKNOWN_MODEL
        "unseen_encoding": "all_zero",  # FoldOneHot: ค่าที่ไม่อยู่ใน levels ได้ dummy 0 ทั้งแถว
    }

    OUT_DIR.mkdir(exist_ok=True)
    p1 = OUT_DIR / "xgb_merge50minc_trees.json"
    p2 = OUT_DIR / "encoder.json"
    p1.write_text(json.dumps(trees_doc, separators=(",", ":")), encoding="utf-8")
    p2.write_text(json.dumps(encoder_doc, separators=(",", ":")), encoding="utf-8")
    provenance = {k: META[k] for k in ["model_id", "dataset", "dataset_sha256", "notebook_sha256",
                  "best_params", "notebook_metrics", "reproduced_metrics", "n_rows", "versions"]}
    (OUT_DIR / "provenance.json").write_text(json.dumps(provenance, indent=2), encoding="utf-8")
    print(f"{p1} {p1.stat().st_size} bytes")
    print(f"{p2} {p2.stat().st_size} bytes")
    print(f"total {p1.stat().st_size + p2.stat().st_size} bytes, {len(out)} trees, base_score={base_score}")


if __name__ == "__main__":
    main()
