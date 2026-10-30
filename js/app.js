// ===== ตัวหน้าเว็บ: ฟอร์ม ทำนายราคา แสดงผล ภาษา/ธีม =====
import {T,NOW,predictPrices} from "./data.js";
import {modelReady} from "./model.js";
import {SPEC,BODY,BODY_MODEL,COLORS,SRC} from "./specs.js";

import {initUI,scrollToEl,scramble,refresh} from "./ui.js";
import {createModelCarousel} from "./model-carousel.js";

const $=id=>document.getElementById(id);
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const store=(k,v)=>{try{localStorage[k]=v}catch(e){}};
let lang,theme;
try{lang=localStorage.lang;theme=localStorage.theme}catch(e){}
if(lang!=="th"&&lang!=="en")lang="th"; // ค่าที่เก็บไว้อาจเสีย/ถูกแก้ ต้องไม่ทำให้ทั้งหน้าพัง
if(theme!=="dark"&&theme!=="light")theme="light";
let cur=null,pinned=null,seq=0,typed=null,tw=0,tt=0,failed=false,modelLoaded=false;
// รายการยี่ห้อและรุ่นต้องตรงกับคู่ที่โมเดลรู้จัก ไม่ใช่ทุกคู่ในฐานสเปกรถ
let trainedModels={};
let carImages=[];
const carousel=createModelCarousel({track:$("modelTrack"),previous:$("modelPrev"),next:$("modelNext"),status:$("modelStatus"),
  onSelect:model=>{$("model").value=model;fillYears()}});
function paintCarPhoto(){
  carousel.update({brand:$("brand").value,models:trainedModels[$("brand").value]||[],selected:$("model").value,
    year:Number($("year").value),cars:carImages,labels:T[lang]});
}
const SVG=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const SUN=SVG('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>');
const MOON=SVG('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>');
const PLAY=SVG('<path d="M8 5v14l11-7z" fill="currentColor"/>'),PAUSE=SVG('<path d="M9 5v14M15 5v14"/>');
const r1=n=>Math.round(n/1000)*1000;
const fmt=n=>n.toLocaleString(lang==="th"?"th-TH":"en-US");
const sgn=v=>(v<0?"−":"+")+fmt(r1(Math.abs(v)));

