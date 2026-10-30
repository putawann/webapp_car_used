// ข้อมูลของเว็บ: คำแปล, ตัวเรียกโมเดลทำนายราคา, ตัวอย่างรถ
import {predictCars} from "./model.js";
export const T={
th:{brandName:"CarPrice",tag:"เดโม่",title:"ประเมินราคารถมือสองในไม่กี่วินาที",heroSub:"เลือกยี่ห้อ รุ่น ปี และสภาพรถ แล้วดูราคาโดยประมาณพร้อมช่วงราคาที่เป็นไปได้",formTitle:"ข้อมูลรถ",formSub:"กรอกข้อมูลแล้วกดทำนายราคา",gCar:"รถ",gCond:"สภาพ",gEng:"เครื่องยนต์",brand:"ยี่ห้อ",model:"รุ่น",year:"ปีรถ (ค.ศ.)",mileage:"เลขไมล์",trans:"เกียร์",at:"อัตโนมัติ",mt:"ธรรมดา",fuel:"เชื้อเพลิง",gas:"เบนซิน",diesel:"ดีเซล",hybrid:"ไฮบริด",ev:"ไฟฟ้า",motor:"มอเตอร์ไฟฟ้า",cc:"ขนาดเครื่องยนต์",go:"ทำนายราคา",resTitle:"ราคา",empty:"ยังไม่มีผล กรอกข้อมูลแล้วกดปุ่มทำนายราคา",note:"โมเดล XGBoost ที่เทรนจากชุดข้อมูล v5 (R² ทดสอบ 0.946, MAE ประมาณ 51,000 บาท)",noteReport:"รายงานการเทรน",load:"กำลังโหลดโมเดล…",err:"เชื่อมต่อโมเดลไม่ได้ กรุณาลองอีกครั้ง",retry:"ลองอีกครั้ง",est:"ราคาโดยประมาณ",rng:"ช่วงที่เป็นไปได้",baht:"บาท",eMile:"เลขไมล์ต้องเป็นจำนวนเต็ม 0-300,000 (ช่วงที่มีในข้อมูลเทรน)",gSpec:"สเปค",spec:"ขนาดเครื่อง · เชื้อเพลิง · เกียร์ · ตัวถัง",color:"สี",body:"ตัวถัง",src:"ที่มาของสเปค:",examples:"ลองตัวอย่าง:",cTitle:"ราคา 5 ปีข้างหน้า",cNote:"สมมติขับปีละ 15,000 กม.",cAlt:"กราฟราคารถรายปี",pin:"เก็บไว้เทียบ",pinned:"เก็บไว้แล้ว ทำนายอีกคันเพื่อเทียบ",cmpTitle:"เปรียบเทียบ",cmpA:"คัน A",cmpB:"คัน B",cmpWait:"ทำนายราคารถอีกคันเพื่อดูผลเปรียบเทียบ",cmpDiff:"ส่วนต่าง (B − A)",clear:"ล้างการเปรียบเทียบ",car:"รถ",price:"ราคา",dark:"โหมดมืด",light:"โหมดสว่าง",hello:"สวัสดีคนขับ #",start:"เริ่มประเมินราคา",play:"เล่นแอนิเมชัน",pause:"หยุดแอนิเมชัน",untrained:"รุ่นหรือสเปคนี้ไม่มีในข้อมูลที่ใช้เทรน ราคาอาจคลาดเคลื่อนมากกว่าปกติ",
  bodies:{Coupe:"คูเป้",Convertible:"เปิดประทุน",Wagon:"แวกอน",Hatchback:"แฮทช์แบ็ก",MPV:"เอ็มพีวี",PPV:"พีพีวี",Pickup:"กระบะ",SUV:"เอสยูวี",Sedan:"ซีดาน",Van:"รถตู้"},
  colors:{White:"ขาว",Black:"ดำ","Grey Bronze":"เทาบรอนซ์",Grey:"เทา",Red:"แดง","Silver Bronze":"บรอนซ์เงิน",Silver:"เงิน",Brown:"น้ำตาล",Blue:"น้ำเงิน",Orange:"ส้ม",Green:"เขียว","Light Blue":"ฟ้าอ่อน",Yellow:"เหลือง",Others:"อื่นๆ",Golden:"ทองเหลือง",Gold:"ทอง","Sky Blue":"ฟ้า",Cream:"ครีม",Purple:"ม่วง",Pink:"ชมพู",Beige:"เบจ"}},
en:{brandName:"CarPrice",tag:"Demo",title:"Know your car’s value",heroSub:"Pick the brand, model, year and condition to see an estimated price and a likely range.",formTitle:"Car details",formSub:"Fill in the details, then predict the price",gCar:"Car",gCond:"Condition",gEng:"Engine",brand:"Brand",model:"Model",year:"Year",mileage:"Mileage",trans:"Transmission",at:"Automatic",mt:"Manual",fuel:"Fuel",gas:"Gasoline",diesel:"Diesel",hybrid:"Hybrid",ev:"Electric",motor:"Electric motor",cc:"Engine size",go:"Predict price",resTitle:"Price",empty:"No result yet. Fill in the form and press Predict.",note:"XGBoost trained on v5 data (test R² 0.946, MAE about 51,000 THB)",noteReport:"Training report",load:"Loading model…",err:"Could not reach the model. Please try again.",retry:"Retry",est:"Estimated price",rng:"Likely range",baht:"THB",eMile:"Mileage must be a whole number from 0 to 300,000 (the training data range)",gSpec:"Spec",spec:"Engine · fuel · gearbox · body",color:"Color",body:"Body",src:"Spec source:",examples:"Try an example:",cTitle:"Price, next 5 years",cNote:"Assumes 15,000 km per year",cAlt:"Yearly price chart",pin:"Save for comparison",pinned:"Saved. Predict another car to compare.",cmpTitle:"Compare",cmpA:"Car A",cmpB:"Car B",cmpWait:"Predict another car to see the comparison",cmpDiff:"Difference (B − A)",clear:"Clear comparison",car:"Car",price:"Price",dark:"Dark mode",light:"Light mode",hello:"Hello Driver #",start:"Start estimate",play:"Play animation",pause:"Pause animation",untrained:"This model or spec is not in the training data, so the price may be less accurate.",bodies:{},colors:{}}
};
/* ===== โมเดลจริง: XGBoost (v5, merge50minC) รันในเบราว์เซอร์จาก model/*.json =====
   x = {brand,model,year,mileage,trans,fuel,cc,body,shape,color}  (ค่าทั้งหมดมาจากสเปคที่มีจริงใน specs.js ยกเว้นเลขไมล์)
   body เป็นหมวดตัวถังที่มีในข้อมูลเทรนเสมอ (คูเป้/เปิดประทุน → Sedan, แวกอน → Hatchback) ส่วน shape คือตัวถังจริง
   predictCars รับทั้งลิสต์ (ราคาตอนนี้ + อีก 5 ปี) แล้วคืน [{price,raw,known_model,warnings}]
   known_model=false หรือมี warnings (รุ่น/ยี่ห้อ/ปี/เครื่องยนต์/ไฟฟ้า ที่ไม่มีในข้อมูลเทรน) → untrained=true */
