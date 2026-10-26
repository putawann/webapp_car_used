// ข้อมูลของเว็บ: คำแปล, ตัวเรียกโมเดลทำนายราคา, รูปทรงรถสำหรับฉากหลัง
export const T={
th:{brandName:"CarPrice",tag:"เดโม่",title:"ประเมินราคารถมือสองในไม่กี่วินาที",heroSub:"เลือกยี่ห้อ รุ่น ปี และสภาพรถ แล้วดูราคาโดยประมาณพร้อมช่วงราคาที่เป็นไปได้",formTitle:"ข้อมูลรถ",formSub:"กรอกข้อมูลแล้วกดทำนายราคา",gCar:"รถ",gCond:"สภาพ",gEng:"เครื่องยนต์",brand:"ยี่ห้อ",model:"รุ่น",year:"ปีรถ (ค.ศ.)",mileage:"เลขไมล์",trans:"เกียร์",at:"อัตโนมัติ",mt:"ธรรมดา",fuel:"เชื้อเพลิง",gas:"เบนซิน",diesel:"ดีเซล",hybrid:"ไฮบริด",ev:"ไฟฟ้า",motor:"มอเตอร์ไฟฟ้า",cc:"ขนาดเครื่องยนต์",go:"ทำนายราคา",resTitle:"ราคาที่ทำนาย",empty:"ยังไม่มีผล กรอกข้อมูลแล้วกดปุ่มทำนายราคา",note:"หมายเหตุ: นี่คือเดโม่ ราคามาจากโมเดล XGBoost ที่เทรนจากข้อมูล new_car_dataset (v5) ทดสอบกับชุด test ได้ R² 0.94 และคลาดเคลื่อนเฉลี่ย (MAE) ราว 64,000 บาท เป็นราคาโดยประมาณ ไม่ใช่ราคาซื้อขายจริง",noteReport:"รายงานการเทรน",noteSpace:"โมเดลบน Hugging Face",wake:"กำลังปลุกเซิร์ฟเวอร์ (ครั้งแรกอาจใช้ถึง 1 นาที)",err:"เชื่อมต่อโมเดลไม่ได้ กรุณาลองอีกครั้ง",retry:"ลองอีกครั้ง",est:"ราคาโดยประมาณ",rng:"ช่วงที่เป็นไปได้",baht:"บาท",eMile:"เลขไมล์ต้องอยู่ระหว่าง 0-999,999",gSpec:"สเปค",spec:"ขนาดเครื่อง · เชื้อเพลิง · เกียร์ · ตัวถัง",color:"สี",body:"ตัวถัง",src:"ที่มาของสเปค:",examples:"ลองตัวอย่าง:",cTitle:"ราคาในอีก 5 ปีข้างหน้า",cNote:"สมมติขับปีละ 15,000 กม.",cAlt:"กราฟราคารถรายปี",pin:"เก็บไว้เทียบ",pinned:"เก็บไว้แล้ว ทำนายอีกคันเพื่อเทียบ",cmpTitle:"เปรียบเทียบ 2 คัน",cmpA:"คัน A",cmpB:"คัน B",cmpWait:"ทำนายราคารถอีกคันเพื่อดูผลเปรียบเทียบ",cmpDiff:"ส่วนต่าง (B − A)",clear:"ล้างการเปรียบเทียบ",car:"รถ",price:"ราคา",dark:"โหมดมืด",light:"โหมดสว่าง",hello:"สวัสดีคนขับ #",start:"เริ่มประเมินราคา",play:"เล่นแอนิเมชัน",pause:"หยุดแอนิเมชัน",sound:"เสียงประกอบ",untrained:"รุ่นหรือสเปคนี้ไม่มีในข้อมูลที่ใช้เทรน ราคาอาจคลาดเคลื่อนมากกว่าปกติ",
  bodies:{Coupe:"คูเป้",Convertible:"เปิดประทุน",Wagon:"แวกอน",Hatchback:"แฮทช์แบ็ก",MPV:"เอ็มพีวี",PPV:"พีพีวี",Pickup:"กระบะ",SUV:"เอสยูวี",Sedan:"ซีดาน",Van:"รถตู้"},
  colors:{White:"ขาว",Black:"ดำ","Grey Bronze":"เทาบรอนซ์",Grey:"เทา",Red:"แดง","Silver Bronze":"บรอนซ์เงิน",Silver:"เงิน",Brown:"น้ำตาล",Blue:"น้ำเงิน",Orange:"ส้ม",Green:"เขียว","Light Blue":"ฟ้าอ่อน",Yellow:"เหลือง",Others:"อื่นๆ",Golden:"ทองเหลือง",Gold:"ทอง","Sky Blue":"ฟ้า",Cream:"ครีม",Purple:"ม่วง",Pink:"ชมพู",Beige:"เบจ"}},
en:{brandName:"CarPrice",tag:"Demo",title:"Estimate a used car's price in seconds",heroSub:"Pick the brand, model, year and condition to see an estimated price and a likely range.",formTitle:"Car details",formSub:"Fill in the details, then predict the price",gCar:"Car",gCond:"Condition",gEng:"Engine",brand:"Brand",model:"Model",year:"Year",mileage:"Mileage",trans:"Transmission",at:"Automatic",mt:"Manual",fuel:"Fuel",gas:"Gasoline",diesel:"Diesel",hybrid:"Hybrid",ev:"Electric",motor:"Electric motor",cc:"Engine size",go:"Predict price",resTitle:"Predicted price",empty:"No result yet. Fill in the form and press Predict.",note:"Note: this is a demo. The price comes from an XGBoost model trained on new_car_dataset (v5); on the held-out test set it scores R² 0.94 with a mean absolute error (MAE) of about 64,000 THB. It is an estimate, not a real offer.",noteReport:"Training report",noteSpace:"Model on Hugging Face",wake:"Waking the server (first call may take up to a minute)",err:"Could not reach the model. Please try again.",retry:"Retry",est:"Estimated price",rng:"Likely range",baht:"THB",eMile:"Mileage must be between 0 and 999,999",gSpec:"Spec",spec:"Engine · fuel · gearbox · body",color:"Color",body:"Body",src:"Spec source:",examples:"Try an example:",cTitle:"Price over the next 5 years",cNote:"Assumes 15,000 km per year",cAlt:"Yearly price chart",pin:"Save for comparison",pinned:"Saved. Predict another car to compare.",cmpTitle:"Compare two cars",cmpA:"Car A",cmpB:"Car B",cmpWait:"Predict another car to see the comparison",cmpDiff:"Difference (B − A)",clear:"Clear comparison",car:"Car",price:"Price",dark:"Dark mode",light:"Light mode",hello:"Hello Driver #",start:"Start estimate",play:"Play animation",pause:"Pause animation",sound:"Sound effects",untrained:"This model or spec is not in the training data, so the price may be less accurate.",bodies:{},colors:{}}
};
/* ===== เชื่อมโมเดลจริง: XGBoost (v5, new_car_dataset) ที่เสิร์ฟจาก Hugging Face Space =====
   x = {brand,model,year,mileage,trans,fuel,cc,body,shape,color}  (ค่าทั้งหมดมาจากสเปคที่มีจริงใน specs.js ยกเว้นเลขไมล์)
   body เป็นหมวดตัวถังที่มีในข้อมูลเทรนเสมอ (คูเป้/เปิดประทุน → Sedan, แวกอน → Hatchback) ส่วน shape คือตัวถังจริง
   Space รับทั้งลิสต์ในคำขอเดียว (ราคาตอนนี้ + อีก 5 ปี) แล้วคืน [{price,known_model,warnings}]
   known_model=false หรือมี warnings (รุ่น/ยี่ห้อ/ปี/เครื่องยนต์/ไฟฟ้า ที่ไม่มีในข้อมูลเทรน) → untrained=true */
