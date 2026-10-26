// Parity test: browser model (js/model.js) ต้องให้ผลตรงกับ pipeline Python ใน tests/cases.json
import {readFileSync} from "node:fs";
import {predictCars} from "../js/model.js";

const read = p => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const data = {
  trees: read("../model/xgb_new_cardb_trees.json"),
  encoder: read("../model/encoder.json"),
};
const cases = read("./cases.json");

const out = await predictCars(cases.map(c => c.car), data);
let maxDiff = 0, maxAt = -1, bad = 0;
for (let i = 0; i < cases.length; i++) {
  const want = cases[i], got = out[i];
  const d = Math.abs(got.raw - want.raw);
  if (d > maxDiff) { maxDiff = d; maxAt = i; }
  const same = got.price === want.price
    && got.known_model === want.known_model
    && JSON.stringify(got.warnings) === JSON.stringify(want.warnings);
  if (!same) {
    bad++;
    console.error(`case ${i} mismatch`, JSON.stringify(want), JSON.stringify(got));
  }
}
if (maxDiff >= 1) { console.error(`raw diff too large: ${maxDiff} at case ${maxAt}`, JSON.stringify(cases[maxAt].car)); bad++; }

// invalid input ต้อง throw พร้อมข้อความ
const valid = cases[0].car;
const badCars = [
  {...valid, year: 1800},
  {...valid, year: "2018"},
  {...valid, mileage: -1},
  {...valid, mileage: 1.5},
  {...valid, brand: ""},
  {...valid, model: ""},
  {...valid, brand: "x".repeat(61)},
  {...valid, model: "x".repeat(81)},
  {...valid, trans: "CVT"},
  {...valid, fuel: "lpg"},
  {...valid, body: "Coupe"},
  {...valid, cc: 10_001},
  {...valid, shape: 3},
  {brand: "TOYOTA"},
  null,
];
for (const c of badCars) {
  let threw = false;
  try { await predictCars([c], data); } catch { threw = true; }
  if (!threw) { console.error("invalid input did not throw:", JSON.stringify(c)); bad++; }
}
try { await predictCars([], data); console.error("empty list did not throw"); bad++; } catch {}

if (bad) process.exit(1);
console.log(`parity ok: ${cases.length} cases, max raw diff ${maxDiff}`);