function paint(animate){
  const t=T[lang],lo=r1(cur.price*0.92),hi=r1(cur.price*1.08);
  $("out").innerHTML=`<div class="${animate?"fade":""}"><p class="range">${t.est}</p><div class="price"><span id="pv">${fmt(cur.price)}</span> ${t.baht}</div><p class="range">${t.rng} <small>(±8%)</small></p><div class="bar"><b></b></div><div class="ends"><span>${fmt(lo)}</span><span>${fmt(hi)}</span></div><p class="car-summary">${cur.x.brand} ${cur.x.model} · ${cur.x.year} · ${fmt(cur.x.mileage)} km</p><button class="ghost" id="pin" type="button">${t.pin}</button>${cur.untrained?`<p class="hint">${t.untrained}</p>`:""}</div>`;
  $("pin").onclick=()=>{pinned=cur;paintCmp();refresh()};
  if(animate)scramble($("pv"),fmt(cur.price));
  paintMore();paintCmp();
}
function paintMore(){
  const t=T[lang];
  $("more").hidden=false;
  const f=cur.fut,W=360,H=170,PX=34,TOP=24,BOT=30,top=Math.max(...f)*1.05;
  const X=i=>PX+i*(W-2*PX)/(f.length-1),Y=v=>TOP+(H-TOP-BOT)*(1-v/top);
  $("chart").innerHTML=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${t.cAlt}: ${fmt(f[0])} → ${fmt(f[f.length-1])} ${t.baht}"><line x1="${PX}" x2="${W-PX}" y1="${H-BOT}" y2="${H-BOT}" stroke="var(--line)"/><polyline fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-linejoin="round" points="${f.map((v,i)=>X(i)+","+Y(v)).join(" ")}"/>${f.map((v,i)=>`<line x1="${X(i)}" x2="${X(i)}" y1="${TOP}" y2="${H-BOT}" stroke="var(--line)" stroke-dasharray="2 3"/><rect x="${X(i)-4}" y="${Y(v)-4}" width="8" height="8" transform="rotate(45 ${X(i)} ${Y(v)})" fill="var(--accent)"/><text x="${X(i)}" y="${H-10}" text-anchor="middle">${NOW+i}</text>`).join("")}<text x="${X(0)}" y="${Y(f[0])-10}" text-anchor="middle">${fmt(f[0])}</text><text x="${X(f.length-1)}" y="${Y(f[f.length-1])-10}" text-anchor="middle">${fmt(f[f.length-1])}</text></svg><p class="hint">${t.cNote}</p>`;
}
function paintCmp(){
  const t=T[lang];
  $("cmp").hidden=!pinned;
  if(!pinned)return;
  const B=cur!==pinned?cur:null;
  const rows=[[t.car,c=>`${c.x.brand} ${c.x.model}`],[t.year,c=>c.x.year],[t.mileage,c=>fmt(c.x.mileage)+" km"],[t.trans,c=>t[c.x.trans==="AT"?"at":"mt"]],[t.fuel,c=>t[c.x.fuel]],[t.cc,c=>fmt(c.x.cc)+" cc"],[t.body,c=>t.bodies[c.x.shape]||c.x.shape],[t.color,c=>t.colors[c.x.color]||c.x.color]];
  let h=`<span></span><span class="h">${t.cmpA}</span><span class="h">${t.cmpB}</span>`;
  rows.forEach(([k,f])=>h+=`<span class="k">${k}</span><span>${f(pinned)}</span><span>${B?f(B):"—"}</span>`);
  h+=`<span class="k">${t.price}</span><span class="p">${fmt(pinned.price)}</span><span class="p">${B?fmt(B.price):"—"}</span>`;
  if(B){const d=B.price-pinned.price,pc=(d/pinned.price*100).toFixed(1);
    h+=`<span class="k">${t.cmpDiff}</span><span></span><span class="p ${d<0?"dn":"up"}">${sgn(d)} (${d<0?"−":"+"}${Math.abs(pc)}%)</span>`}
  else h+=`<span class="hint" style="grid-column:1/-1">${t.cmpWait}</span>`;
  $("cmpBody").innerHTML=`<div class="cmp">${h}</div>`;
}
function render(){
  document.documentElement.lang=lang;
  document.documentElement.dataset.theme=theme;
  document.querySelectorAll("[data-i]").forEach(e=>e.textContent=T[lang][e.dataset.i]);
  document.querySelectorAll("[data-al]").forEach(e=>e.setAttribute("aria-label",T[lang][e.dataset.al]));
  $("langBtn").setAttribute("aria-checked",lang==="en");
  $("themeBtn").innerHTML=theme==="dark"?SUN:MOON;
  $("themeBtn").setAttribute("aria-label",theme==="dark"?T[lang].light:T[lang].dark);
  document.title=T[lang].brandName+" - "+T[lang].title;


  fillYears(true);fillColors(); // ป้ายใน dropdown เปลี่ยนตามภาษา
  if(document.querySelector("input[aria-invalid=true]"))check();
  if(failed)showErr();
  if(cur&&!failed)paint(false);else paintCmp();
}

