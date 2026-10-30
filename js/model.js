// ===== โมเดล XGBoost รันในเบราว์เซอร์: อ่าน JSON ครั้งเดียวแล้วคำนวณเอง ไม่มีเซิร์ฟเวอร์ =====
// ค่าและลำดับคอลัมน์ต้องตรงกับ FoldOneHot + tools/model_reference.py (มี tests/parity.mjs คุมไว้)
const MODEL_ID="XGB_merge50minC";
const TREES_URL=new URL("../model/xgb_merge50minc_trees.json",import.meta.url);
const ENCODER_URL=new URL("../model/encoder.json?v=merge50minc",import.meta.url);
const BODIES=["Sedan","Hatchback","Pickup","Van","SUV","PPV","MPV"];
const FUELS=["gas","diesel","hybrid","ev"];
const GEARS=["AT","MT"];
// web value -> training value
const FUEL={gas:"Benzine",diesel:"Diesel",hybrid:"Hybrid",ev:"Hybrid"},GEAR={AT:"Automatic",MT:"Manual"};

let cache=null;
// โหลด JSON ครั้งเดียวและแคช promise ไว้; ถ้าพลาดให้ล้างแคชเพื่อให้ปุ่ม Retry ลองใหม่ได้
function load(){
  if(!cache){
    const p=Promise.all([TREES_URL,ENCODER_URL].map(u=>fetch(u).then(r=>{
      if(!r.ok)throw new Error("model load failed: HTTP "+r.status);
      return r.json();
    }))).then(([trees,encoder])=>({trees,encoder}));
    cache=p;
    p.catch(()=>{if(cache===p)cache=null});
  }
  return cache;
}
export function modelReady(){return load().then(()=>undefined)}
// ตรวจชนิด/ช่วงให้ตรงกับ pydantic Car ใน app.py
function strField(c,k,lo,hi,tag){
  const v=c[k];
  if(typeof v!=="string")throw new Error(`${tag}.${k} must be a string`);
  const n=[...v].length; // pydantic นับเป็นตัวอักษร (code point)
  if(n<lo||n>hi)throw new Error(`${tag}.${k} must be ${lo}-${hi} characters`);
}
function intField(c,k,lo,hi,tag){
  const v=c[k];
  if(typeof v!=="number"||!Number.isInteger(v))throw new Error(`${tag}.${k} must be an integer`);
  if(v<lo||v>hi)throw new Error(`${tag}.${k} must be between ${lo.toLocaleString("en-US")} and ${hi.toLocaleString("en-US")}`);
}
function enumField(c,k,allowed,tag){
  if(!allowed.includes(c[k]))throw new Error(`${tag}.${k} must be one of ${allowed.join(", ")}`);
}
function checkCar(c,tag){
  if(!c||typeof c!=="object")throw new Error(`${tag} must be an object`);
  strField(c,"brand",1,60,tag);
  strField(c,"model",1,80,tag);
  intField(c,"year",1900,2100,tag);
  intField(c,"mileage",0,999999,tag);
  enumField(c,"trans",GEARS,tag);
  enumField(c,"fuel",FUELS,tag);
  intField(c,"cc",0,10000,tag);
  enumField(c,"body",BODIES,tag);
  for(const k of ["shape","color"])if(c[k]!=null&&typeof c[k]!=="string")throw new Error(`${tag}.${k} must be a string or null`);
}
// round ครึ่งเป็นคู่ (เหมือน Python round) แล้วคูณ 1000; app.py: max(0, round(p/1000)*1000)
function pyRound(x){
  const f=Math.floor(x),d=x-f;
  if(d>0.5)return f+1;
  if(d<0.5)return f;
  return f%2===0?f:f+1;
}
function compile({trees,encoder}){
  if(!trees||!Array.isArray(trees.trees)||!encoder)throw new Error("invalid model data");
  if(trees.model_id!==MODEL_ID||encoder.model_id!==MODEL_ID)throw new Error("model version mismatch");
  const cats=encoder.categorical_columns,offsets=[];
  let at=encoder.numeric_columns.length;
  for(const c of cats){offsets.push(at);at+=c.levels.length}
  if(at!==encoder.n_features||at!==trees.n_features)throw new Error("model column count mismatch");
  return {
    // threshold/leaf ถูกเก็บเป็น float32 ในโมเดล: แปลงตั้งแต่ต้นแล้วบวก/เทียบใน float32 ให้ตรงเป๊ะ
    trees:trees.trees.map(t=>({f:t.f,l:t.l,r:t.r,d:t.d,v:Float32Array.from(t.v),th:Float32Array.from(t.t)})),
    base:trees.base_score,n:at,num:encoder.numeric_columns,cats,offsets,
    maps:cats.map(c=>new Map(c.levels.map((v,i)=>[v,i]))),
    pairs:new Set(encoder.known_brand_model_pairs),
    keys:new Map(Object.entries(encoder.model_key_map)),
    aliases:encoder.model_aliases||{},
    year:encoder.CURRENT_YEAR,eng:encoder.engine_range,yrs:encoder.year_range,
    unknown:encoder.unknown_model,
    body:encoder.body_map,
  };
}
// model_def.model_key_of: upper-case, เก็บ A-Z0-9, แล้วแทน alias
function modelKey(m,aliases){
  const k=m.toUpperCase().replace(/[^A-Z0-9]/g,"");
  return aliases[k]??k;
}
function predictOne(m,c,refYear){
  const brand=c.brand.trim().toUpperCase();
  const key=modelKey(c.model,m.aliases);
  const name=m.keys.get(`${brand}|${key}`);
  const known=name!==undefined&&m.pairs.has(`${brand}|${name}`);
  const warnings=[];
  if(c.fuel==="ev")warnings.push("ev_not_in_training");
  if(!(m.eng[0]<=c.cc&&c.cc<=m.eng[1]))warnings.push("engine_outside_training_range");
  if(!(m.yrs[0]<=c.year&&c.year<=m.yrs[1]))warnings.push("year_outside_training_range");
  // แถวเดียวกับ to_features(): numeric ตามลำดับ แล้ว one-hot ทุก categorical
  const v=new Float64Array(m.n),vals={engine:c.cc,mileage:c.mileage,car_age:refYear-c.year};
  for(let i=0;i<m.num.length;i++)v[i]=vals[m.num[i]];
  const row={brand,model:known?name:m.unknown,car_type:m.body[c.body],fuel:FUEL[c.fuel],gear:GEAR[c.trans]};
  for(let i=0;i<m.cats.length;i++){
    const j=m.maps[i].get(row[m.cats[i].name]);
    if(j!==undefined)v[m.offsets[i]+j]=1; // ค่า unseen/reference = dummy 0 ทั้งแถว เหมือน pipeline
  }
  // XGBoost: ไปซ้ายเมื่อ x < threshold (strict); x เป็นจำนวนเต็ม/one-hot และ th เป็น float32 แล้ว (เทียบเท่า Math.fround)
  // สะสมทีละต้นเป็น float32 (Float32Array) ให้ตรงกับ XGBoost ที่บวกในหน่วยความจำ float32
  const acc=new Float32Array(1);acc[0]=m.base;
  for(const t of m.trees){
    let i=0;
    const f=t.f,th=t.th,lc=t.l,rc=t.r,dl=t.d,val=t.v;
    while(lc[i]!==-1){
      const x=v[f[i]];
      const go=Number.isNaN(x)?dl[i]===1:x<th[i];
      i=go?lc[i]:rc[i];
    }
    acc[0]=acc[0]+val[i];
  }
  const raw=acc[0];
  return {price:Math.max(0,pyRound(raw/1000)*1000),raw,known_model:known,warnings};
}
// refYear: ปีที่ใช้คิดอายุรถ ค่าเริ่มต้นคือ CURRENT_YEAR ตอนเทรน (tests/parity.mjs ใช้ค่านี้)
export async function predictCars(list,data,{refYear}={}){
  if(!Array.isArray(list)||list.length===0)throw new Error("cars must be a non-empty array");
  list.forEach((c,i)=>checkCar(c,`cars[${i}]`));
  const m=compile(data||await load());
  return list.map(c=>predictOne(m,c,refYear??m.year));
}
