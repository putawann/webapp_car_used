"""สร้าง js/specs.js จาก data/specs/*.csv (สเปครถตลาดไทยที่คัดจากแหล่งอ้างอิง หนึ่งไฟล์ต่อยี่ห้อ) ใช้ทำ dropdown ในฟอร์ม

ใช้:  python tools/build_specs.py [path/to/car_dataset.csv]
      ถ้าใส่ไฟล์ข้อมูลเทรน จะตรวจว่าทุกรุ่นที่โมเดลรู้จักมีสเปคครบ และไม่มีรุ่นที่โมเดลไม่รู้จัก

รูปแบบไฟล์ใน data/specs/ (หนึ่งแถว = สเปคชุดหนึ่งในช่วงปีที่ขายในไทย):
  brand,model    ชื่อตรงกับข้อมูลเทรน (โมเดลรู้จักชื่อนี้)
  years          "2003-2015" หรือ "2008"
  cc,fuel,gear,body ใส่หลายค่าได้ด้วย "|" เช่น 2500|3000 , AT|MT  (ทุกคู่ในแถวต้องมีขายจริง ไม่งั้นแยกแถว)
  fuel           gas | diesel | hybrid | ev  (ev ใส่ cc=0)
  gear           AT | MT
  body           Sedan | Hatchback | SUV | PPV | MPV | Pickup | Van  (ตามประเภทในข้อมูลเทรน)
  source         ลิงก์แหล่งอ้างอิง (ย่อ "wiki:Ford_Everest" ได้)
  note           หมายเหตุ (ไม่ใช้ในเว็บ)
"""
import csv
import glob
import json
import os
import sys

ROOT = os.path.join(os.path.dirname(__file__), "..")
FUELS = ["gas", "diesel", "hybrid", "ev"]    # ตรงกับ FUELS ใน app.js
GEARS = ["AT", "MT"]                          # ตรงกับ GEARS ใน app.js
BODY = ["Hatchback", "MPV", "PPV", "Pickup", "SUV", "Sedan", "Van"]
# สีตามหมวดในข้อมูลเทรน (เรียงจากที่พบบ่อยสุด) โมเดลรู้จักเฉพาะค่าเหล่านี้
COLORS = ["White", "Black", "Grey Bronze", "Grey", "Red", "Silver Bronze", "Silver", "Brown", "Blue", "Orange", "Green",
          "Light Blue", "Yellow", "Others", "Golden", "Sky Blue", "Gold", "Cream", "Purple", "Pink", "Beige"]

rows = [(f"{os.path.basename(p)}:{n}", r) for p in sorted(glob.glob(os.path.join(ROOT, "data", "specs", "*.csv")))
        for n, r in enumerate(csv.DictReader(open(p, encoding="utf-8-sig")), start=2)]
spec, src, errors = {}, {}, []
for where, r in rows:
    try:
        b, m = r["brand"].strip(), r["model"].strip()
        y0, _, y1 = r["years"].strip().partition("-")
        y0, y1 = int(y0), int(y1 or y0)
        assert 1940 < y0 <= y1 <= 2026, "years"
        for cc in r["cc"].split("|"):
            for f in r["fuel"].split("|"):
                for g in r["gear"].split("|"):
                    for t in r["body"].split("|"):
                        v = [int(cc), FUELS.index(f.strip()), GEARS.index(g.strip()), BODY.index(t.strip())]
                        for y in range(y0, y1 + 1):
                            lst = spec.setdefault(b, {}).setdefault(m, {}).setdefault(y, [])
                            if v not in lst:
                                lst.append(v)
        u = r["source"].strip()
        u = "https://en.wikipedia.org/wiki/" + u[5:] if u.startswith("wiki:") else u
        assert u.startswith("http"), "source"
        if u not in src.setdefault(b, {}).setdefault(m, []):
            src[b][m].append(u)
    except Exception as e:
        errors.append(f"{where}: {e!r} {dict(r)}")

if errors:
    sys.exit("\n".join(errors))

if len(sys.argv) > 1:  # ตรวจกับรายชื่อรุ่นที่โมเดลรู้จัก
    known = {(r["brand"], r["model"]) for r in csv.DictReader(open(sys.argv[1], encoding="utf-8-sig"))}
    have = {(b, m) for b in spec for m in spec[b]}
    print("missing specs:", sorted(known - have) or "none")
    print("unknown to model:", sorted(have - known) or "none")

dump = lambda o: json.dumps(o, ensure_ascii=False, separators=(",", ":"))
with open(os.path.join(ROOT, "js", "specs.js"), "w", encoding="utf-8", newline="\n") as fh:
    fh.write("// สร้างอัตโนมัติด้วย tools/build_specs.py จาก data/specs/*.csv อย่าแก้ด้วยมือ\n")
    fh.write("// SPEC[ยี่ห้อ][รุ่น][ปี] = [[ซีซี, เชื้อเพลิง, เกียร์, ตัวถัง], ...]  SRC[ยี่ห้อ][รุ่น] = [ลิงก์อ้างอิง]\n")
    fh.write(f"export const BODY={dump(BODY)};\nexport const COLORS={dump(COLORS)};\n")
    fh.write(f"export const SPEC={dump(spec)};\nexport const SRC={dump(src)};\n")
print(f"js/specs.js: {len(spec)} brands, {sum(len(v) for v in spec.values())} models, "
      f"{sum(len(l) for b in spec.values() for m in b.values() for l in m.values())} year-specs")
