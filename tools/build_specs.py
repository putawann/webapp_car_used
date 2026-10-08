"""สร้าง js/specs.js จากไฟล์ข้อมูลเทรน: สเปคที่มีอยู่จริงของแต่ละรุ่น ใช้ทำ dropdown ในฟอร์ม

ใช้:  python tools/build_specs.py <path/to/car_dataset.csv>
รันใหม่ทุกครั้งที่อัปเดตข้อมูลเทรน แล้ว commit js/specs.js
"""
import collections
import csv
import json
import os
import sys

FUEL = {"Benzine": 0, "Diesel": 1, "Hybrid": 2}   # ตรงกับ FUELS ใน app.js
GEAR = {"Automatic": 0, "Manual": 1}              # ตรงกับ GEARS ใน app.js

src = sys.argv[1]
rows = list(csv.DictReader(open(src, encoding="utf-8-sig")))
body = sorted({r["car_type"] for r in rows})
colors = [c for c, _ in collections.Counter(r["color"] for r in rows).most_common()]

# นับว่าแต่ละชุดสเปคมีกี่คันในข้อมูล
count = collections.Counter(
    (r["brand"], r["model"], int(r["year"]), int(r["engine_capacity"]),
     FUEL[r["fuel_type"]], GEAR[r["gear_type"]], body.index(r["car_type"]))
    for r in rows)

# SPEC[ยี่ห้อ][รุ่น][ปี] = [[ซีซี, เชื้อเพลิง, เกียร์, ตัวถัง, จำนวนคัน], ...] เรียงจากที่พบบ่อยสุด
spec = {}
for (b, m, y, cc, f, g, t), n in sorted(count.items(), key=lambda kv: (-kv[1], kv[0])):
    spec.setdefault(b, {}).setdefault(m, {}).setdefault(y, []).append([cc, f, g, t, n])

dump = lambda o: json.dumps(o, ensure_ascii=False, separators=(",", ":"))
out = os.path.join(os.path.dirname(__file__), "..", "js", "specs.js")
with open(out, "w", encoding="utf-8", newline="\n") as fh:
    fh.write(f"// สร้างอัตโนมัติด้วย tools/build_specs.py จาก {os.path.basename(src)} ({len(rows):,} คัน) อย่าแก้ด้วยมือ\n")
    fh.write("// SPEC[ยี่ห้อ][รุ่น][ปี] = [[ซีซี, เชื้อเพลิง, เกียร์, ตัวถัง, จำนวนคันในข้อมูล], ...] เรียงจากที่พบบ่อยสุด\n")
    fh.write(f"export const BODY={dump(body)};\n")
    fh.write(f"export const COLORS={dump(colors)};\n")
    fh.write(f"export const SPEC={dump(spec)};\n")
print(f"{out}: {len(spec)} brands, {sum(len(v) for v in spec.values())} models, {len(count)} specs")
