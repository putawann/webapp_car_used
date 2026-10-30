# webapp_car_used — เว็บทำนายราคารถมือสอง

เว็บเดโมของโครงการนักศึกษา: กรอกรถ (ยี่ห้อ รุ่น ปี สเปก เลขไมล์) แล้วได้ราคาประเมินรถมือสองในตลาดไทย
**โมเดลทำงานในเบราว์เซอร์ทั้งหมด ไม่มีเซิร์ฟเวอร์ ไม่มี build step ไม่มี npm**

- เว็บ: https://putawann.github.io/webapp_car_used/
- รายงานผลการเทรนโมเดล: https://putawann.github.io/car-price-v5/
- ราคาเป็นค่าประมาณจากโมเดล ไม่ใช่ราคาซื้อขายจริง

## สารบัญ

1. [ภาพรวมการทำงาน](#1-ภาพรวมการทำงาน)
2. [โครงสร้างโฟลเดอร์](#2-โครงสร้างโฟลเดอร์)
3. [รันในเครื่อง](#3-รันในเครื่อง)
4. [โมเดลและการทำนาย](#4-โมเดลและการทำนาย)
5. [ข้อมูลสเปกรถ (dropdown)](#5-ข้อมูลสเปกรถ-dropdown)
6. [หน้าเว็บ](#6-frontend-design)
7. [ทดสอบ](#7-ทดสอบ)
8. [งานที่ทำต่อได้](#8-งานที่ทำต่อได้)
9. [ข้อจำกัดที่ต้องรู้](#9-ข้อจำกัดที่ต้องรู้)
10. [ธรรมเนียมการทำงาน](#10-ธรรมเนียมการทำงาน)

## 1. ภาพรวมการทำงาน

```
ผู้ใช้เลือก ยี่ห้อ > รุ่น > ปี > สเปก (cc · เชื้อเพลิง · เกียร์ · ตัวถัง) + สี + กรอกเลขไมล์
        │                         (ตัวเลือกมาจาก js/specs.js ซึ่งสร้างจาก data/specs/*.csv)
        ▼
js/app.js  รวมเป็นรถ 6 คัน: คันจริง + ปีก่อนหน้า 1-5 ปี (ไมล์เพิ่มปีละ 15,000 กม.)
        ▼
js/data.js  predictPrices()  >  js/model.js  predictCars()
        │   โหลด model/*.json ครั้งเดียว แล้วคำนวณ XGBoost เองใน JavaScript
        ▼
ราคาปัจจุบัน + ราคาในอีก 5 ปีข้างหน้า (ปัดเป็นพันบาท)
        ▼
แสดงราคา ช่วงราคา และกราฟแนวโน้ม 5 ปี
```

- รถ "อีก k ปีข้างหน้า" คำนวณโดยลด `year` ลง k และเพิ่มไมล์ 15,000 × k (สูงสุด 999,999)
  เพื่อแสดงแนวโน้มราคาตกของรถคันนั้น
- ฟอร์มแสดงเฉพาะคู่ยี่ห้อ–รุ่นที่โมเดลรู้จักจากข้อมูลเทรน ส่วนปีและสเปกยังมาจากข้อมูลตลาดไทย และอาจอยู่นอกช่วงที่โมเดลเคยเห็น จึงยังมีคำเตือน (`untrained`)
- ขนาดที่ต้องโหลด: โมเดล ~3.8 MB (`model/*.json`) และสเปก ~0.5 MB (`js/specs.js`)

## 2. โครงสร้างโฟลเดอร์

| พาธ | หน้าที่ |
|---|---|
| `index.html` | หน้าเดียว ไม่มีไลบรารีภายนอกนอกจากฟอนต์ Google Fonts |
| `credits.html` | หน้ารวมเครดิตภาพ (ผู้ถ่าย ลิงก์ต้นฉบับ สัญญาอนุญาต การดัดแปลง) สร้างจาก `data/car-images/inventory.json` ลิงก์จาก footer ของหน้าหลัก ต้องมีไว้ตามเงื่อนไข CC BY/BY-SA ห้ามลบ |
| `css/style.css` | สไตล์ทั้งหมด ธีมมืด/สว่าง สีเน้นคอรัล ภาพรถวางบนแผงกระดาษ (`--paper`) |
| `js/app.js` | ฟอร์ม dropdown ต่อเนื่อง การตรวจ input การเรียกทำนาย และการแสดงผล ภาษา TH/EN |
| `js/data.js` | ข้อความแปล (`T`), ตัวอย่างรถ (`EX`), `predictPrices()` ที่ห่อ `predictCars()` และตัดสินว่า `untrained` |
| `js/model.js` | **โมเดล XGBoost ในเบราว์เซอร์**: โหลด JSON, เข้ารหัสฟีเจอร์, เดินต้นไม้, ตรวจ input |
| `js/specs.js` | **ไฟล์สร้างอัตโนมัติ ห้ามแก้ด้วยมือ** สเปกรถตลาดไทยสำหรับ dropdown |
| `js/ui.js` | ตัวช่วยเลื่อนหน้าไปที่ผลลัพธ์ (เคารพ reduced-motion) |
| `model/xgb_merge50minc_trees.json` | ต้นไม้ทุกต้น + base_score ของโมเดล (3.8 MB) |
| `model/encoder.json` | ลำดับและค่าของ one-hot, ช่วงปี/เครื่องยนต์ที่เทรน, รายชื่อคู่ ยี่ห้อ-รุ่นที่รู้จัก, alias |
| `data/specs/*.csv` | ต้นทางของสเปก (หนึ่งไฟล์ต่อยี่ห้อ ยี่ห้อเล็กรวมใน `others.csv`) ทุกแถวมีแหล่งอ้างอิง |
| `data/trained-specs.csv` | ชุด ยี่ห้อ/รุ่น/ปี/ซีซี/เชื้อเพลิง/เกียร์ ที่มีในข้อมูลเทรน (สร้างจากไฟล์ข้อมูลเทรน) ใช้กรองสเปกให้ฟอร์มกรอกได้เฉพาะข้อมูลที่เทรน |
| `tools/refit_merge50minc.py` | สร้าง pipeline ผู้ชนะและตรวจ metric ก่อนบันทึกนอก repo |
| `model/provenance.json` | พารามิเตอร์ ผลตรวจ metric เวอร์ชันไลบรารี และ hash ต้นทาง |
| `tools/model_reference.py` | Python oracle สำหรับสร้างกรณีทดสอบ |
| `tools/export_model.py` | ส่งออกโมเดลที่เทรนแล้วเป็น `model/*.json` |
| `tools/make_parity_cases.py` | สร้างกรณีทดสอบ `tests/cases.json` จาก pipeline Python |
| `tools/build_specs.py` | สร้าง `js/specs.js` จาก `data/specs/*.csv` |
| `tests/parity.mjs`, `tests/cases.json` | ทดสอบว่า JavaScript ให้ผลตรงกับ Python |
| `data/car-images/inventory.json` | รายการรุ่น ปี และภาพที่แสดงได้ พร้อมที่มาและใบอนุญาต ภาพที่ยังรอตรวจอยู่ใน `research-*.json` |
| `tools/image_inventory.mjs`, `tests/car-images.mjs` | สร้างรายการค้นคว้าเริ่มต้นและตรวจความครบถ้วนของ metadata ภาพ |
| `tools/merge_car_images.mjs` | รวมรายการภาพจากไฟล์ค้นคว้าเข้า inventory ก่อนตรวจด้วย `tests/car-images.mjs` |
| `tests/cache-version.mjs` | ตรวจว่า JS/CSS ทุกไฟล์ใน `index.html` (import map) และ `credits.html` ใช้เลข `?v=` เดียวกัน ทุกครั้งที่อัปเดตเว็บให้เปลี่ยนเลขนี้ ไม่งั้นมือถืออาจใช้ JS เก่าจากแคชกับ HTML ใหม่จนฟอร์มหาย |
| `handoffs/` | บันทึกส่งต่องานเก่า (9 ต.ค. 2026) พาธและเวอร์ชันในนั้นล้าสมัยแล้ว |

## 3. รันในเครื่อง

ต้องเปิดผ่าน HTTP (ไม่ใช่ดับเบิลคลิกไฟล์) เพราะใช้ ES modules และ `fetch`:

```bash
python -m http.server 8765
# เปิด http://localhost:8765/
```

ทำงานได้โดยไม่ต้องโหลดไลบรารีจาก CDN (ถ้าออฟไลน์จะใช้ฟอนต์สำรองแทน IBM Plex Sans Thai)
ดีพลอยด้วย GitHub Pages จาก branch `main` โฟลเดอร์ราก ไม่มี build step

## 4. โมเดลและการทำนาย

**โมเดลปัจจุบัน:** `XGB_merge50minC` (ชุดข้อมูล v5 `merge_50min_clean.csv` แบบ base: ไม่ใช้ log ไม่ scale)

| รายการ | ค่า |
|---|---|
| ฟีเจอร์ | `engine`, `mileage`, `car_age`, `brand`, `model`, `car_type`, `fuel`, `gear` |
| พารามิเตอร์ | max_depth 16, min_child_weight 1, n_estimators 122, reg_lambda 10.0 |
| ข้อมูล | train 36,859 / validation 4,607 / test 4,608 แถว |
| ผลบน test | R² 0.9458, MAE 51,271 บาท, RMSE 76,379 บาท |
| เวอร์ชันที่เทรน | xgboost 3.4.1, scikit-learn 1.9.1 |

> สร้างโมเดลผู้ชนะโดย fit เฉพาะ train (80%) ผล metric ทั้งสามชุดตรงกับ notebook หลักฐานอยู่ใน `model/provenance.json` โดยไม่มีแถวข้อมูลเทรน

### การเข้ารหัสฟีเจอร์ (`js/model.js` ต้องตรงกับ pipeline และ `tools/model_reference.py`)

- ตัวเลข: `engine` = cc, `mileage` = กม., `car_age` = `2026 - year`
- ตัวหมวดหมู่ one-hot ตามลำดับใน `encoder.json`; ค่าที่ไม่รู้จักจะได้ศูนย์ทั้งแถว (เหมือน pipeline)
- แปลงค่าจากเว็บเป็นค่าที่โมเดลเทรน:

  | เว็บ | โมเดล |
  |---|---|
  | fuel `gas` / `diesel` / `hybrid` / `ev` | `Benzine` / `Diesel` / `Hybrid` / `Hybrid` (ไฟฟ้าไม่มีในข้อมูลเทรน จึงใช้ Hybrid และเตือน) |
  | trans `AT` / `MT` | `Automatic` / `Manual` |
  | body ทุกแบบ | ใช้ชื่อเดิม แยก `SUV`, `PPV`, `MPV` ตาม `body_map` ใน encoder |

- ชื่อรุ่น: ตัวพิมพ์ใหญ่ เก็บเฉพาะ A-Z และ 0-9 แล้วค้นชื่อจริงก่อน alias (เช่น `ALTIS` เป็น `COROLLAALTIS` เมื่อมีชื่อปลายทางในยี่ห้อนั้น) ใช้คีย์ `ยี่ห้อ|รุ่น` ใน `model_key_map`
  ถ้าไม่พบคู่ ยี่ห้อ|รุ่น ที่รู้จัก ใช้รุ่น `__unknown__` (`known_model=false`)
- ผลลัพธ์ = `max(0, round(raw/1000) × 1000)` โดย round แบบครึ่งเป็นคู่เหมือน Python

### ผลลัพธ์ของ `predictCars(list)`

คืน `[{price, raw, known_model, warnings}]` โดย `warnings` มีได้ 3 แบบ:
`ev_not_in_training`, `engine_outside_training_range` (นอก 1,000-3,500 cc), `year_outside_training_range` (นอก 2006-2026)

ตรวจ input ตามกติกาเดียวกับ pydantic ฝั่ง Python (ชนิด/ช่วง ถ้าผิดจะ throw): ยี่ห้อ 1-60 ตัวอักษร,
รุ่น 1-80, ปี 1900-2100 (จำนวนเต็ม), ไมล์ 0-999,999, cc 0-10,000

### ความแม่นยำเชิงตัวเลข

ต้นไม้และ leaf เก็บเป็น float32 และบวกสะสมใน `Float32Array` เพื่อให้ตรงกับ XGBoost
การเดินต้นไม้ใช้ `x < threshold` (strict) ไปซ้าย ค่าที่ขาดใช้ `default_left`
อย่าเปลี่ยนเป็น float64 เพราะราคาอาจเพี้ยนระดับพันบาทที่ขอบการปัดเศษ (`tests/parity.mjs` จะจับได้)

### วิธีเปลี่ยนไปใช้โมเดลตัวใหม่

1. รัน `python -X utf8 tools/refit_merge50minc.py` ด้วย research venv เพื่อสร้าง pipeline จาก encoder/model factory และพารามิเตอร์ผู้ชนะใน notebook ตรวจ metric ทุกชุดให้ตรงก่อนบันทึก
2. รัน `python -X utf8 tools/export_model.py` เพื่อส่งออกต้นไม้, encoder และ `model/provenance.json`
3. รัน `python -X utf8 tools/make_parity_cases.py` เพื่อสร้างกรณีทดสอบสังเคราะห์จาก pipeline Python จริง ไม่ต้องมี FastAPI
4. รัน `node tests/parity.mjs` แล้วตรวจหน้าเว็บผ่าน HTTP
5. โมเดลรอบอื่นต้องปรับชื่อไฟล์, MODEL_ID, การเตรียมข้อมูล/แบ่งชุด และการแปลงค่าฟอร์มให้ตรง พร้อมอัปเดตเอกสาร

ค่าปริยายของ --project-dir คือ D:/AI_Workspace/car-project; อ่าน notebook ใน reports/car-price-v5/XGB/XGB_merge50minC.ipynb และ CSV ใน data/main/merge_50min_clean.csv โดยไม่แก้ต้นทาง
ไฟล์ส่วนตัว (model.joblib, model_def.py, meta.json) บันทึกที่ D:/AI_Workspace/artifacts/xgb_merge50minc_browser นอก repo เปลี่ยนด้วย --output-dir และ --model-dir ของ export ได้ ถ้าเปลี่ยนต้องแก้ MODEL_DIR ใน tools/model_reference.py ด้วย

Rollback: คืน js/model.js, js/data.js, model/encoder.json และชุดทดสอบจาก commit ก่อนเปลี่ยนพร้อมกัน ไฟล์ model/xgb_new_cardb_trees.json ยังเก็บไว้ แต่เว็บไม่โหลดไฟล์นี้ รุ่นต้นไม้และ encoder ต้องตรงกัน ระบบจะปฏิเสธไฟล์ข้ามรุ่น

## 5. ข้อมูลสเปกรถ (dropdown)

ภาพรถในฟอร์มใช้ข้อมูลจาก `data/car-images/inventory.json` เลือกภาพที่แหล่งข้อมูลระบุปีตรงก่อน แล้วจึงใช้ภาพตัวแทนของรุ่นเมื่อไม่มีภาพปีนั้น ภาพทั้งหมดเป็นภาพประกอบ ไม่ยืนยันว่าตรงรุ่นย่อยหรือตรงโฉมเมื่อมีการเปลี่ยนระหว่างปี และแสดงเครดิตกับสัญญาอนุญาตใต้ภาพ รุ่นที่ยังไม่มีภาพจะแสดงข้อความแทน

ฐานสเปกรถ**ตลาดไทยจริง** ไม่ได้มาจากไฟล์เทรน เก็บเฉพาะ 20 ยี่ห้อ 115 รุ่นที่โมเดลรู้จัก (ตรงกับ `known_brand_model_pairs` ใน `model/encoder.json`) ปีและสเปกมาจากฐานสเปก บางปีจึงอยู่นอกช่วงข้อมูลเทรน (ฟอร์มมีป้ายกำกับ) ถ้าเทรนโมเดลใหม่ที่มีรุ่นเพิ่ม ต้องเพิ่มแถวของรุ่นนั้นในฐานสเปกด้วย

รูปแบบไฟล์ `data/specs/*.csv` หนึ่งแถว = สเปกชุดหนึ่งในช่วงปีที่ขาย:

```
brand,model,years,cc,fuel,gear,body,source,note
TOYOTA,ALPHARD,2003-2008,2400|3000,gas,AT,Van,wiki:Toyota_Alphard,AH10 นำเข้าอิสระ
```

| คอลัมน์ | ความหมาย |
|---|---|
| `brand`, `model` | ชื่อตรงกับข้อมูลเทรน (ถ้ามี) |
| `years` | `2003-2015` หรือ `2008` |
| `cc`, `fuel`, `gear`, `body` | ใส่หลายค่าด้วย `\|` ได้ (`2500\|3000`, `AT\|MT`) |
| `fuel` | `gas`, `diesel`, `hybrid`, `ev` (ev ใส่ cc=0) |
| `gear` | `AT`, `MT` |
| `body` | `Sedan`, `Hatchback`, `SUV`, `PPV`, `MPV`, `Pickup`, `Van` หรือ `Coupe`, `Convertible`, `Wagon` (แสดงอย่างเดียว ส่งให้โมเดลเป็น Sedan/Hatchback) |
| `source` | ลิงก์อ้างอิง ย่อ `wiki:ชื่อบทความ` ได้ |
| `note` | หมายเหตุ ไม่ใช้ในเว็บ |

แก้ข้อมูลแล้วสร้างใหม่: `python tools/build_specs.py` (ส่งไฟล์ข้อมูลเทรนเป็นอาร์กิวเมนต์ได้ จะสร้าง `data/trained-specs.csv` ใหม่และตรวจว่าทุกรุ่นที่โมเดลรู้จักมีใน dropdown)
`js/specs.js` เก็บเฉพาะสเปกที่ปี ซีซี เชื้อเพลิง และเกียร์ตรงกับ `data/trained-specs.csv` ส่วนตัวถังใช้ตามจริงจาก `data/specs/`
ห้ามแก้ `js/specs.js` ตรง ๆ

คุณภาพข้อมูล: เทียบกับประกาศจริงตรงกัน 97.2% ที่ไม่ตรงส่วนใหญ่เป็นความผิดพลาดของข้อมูลเทรน
รุ่นหายาก/หรู/เก่า/นำเข้าอิสระราว 500 รุ่นคัดจากความรู้ ยังไม่ได้ตรวจกับแหล่งเว็บทุกรุ่น

## 6. Frontend design

- Warm charcoal default theme with coral accent; Thai/English and light/dark switches.
- Compact single-column form beside the selected vehicle photo; price and trend chart below.
- Mobile layout stacks the vehicle photo, form and result. Reduced-motion preferences are respected.
- Vehicle images show no caption; source, author, license and changes for every image are on `credits.html` (linked from the footer).
- Native scrolling and brief result transitions; the earlier Three.js/GSAP/Lenis scene (`js/fx.js`) has been removed.
- The hidden color selector is retained for comparison compatibility; color is not a model feature.

## 7. ทดสอบ

```bash
node tests/parity.mjs
node tests/car-images.mjs
node tests/cache-version.mjs
```

ต้องการ Node ที่รองรับ ES modules (ทดสอบกับ Node 24) ไม่ต้องติดตั้งแพ็กเกจ
ผลที่คาดหวัง: `parity ok: 192 cases, max raw diff 0`

ทดสอบอะไรบ้าง
- 192 กรณีจาก pipeline Python จริง (`tests/cases.json`): รุ่นที่รู้จัก, alias, รุ่น/ยี่ห้อที่ไม่รู้จัก, รถไฟฟ้า, นอกช่วงปี/เครื่องยนต์, ขอบเขตค่า รวมครบ 115 คู่ยี่ห้อ-รุ่นและตัวถัง 7 แบบ
  ต้องได้ราคา, `known_model`, `warnings` ตรงกัน และค่า `raw` ต่างกันไม่เกิน 1
- input ผิดรูปแบบ 15 แบบ ต้อง throw

กรณีทดสอบเป็นข้อมูลสังเคราะห์ ไม่มีแถวข้อมูลจริงจาก CSV

ยังไม่มีทดสอบอัตโนมัติสำหรับหน้า UI ตรวจด้วยตาในเบราว์เซอร์ (มือถือยังทดสอบน้อย)

## 8. งานที่ทำต่อได้

1. เปลี่ยนเป็น `merge50minC` แล้ว: MAE 51,271 บาท บน test ของชุดข้อมูลนี้ (คะแนนรอบเก่า 64,228 บาทมาจากคนละชุดข้อมูล จึงไม่ใช่การเปรียบเทียบบน test เดียวกัน)
2. ตรวจสเปกของรุ่นหางยาว (~500 รุ่น) กับแหล่งอ้างอิงจริง ยังไม่แน่ใจ: Mitsubishi Triton 2005 V6 3.0 เบนซินในไทย, MG5 แฮตช์แบ็ก 2015 มีขายในไทยหรือไม่
3. เตือนเมื่อเลขไมล์ผิดปกติเมื่อเทียบกับอายุรถ
4. ทดสอบบนมือถือ (ทดสอบบนเดสก์ท็อปเป็นหลัก)
5. รถไฟฟ้า: โมเดลไม่เคยเห็น EV ตอนนี้ใช้ Hybrid แทนและเตือน ถ้าจะทำนาย EV จริงต้องหาข้อมูลและเทรนใหม่
6. เทรนโมเดลใหม่ด้วยข้อมูลตลาดปีล่าสุด: ตอนนี้ `NOW` ใน `js/data.js` ตามปีของเครื่องผู้ใช้ (อายุรถจึงเพิ่มขึ้นเองเมื่อข้ามปี) แต่ระดับราคายังเป็นของตลาดปี 2026 ที่ใช้เทรน

## 9. ข้อจำกัดที่ต้องรู้

- เป็นเดโมนักศึกษา ราคาเป็นค่าประมาณ ไม่รับรองความถูกต้อง
- โมเดลเทรนกับรถปี 2006-2026 เครื่อง 1,000-3,500 cc นอกช่วงนี้ยังได้ราคา แต่ไม่น่าเชื่อถือ (มี `warnings`)
- อายุรถคิดจากปีปัจจุบันของเครื่องผู้ใช้ (ไม่ต่ำกว่า 2026) แต่ระดับราคามาจากตลาดปี 2026 เมื่อเวลาผ่านไปราคาจะคลาดจากตลาดจริงมากขึ้น
- ปีที่อยู่นอกช่วงข้อมูลเทรนมีป้าย "นอกช่วงข้อมูลเทรน" ใน dropdown ตั้งแต่ตอนเลือก
- ไม่ใช้สีและตัวถังแบบ Coupe/Convertible/Wagon ในการคำนวณ (สีไม่ใช่ฟีเจอร์ของโมเดล ตัวถังพิเศษถูกแปลงเป็น Sedan/Hatchback)
- ราคาอีก 5 ปีข้างหน้าเป็นการจำลองง่าย ๆ (ไมล์ +15,000 กม./ปี) ไม่ใช่การพยากรณ์ตลาด

## 10. ธรรมเนียมการทำงาน

- ไม่มี dependency ให้เพิ่มโดยไม่จำเป็น เก็บแบบเรียบง่าย
- ก่อนอ้างว่าเสร็จ ให้รัน `node tests/parity.mjs` และเปิดดูหน้าเว็บในเบราว์เซอร์
- ข้อความคอมมิตเป็นภาษาไทย ขึ้นต้นด้วยเลขเวอร์ชัน `v0.x.y`
- ไม่ commit ไฟล์ข้อมูลเทรน (CSV ชุดข้อมูล) ลง repo นี้ ซึ่งเป็น repo สาธารณะ