export const NOW=2026;
const HF_USER="REPLACE_WITH_HF_USERNAME"; // ชื่อผู้ใช้ Hugging Face เจ้าของ Space car-price-xgb-new-cardb
export const SPACE_PAGE=`https://huggingface.co/spaces/${HF_USER}/car-price-xgb-new-cardb`;
const API=`https://${HF_USER.toLowerCase().replace(/[._]/g,"-")}-car-price-xgb-new-cardb.hf.space`;
export async function predictPrices(xs){
  const ctl=new AbortController(),to=setTimeout(()=>ctl.abort(),90000); // เซิร์ฟเวอร์ฟรีหลับอยู่ ปลุกครั้งแรกอาจนาน
  try{
    const r=await fetch(API+"/predict",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(xs),signal:ctl.signal});
    if(!r.ok)throw new Error("HTTP "+r.status);
    const d=await r.json(); // ตรวจผลจาก API ก่อนนำไปแสดง (ห้ามเชื่อ response ภายนอกตรงๆ)
    if(!Array.isArray(d)||d.length!==xs.length)throw new Error("bad response");
    return d.map(o=>{const p=Number(o?.price);if(!Number.isFinite(p)||p<0)throw new Error("bad price");
      return {price:p,untrained:o.known_model!==true||(Array.isArray(o.warnings)&&o.warnings.length>0)}});
  }finally{clearTimeout(to)}
}
// ตัวอย่างสำเร็จรูป: ยี่ห้อ, รุ่น, ปี, ไมล์ (ใช้สเปคที่พบบ่อยสุดของปีนั้น)
export const EX=[["TOYOTA","CAMRY",2018,80000],["HONDA","CIVIC",2020,50000],["TOYOTA","HILUX REVO",2019,90000],["NISSAN","ALMERA",2021,30000],["MAZDA","CX-5",2019,70000]];
// รูปทรงรถด้านข้าง หน่วย: พื้นถนน y=51 จุดกลางรถ (32,36) หันหน้าไปทางขวา
// [ตัวรถ, หน้าต่าง, x ล้อหลัง, x ล้อหน้า, รัศมีล้อ]
export const TYPES=[
  ["M5 44v-6c0-2 1.2-3.2 3-3.5l6-1 6-7c1.2-1.5 2.6-2.5 4.5-2.5h11c1.6 0 3 .7 4 2l5 6.5 9 1.5c3 .5 5 2.5 5 5.5v4.5z","M21.5 32l4-5.5c.6-.8 1.3-1.2 2.3-1.2H30v6.7z M31.5 25.3h3.6c1.2 0 2.2.5 3 1.5l4.4 5.2H31.5z",16,48,5], // ซีดาน
  ["M4 45V29c0-4 2-8 6-8.5L39 20c2 0 3.2.8 4.2 2.2L48 29.5l8 1.3c2.5.4 4 2.2 4 4.8V45z","M7 29v-4c0-1.6 1-2.8 2.6-2.8H15V29z M17 22.2h9V29h-9z M28 22.2h10c1 0 1.8.4 2.4 1.3L44.5 29H28z",15,49,5.6], // SUV
  ["M3 44V33h23.5V24c0-1 .8-2 2-2H38c1.4 0 2.6.6 3.4 1.8L46 30.5l9.5 1.4c2.6.4 4.5 2.4 4.5 5V44z","M28.5 30v-5.6c0-.6.4-1 1-1H38c.8 0 1.4.3 1.9 1l4.2 5.6z",13,48,5.4], // กระบะ
  ["M7 44V34c0-1 .2-2 .6-3L11 25.5c.7-1.3 2-2 3.5-2H32c1.6 0 3 .7 4 2l6.5 7 7.5 1.3c2.6.5 4.5 2.6 4.5 5.2V44z","M10.5 31.5l2.4-5c.5-1 1.3-1.5 2.4-1.5H23v6.5z M25 25h7c1 0 1.9.4 2.6 1.2L39.8 31.5H25z",15,46,4.8], // แฮทช์แบ็ก
  ["M4 45V23c0-2.5 2-4.5 4.5-4.5H43c1.8 0 3.4.8 4.4 2.3L55 30.5l2 .6c1.8.6 3 2.2 3 4.1V45z","M7 29v-6c0-1 .8-1.8 1.8-1.8H17V29z M19 21.2h10V29H19z M31 21.2h11.5c1 0 1.9.5 2.5 1.3L50.2 29H31z",14,49,5.2], // รถตู้
  ["M5 44v-5c0-2 1-3.2 2.8-3.6L10 35l10-6c1.4-.8 3-1.3 4.6-1.3H30c1.6 0 3 .6 4 1.8l6 4.8 13.5 1.6c3.4.4 6.5 2.6 6.5 5.6V44z","M18.5 33.5l5.6-3.6c.8-.5 1.7-.8 2.7-.8H30c1 0 1.8.4 2.6 1l4.4 3.4z",15,48,4.9] // สปอร์ต
];