// ปีปัจจุบันตามเครื่องผู้ใช้ ใช้ทั้งป้ายปีบนกราฟและอายุรถ (car_age) ไม่ต่ำกว่าปีที่เทรนโมเดล (2026) กันนาฬิกาเครื่องผิด
export const NOW=Math.max(2026,new Date().getFullYear());
T.th.title="รู้มูลค่ารถของคุณ";
T.th.heroSub="ประเมินราคารถมือสองได้ง่าย ๆ เพื่อใช้ประกอบการตัดสินใจขายหรือเปลี่ยนรถ";
T.th.rng="ช่วงราคาแสดงผล";
T.en.rng="Display range";
T.th.credits="เครดิตภาพ";
T.en.credits="Image credits";
Object.assign(T.th,{brandStep:"01",chooseBrand:"แบรนด์",modelStep:"02",chooseModel:"รุ่น",modelHint:"เลื่อนซ้าย–ขวาเพื่อเลือกรุ่น หรือคลิกที่รูปรถ",modelList:"เลือกจากรายชื่อรุ่น",previousModel:"รุ่นก่อนหน้า",nextModel:"รุ่นถัดไป",selectedModel:"เลือกแล้ว",noModels:"ไม่พบรุ่นรถ",noImage:"ยังไม่มีภาพรุ่นนี้",detailsStep:"03",formSub:"ระบุปี สเปก และเลขไมล์ เพื่อประเมินราคารถของคุณ",go:"ประเมินราคา"});
Object.assign(T.en,{brandStep:"01",chooseBrand:"Brand",modelStep:"02",chooseModel:"Model",modelHint:"Scroll left or right to select, or click a car",modelList:"Choose from the model list",previousModel:"Previous model",nextModel:"Next model",selectedModel:"Selected",noModels:"No models available",noImage:"Image unavailable",detailsStep:"03",formSub:"Add the year, specifications and mileage to estimate your car’s value",go:"Estimate price"});
T.th.specHint="สเปคของรุ่นนี้ในปีนี้ที่มีในข้อมูลเทรน (กดเพื่อกรอก):";
T.en.specHint="Specs for this model and year in the training data (tap to fill):";
export async function predictPrices(xs){
  if(!Array.isArray(xs)||xs.length===0)throw new Error("cars must be a non-empty array");
  const d=await predictCars(xs,undefined,{refYear:NOW}); // ตรวจผลก่อนนำไปแสดง (ห้ามเชื่อข้อมูลภายนอกตรงๆ)
  if(!Array.isArray(d)||d.length!==xs.length)throw new Error("bad response");
  return d.map(o=>{const p=Number(o?.price);if(!Number.isFinite(p)||p<0)throw new Error("bad price");
    return {price:p,untrained:o.known_model!==true||(Array.isArray(o.warnings)&&o.warnings.length>0)}});
}
// ตัวอย่างสำเร็จรูป: ยี่ห้อ, รุ่น, ปี, ไมล์ (ใช้สเปคที่พบบ่อยสุดของปีนั้น)
export const EX=[["TOYOTA","CAMRY",2018,80000],["HONDA","CIVIC",2020,50000],["TOYOTA","HILUX REVO",2019,90000],["NISSAN","ALMERA",2021,30000],["MAZDA","CX-5",2019,70000]];
