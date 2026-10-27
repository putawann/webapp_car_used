"""Python inference oracle for synthetic parity cases; no server dependencies."""
import json
import sys
from pathlib import Path
from types import SimpleNamespace

import joblib
import pandas as pd

MODEL_DIR = Path(r"D:\AI_Workspace\artifacts\xgb_merge50minc_browser")
sys.path.insert(0, str(MODEL_DIR))
import model_def as md

META = json.loads((MODEL_DIR / "meta.json").read_text(encoding="utf-8"))
PIPE = joblib.load(MODEL_DIR / "model.joblib")
PIPE.named_steps["model"].set_params(n_jobs=1)
Car = SimpleNamespace


def predict_raw(cars):
    pairs = set(META["known_brand_model_pairs"])
    rows = []
    for c in cars:
        brand = c.brand.strip().upper()
        key = "".join(x for x in c.model.upper() if x in "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
        name = META["model_key_map"].get(f"{brand}|{key}")
        known = name is not None and f"{brand}|{name}" in pairs
        warnings = []
        if c.fuel == "ev":
            warnings.append("ev_not_in_training")
        if not META["engine_range"][0] <= c.cc <= META["engine_range"][1]:
            warnings.append("engine_outside_training_range")
        if not META["year_range"][0] <= c.year <= META["year_range"][1]:
            warnings.append("year_outside_training_range")
        row = {"engine": c.cc, "mileage": c.mileage, "car_age": md.CURRENT_YEAR - c.year,
               "brand": brand, "model": name if known else "__unknown__", "car_type": META["body_map"][c.body],
               "fuel": {"gas": "Benzine", "diesel": "Diesel", "hybrid": "Hybrid", "ev": "Hybrid"}[c.fuel],
               "gear": {"AT": "Automatic", "MT": "Manual"}[c.trans]}
        rows.append((row, known, warnings))
    return PIPE.predict(pd.DataFrame([r[0] for r in rows])[md.FEATURES]), rows
