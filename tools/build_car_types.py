"""สร้าง js/car-types.js: ภาพเงาด้านข้างของรถ 7 ประเภทตัวถังในข้อมูลเทรน (หน้ารถหันซ้าย เหมือนภาพรถในเว็บ)

ใช้:  python tools/build_car_types.py
"""
import json
import math
import os

# ประเภท: (หน้าสุด x, ท้ายสุด x, ล้อหน้า x, ล้อหลัง x, เส้นหลังคาจากหน้ารถไปท้ายรถ)  viewBox 240x92
# จุดที่ทำให้แยกประเภทได้: แฮทช์แบ็กเตี้ย ล้อเล็ก ท้ายตัด / SUV ยกสูง ล้อใหญ่ ท้ายลาด / PPV ฝากระโปรงยาว ทรงกล่อง มีราวหลังคา
#   MPV หลังคาเตี้ยกว่าตู้ กระจกหน้าลาดยาวต่อจากจมูกรถ / รถตู้ สูงมาก หน้าทู่เกือบตั้งฉาก
SHAPE = {
    "Sedan":     (8, 232, 52, 188, "M8 64C8 57 12 54 24 52L78 48L104 30C108 27 112 26 118 26L158 26C166 26 171 28 177 33L200 47L224 49C230 50 232 54 232 61"),
    "Hatchback": (20, 214, 60, 178, "M20 64C20 57 24 54 34 52L78 48L104 30C108 27 112 26 118 26L184 26C193 26 198 30 201 36L210 52C212 56 214 60 214 63"),
    "SUV":       (12, 228, 58, 186, "M12 56C12 46 16 42 28 41L78 38L100 17C103 14 106 13 112 13L190 14C197 14 201 17 205 22L222 38C226 42 228 46 228 52"),
    "PPV":       (6, 234, 52, 192, "M6 58C6 49 10 45 22 44L76 41L94 15C96 12 99 11 104 11L226 11C231 11 233 14 233 19L234 44"),
    "MPV":       (10, 230, 50, 188, "M10 66C10 58 14 54 24 52L40 48L94 20C100 17 106 16 114 16L212 18C220 18 225 22 227 30L230 52"),
    "Pickup":    (6, 234, 50, 194, "M6 60C6 51 10 48 22 46L70 43L92 21C95 18 98 17 104 17L140 17C144 17 147 19 147 23L147 43L231 43C233 43 234 45 234 47"),
    "Van":       (14, 232, 46, 196, "M14 68L14 50C14 46 16 44 20 42L26 40L36 8C37 4 40 2 46 2L226 2C230 2 232 4 232 8"),
}
# หน้าต่าง (เจาะเป็นสีพื้นการ์ด) และชิ้นส่วนเสริม (สีเดียวกับตัวรถ)
GLASS = {
    "Sedan":     ["M92 46L109 31L134 31L134 46Z", "M139 31L159 31C164 31 167 33 171 36L184 46L139 46Z"],
    "Hatchback": ["M92 46L108 31L140 31L140 46Z", "M145 31L182 31C189 31 193 34 196 39L200 46L145 46Z"],
    "SUV":       ["M92 36L108 20L146 20L146 36Z", "M151 20L188 21C192 21 195 23 198 26L208 36L151 36Z"],
    "PPV":       ["M90 38L101 19L140 19L140 38Z", "M146 19L184 19L184 38L146 38Z", "M190 19L226 19L226 38L190 38Z"],
    "MPV":       ["M58 46L96 24L124 24L124 46Z", "M129 24L170 24L170 46L129 46Z", "M175 24L212 25C217 25 220 28 221 32L222 46L175 46Z"],
    "Pickup":    ["M83 40L98 24L120 24L120 40Z", "M125 24L140 24L140 40L125 40Z"],
    "Van":       ["M33 36L41 10L70 10L70 36Z", "M76 10L110 10L110 36L76 36Z", "M116 10L150 10L150 36L116 36Z", "M156 10L190 10L190 36L156 36Z", "M196 10L226 10L226 36L196 36Z"],
}
EXTRA = {"PPV": "M110 11V6H220V11H216V9H114V11Z"}  # ราวหลังคา
# รัศมีล้อและความสูงขอบล่างตัวรถ: SUV/PPV/กระบะ ยกสูงกว่าและล้อใหญ่กว่า MPV เตี้ย
FIT = {"Sedan": (13, 76), "Hatchback": (13, 76), "SUV": (17, 66), "PPV": (16, 69), "MPV": (13, 76), "Pickup": (15, 71), "Van": (13, 76)}
GROUND = 90
ORDER = ["Sedan", "Hatchback", "SUV", "PPV", "MPV", "Pickup", "Van"]


def svg(name):
    xf, xr, fw, rw, top = SHAPE[name]
    r, sill = FIT[name]
    cy, arch = GROUND - r, r + 4
    dx = round(math.sqrt(arch * arch - (cy - sill) ** 2), 2)  # จุดที่ซุ้มล้อตัดขอบล่างตัวรถ
    body = (f"{top}L{xr} {sill - 6}Q{xr} {sill} {xr - 6} {sill}L{rw + dx} {sill}A{arch} {arch} 0 0 0 {rw - dx} {sill}"
            f"L{fw + dx} {sill}A{arch} {arch} 0 0 0 {fw - dx} {sill}L{xf + 6} {sill}Q{xf} {sill} {xf} {sill - 6}Z")
    extra = f'<path d="{EXTRA[name]}"/>' if name in EXTRA else ""
    glass = f'<path class="glass" d="{"".join(GLASS[name])}"/>'
    wheels = "".join(f'<circle class="tyre" cx="{x}" cy="{cy}" r="{r}"/><circle class="hub" cx="{x}" cy="{cy}" r="{r * .34:.1f}"/>'
                     for x in (fw, rw))
    return f'<svg viewBox="0 0 240 92" aria-hidden="true"><path d="{body}"/>{extra}{glass}{wheels}</svg>'


out = {k: svg(k) for k in ORDER}
with open(os.path.join(os.path.dirname(__file__), "..", "js", "car-types.js"), "w", encoding="utf-8", newline="\n") as fh:
    fh.write("// สร้างอัตโนมัติด้วย tools/build_car_types.py อย่าแก้ด้วยมือ\n")
    fh.write("// TYPES = ประเภทตัวถังในข้อมูลเทรน (ลำดับที่แสดง)  SILHOUETTE[ประเภท] = SVG ภาพเงาด้านข้าง สีตาม currentColor\n")
    fh.write(f"export const TYPES={json.dumps(ORDER)};\n")
    fh.write(f"export const SILHOUETTE={json.dumps(out, ensure_ascii=False)};\n")
print("js/car-types.js:", len(out), "types")