// ===== ฟอร์ม: ยี่ห้อ → รุ่น → ปี → ซีซี → เชื้อเพลิง → เกียร์ → ตัวถัง แต่ละช่องมีเฉพาะค่าที่เข้ากับช่องก่อนหน้า
// (specs.js เก็บเฉพาะสเปคที่มีในข้อมูลเทรน ฟอร์มจึงกรอกได้เฉพาะชุดที่โมเดลเคยเห็น) =====
const FUELS=["gas","diesel","hybrid","ev"],GEARS=["AT","MT"]; // ลำดับตรงกับ tools/build_specs.py
const sel=(id,items,keepValue)=>{const el=$(id),old=el.value;el.replaceChildren(...items.map(([v,l])=>new Option(l,v)));if(keepValue&&items.some(([v])=>v===old))el.value=old};
const variants=()=>SPEC[$("brand").value][$("model").value][$("year").value];
const narrow=matchMedia("(max-width:480px)"); // จอมือถือ: ใช้ AT/MT แทนคำเต็ม ไม่ให้ป้ายสเปคถูกตัด
narrow.addEventListener("change",()=>fillSpec(true));
const vLabel=([cc,f,g,b])=>{const t=T[lang];return `${cc?(cc/1000).toFixed(1)+"L":t.motor} · ${t[FUELS[f]]} · ${narrow.matches?GEARS[g]:t[GEARS[g]==="AT"?"at":"mt"]} · ${t.bodies[BODY[b]]||BODY[b]}`};
// สเปคที่เลือกตรงกับชุดไหนใน specs.js
const specIndex=()=>variants().findIndex(([cc,f,g,b])=>cc===+$("cc").value&&FUELS[f]===$("fuel").value&&GEARS[g]===$("trans").value&&BODY[b]===$("body").value);
// เติมตัวเลือกทีละช่องจากชุดที่เข้ากับค่าในช่องก่อนหน้า (คงค่าเดิมไว้ถ้ายังเลือกได้)
function cascade(){
  const t=T[lang],uniq=a=>[...new Set(a)];
  let vs=variants();
  sel("cc",uniq(vs.map(v=>v[0])).sort((a,b)=>a-b).map(cc=>[String(cc),cc+" cc"]),true);
  vs=vs.filter(v=>v[0]===+$("cc").value);
  sel("fuel",uniq(vs.map(v=>v[1])).map(f=>[FUELS[f],t[FUELS[f]]]),true);
  vs=vs.filter(v=>FUELS[v[1]]===$("fuel").value);
  sel("trans",uniq(vs.map(v=>v[2])).map(g=>[GEARS[g],t[GEARS[g]==="AT"?"at":"mt"]]),true);
  vs=vs.filter(v=>GEARS[v[2]]===$("trans").value);
  sel("body",uniq(vs.map(v=>v[3])).map(b=>[BODY[b],t.bodies[BODY[b]]||BODY[b]]),true);
  paintSpecs();
}
function applyVariant([cc,f,g,b]){$("cc").value=cc;cascade();$("fuel").value=FUELS[f];cascade();$("trans").value=GEARS[g];cascade();$("body").value=BODY[b];paintSpecs()}
function paintSpecs(){
  const i=specIndex();
  $("specs").replaceChildren(Object.assign(document.createElement("span"),{textContent:T[lang].specHint}),...variants().map((v,j)=>{
    const b=document.createElement("button");
    b.type="button";b.className="chip";b.textContent=vLabel(v);b.setAttribute("aria-pressed",j===i);b.onclick=()=>applyVariant(v);
    return b;
  }));
}
// keepValue: คงค่าที่เลือกไว้ถ้ายังมีในปีนี้ (เช่นเปลี่ยนภาษา) ไม่งั้นใช้สเปคแรกของปีนั้น
function fillSpec(keepValue){
  if(keepValue&&specIndex()>=0)cascade();else applyVariant(variants()[0]);
  showSeen();paintCarPhoto();
}
// แสดงลิงก์แหล่งอ้างอิงของสเปครุ่นนี้
function showSeen(){$("seen").replaceChildren(T[lang].src+" ",...SRC[$("brand").value][$("model").value].flatMap((u,i)=>{const a=document.createElement("a");a.href=u;a.target="_blank";a.rel="noopener";a.textContent=new URL(u).hostname.replace(/^www\./,"");return i?[" · ",a]:[a]}))}
function fillYears(keepSpec){sel("year",Object.keys(SPEC[$("brand").value][$("model").value]).sort((a,b)=>b-a).map(y=>[y,y]),true);fillSpec(keepSpec)}
function fillModels(){sel("model",trainedModels[$("brand").value].map(m=>[m,m]));fillYears()}
function fillColors(){sel("color",COLORS.map(c=>[c,T[lang].colors[c]||c]),true)}
function fillBrands(){
  sel("brand",Object.keys(trainedModels).sort().map(b=>[b,b]));
  fillModels();fillColors();
}
const syncR=()=>{$("mileageR").value=$("mileage").value};

function setErr(id,msg){$("e-"+id).textContent=msg;$(id).setAttribute("aria-invalid",!!msg)}
function read(){
  const shape=$("body").value;
  return {brand:$("brand").value,model:$("model").value,year:+$("year").value,mileage:+$("mileage").value,trans:$("trans").value,fuel:$("fuel").value,cc:+$("cc").value,body:BODY_MODEL[shape]||shape,shape,color:$("color").value}; // body = หมวดที่ส่งให้โมเดล, shape = ตัวถังจริงไว้แสดง
}
// ช่องเดียวที่พิมพ์เองได้คือเลขไมล์ จำกัดไว้ในช่วงข้อมูลเทรน (สูงสุด 300,000 กม.) ที่เหลือเป็น dropdown
function check(){
  const v=$("mileage").value,n=+v;
  const okM=v!==""&&Number.isInteger(n)&&n>=0&&n<=300000;
  setErr("mileage",okM?"":T[lang].eMile);
  if(!okM)$("mileage").focus();
  return okM&&specIndex()>=0;
}

$("mileageR").oninput=()=>{$("mileage").value=$("mileageR").value;setErr("mileage","")};
$("mileage").oninput=()=>{$("mileageR").value=$("mileage").value;setErr("mileage","")};
$("brand").onchange=fillModels;
$("model").onchange=()=>fillYears();
$("year").onchange=()=>fillSpec();
$("cc").onchange=$("fuel").onchange=$("trans").onchange=cascade;
$("body").onchange=paintSpecs;
$("cmpClear").onclick=()=>{pinned=null;paintCmp();refresh()};
$("langBtn").onclick=()=>{lang=lang==="th"?"en":"th";store("lang",lang);render()};
$("themeBtn").onclick=()=>{theme=theme==="dark"?"light":"dark";store("theme",theme);render()};

