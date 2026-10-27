"""Build synthetic parity cases with the reproduced notebook Python pipeline.

Run with the research venv after refit_merge50minc.py:
  python -X utf8 tools/make_parity_cases.py
Writes tests/cases.json: car (web vocabulary), raw, price, known_model, warnings.
No data rows from any CSV are used; every car below is generated.
"""
import json
import random
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "tests" / "cases.json"

import model_reference as app  # loads the reproduced notebook pipeline

BODIES = ["Sedan", "Hatchback", "Pickup", "Van", "SUV", "PPV", "MPV"]
GEARS = ["AT", "MT"]
FUELS = ["gas", "diesel", "hybrid"]
CCS = [1000, 1200, 1500, 1600, 1800, 2000, 2400, 2500, 2800, 3000]
SHAPES = ["Sedan", "Hatchback", "Coupe", "Wagon", "SUV", "PPV", "MPV", "Pickup", "Van"]
COLORS = ["White", "Black", "Silver", "Red", "Blue", "Grey"]
rng = random.Random(20261026)
PAIRS = sorted(app.META["known_brand_model_pairs"])


def car(brand, model, **kw):
    base = {"brand": brand, "model": model, "year": rng.randint(2001, 2026),
            "mileage": rng.randrange(0, 400_001), "trans": rng.choice(GEARS),
            "fuel": rng.choice(FUELS), "cc": rng.choice(CCS), "body": rng.choice(BODIES)}
    base.update(kw)
    return base


def main():
    cars = []
    # 36 known brand|model pairs from meta.json, random web-vocabulary specs
    for _ in range(36):
        brand, model = rng.choice(PAIRS).split("|", 1)
        c = car(brand, model)
        if rng.random() < 0.4:
            c["shape"] = rng.choice(SHAPES)
        if rng.random() < 0.3:
            c["color"] = rng.choice(COLORS)
        cars.append(c)

    # model-name aliases / normalization (ALTIS -> COROLLAALTIS, NP300NAVARA -> NAVARA)
    cars.append(car("TOYOTA", "ALTIS", year=2018, cc=1800))
    cars.append(car("toyota", "Altis 1.8", year=2019, cc=1800))
    cars.append(car("NISSAN", "np300-navara", year=2020, cc=2500, body="Pickup"))
    cars.append(car("NISSAN", "NP 300 NAVARA", year=2017, cc=2500, body="Pickup"))
    # unknown model, unknown brand (priced anyway with all dummies 0)
    cars.append(car("TOYOTA", "ZZZ NOT A CAR", year=2020, cc=2000))
    cars.append(car("ZZTEST", "CAMRY", year=2020, cc=2000))
    cars.append(car(" zz test ", "not-a-model", year=2015, cc=1500))
    # EV (no training equivalent -> ev warning, fuel encoded as Hybrid)
    cars.append(car("TOYOTA", "CAMRY", year=2022, fuel="ev", cc=2500))
    cars.append(car("BYD", "SEALION 6", year=2025, fuel="ev", cc=1500))
    # engine / year outside the training range
    cars.append(car("HONDA", "CIVIC", year=2019, cc=900))
    cars.append(car("HONDA", "CIVIC", year=2019, cc=3500))
    cars.append(car("HONDA", "CIVIC", year=1995, cc=1800))
    cars.append(car("HONDA", "CIVIC", year=2030, cc=1800))
    cars.append(car("HONDA", "CIVIC", year=1900, cc=1000))
    # boundaries accepted by pydantic / edges of the ranges
    cars.append(car("TOYOTA", "YARIS", year=2001, cc=1000, mileage=0))
    cars.append(car("TOYOTA", "YARIS", year=2026, cc=3000, mileage=999_999))
    cars.append(car("TOYOTA", "YARIS", year=2100, cc=0))

    # New model: every known pair, each separate SUV/PPV/MPV category, real range boundaries.
    for pair in PAIRS:
        cars.append(car(*pair.split("|", 1), year=2020, cc=1500, mileage=75000))
    for body in BODIES:
        cars.append(car("TOYOTA", "FORTUNER", body=body, year=2020, cc=2800))
    for year in [2005, 2006, 2026, 2027]:
        for cc in [999, 1000, 3500, 3501]:
            cars.append(car("HONDA", "CIVIC", year=year, cc=cc))
    cars.append(car("BYD", "ATTO 3", fuel="ev", cc=0, year=2025))

    py_cars = [app.Car(**c) for c in cars]
    raw, rows = app.predict_raw(py_cars)

    cases = []
    for c, p, r in zip(cars, raw, rows):
        cases.append({
            "car": c,
            "raw": float(p),
            "price": max(0, int(round(float(p) / 1000.0)) * 1000),
            "known_model": bool(r[1]),
            "warnings": list(r[2]),
        })

    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(json.dumps(cases, ensure_ascii=False, indent=1), encoding="utf-8")
    (OUT.parent / "model_id.json").write_text(json.dumps(app.META["model_id"]), encoding="utf-8")
    print(f"wrote {OUT} with {len(cases)} cases")


if __name__ == "__main__":
    main()