function showErr(){
  $("out").innerHTML=`<p class="hint">${T[lang].err}</p><button class="ghost" id="retry" type="button">${T[lang].retry}</button>`;
  $("retry").onclick=()=>$("f").requestSubmit();
  $("more").hidden=true;
}
$("f").onsubmit=async e=>{
  e.preventDefault();
  if(!check()){ // ไม่ปล่อยราคาของค่าก่อนหน้าค้างไว้ข้างข้อความเตือน
    seq++;cur=null;failed=false;
    $("out").innerHTML=`<p class="empty" data-i="empty">${T[lang].empty}</p>`;$("more").hidden=true;paintCmp();
    return;
  }
  const x=read();
  const id=++seq;
  failed=false;
  scrollToEl(document.querySelector(".result"));
  $("out").innerHTML='<div class="sk big"></div><div class="sk"></div><div class="sk"></div>';
  // โหลด JSON ครั้งแรก: แสดง "กำลังโหลดโมเดล…" เฉพาะตอนที่ยังโหลดไม่เสร็จ
  let loadHint=null;
  if(!modelLoaded){
    loadHint=document.createElement("p");loadHint.className="hint";loadHint.textContent=T[lang].load;$("out").append(loadHint);
  }
  modelReady().then(()=>{modelLoaded=true;loadHint?.remove()},()=>loadHint?.remove());
  // ราคาปัจจุบัน + อีก 5 ปีข้างหน้า (ขับปีละ 15,000 กม.) คำนวณในเบราว์เซอร์ (ไมล์สูงสุดที่โมเดลรับคือ 999,999)
  const xs=[x,...[1,2,3,4,5].map(k=>({...x,year:x.year-k,mileage:Math.min(999999,x.mileage+15000*k)}))];
  let rs;
  try{[rs]=await Promise.all([predictPrices(xs),new Promise(res=>setTimeout(res,450))])}
  catch(err){if(id===seq){failed=true;showErr()}return}
  if(id!==seq)return;
  cur={x,price:rs[0].price,untrained:rs[0].untrained,fut:rs.map(r=>r.price)};
  paint(true);
  refresh();
};


async function start(){
  try{
    const response=await fetch(new URL("../model/encoder.json?v=merge50minc",import.meta.url));
    if(!response.ok)throw new Error("encoder load failed");
    const encoder=await response.json();
    if(!Array.isArray(encoder.known_brand_model_pairs))throw new Error("invalid encoder");
    const models={};
    for(const pair of encoder.known_brand_model_pairs){
      const [brand,model]=pair.split("|");
      if(SPEC[brand]?.[model])(models[brand]??=[]).push(model);
    }
    for(const list of Object.values(models))list.sort();
    if(!Object.keys(models).length)throw new Error("no supported cars");
    trainedModels=models;
    try{
      // no-cache: ตรวจกับเซิร์ฟเวอร์ทุกครั้ง ไม่ใช้รายการภาพเก่าที่ชี้ไปยังไฟล์ที่ถูกลบแล้ว
      const imagesResponse=await fetch(new URL("../data/car-images/inventory.json",import.meta.url),{cache:"no-cache"});
      if(imagesResponse.ok){const images=await imagesResponse.json();if(images.model_id===encoder.model_id&&Array.isArray(images.cars))carImages=images.cars}
    }catch(e){ /* ฟอร์มยังทำงานได้เมื่อข้อมูลภาพไม่พร้อม */ }
    fillBrands();
    if(trainedModels.TOYOTA?.includes("CAMRY")){$("brand").value="TOYOTA";fillModels();$("model").value="CAMRY";fillYears();if(SPEC.TOYOTA.CAMRY[2018])$("year").value="2018";fillSpec()}
    syncR();
    render();               // ตั้งธีมก่อน ให้ฉาก 3D อ่านสีได้


    initUI();
  }catch(err){
    document.querySelectorAll("[data-i]").forEach(e=>e.textContent=T[lang][e.dataset.i]);
    $("f").hidden=true;
    $("out").textContent=T[lang].err;
    const retry=document.createElement("button");
    retry.type="button";retry.className="ghost";retry.textContent=T[lang].retry;
    retry.onclick=()=>location.reload();
    $("out").append(document.createElement("br"),retry);
  }
}
start();
