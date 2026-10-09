// ===== ตัวหน้าเว็บ: ฟอร์ม ทำนายราคา แสดงผล ภาษา/ธีม =====
import {T,NOW,predictPrice,EX} from "./data.js";
import {SPEC,BODY,COLORS,SRC} from "./specs.js";
import {initFx,setTheme,setScroll,showText,isPaused,setPaused} from "./fx.js";
import {initUI,scrollToEl,scramble,sfx,isSound,setSound,refresh} from "./ui.js";

const $=id=>document.getElementById(id);
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const store=(k,v)=>{try{localStorage[k]=v}catch(e){}};
let lang,theme;
try{lang=localStorage.lang;theme=localStorage.theme}catch(e){}
lang||=navigator.language.startsWith("th")?"th":"en";
theme||=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";
let cur=null,pinned=null,seq=0,typed=null,tw=0,tt=0;
const SVG=p=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const SUN=SVG('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>');
const MOON=SVG('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>');
const PLAY=SVG('<path d="M8 5v14l11-7z" fill="currentColor"/>'),PAUSE=SVG('<path d="M9 5v14M15 5v14"/>');
const SPK=SVG('<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>');
const r1=n=>Math.round(n/1000)*1000;
const fmt=n=>n.toLocaleString(lang==="th"?"th-TH":"en-US");
const sgn=v=>(v<0?"−":"+")+fmt(r1(Math.abs(v)));

function paint(animate){
  const t=T[lang],lo=r1(cur.price*0.92),hi=r1(cur.price*1.08);
  $("out").innerHTML=`<div class="${animate?"fade":""}"><p class="range">${t.est}</p><div class="price"><span id="pv">${fmt(cur.price)}</span> ${t.baht}</div><p class="range">${t.rng}</p><div class="bar"><b></b></div><div class="ends"><span>${fmt(lo)}</span><span>${fmt(hi)}</span></div><button class="ghost" id="pin" type="button">${t.pin}</button></div>`;
  $("pin").onclick=()=>{pinned=cur;paintCmp();refresh()};
  if(animate)scramble($("pv"),fmt(cur.price));
  paintMore();paintCmp();
}
function paintMore(){
  const t=T[lang],ps=(cur.parts||[]).filter(p=>Math.abs(p[1])>=500);
  $("more").hidden=false;
  const mx=Math.max(1,...ps.map(p=>Math.abs(p[1])));
  let h="";
  if(cur.base)h+=`<div class="fr"><span>${t.fBase}</span><span></span><span class="v">${fmt(r1(cur.base))}</span></div>`;
  h+=ps.map(([k,v])=>`<div class="fr"><span>${t[k]}</span><span class="t"><i style="${v<0?"right":"left"}:50%;width:${Math.abs(v)/mx*50}%;background:var(--${v<0?"bad":"ok"})"></i></span><span class="v ${v<0?"dn":"up"}">${sgn(v)}</span></div>`).join("");
  h+=`<div class="fr tot"><span>${t.fTotal}</span><span></span><span class="v">${fmt(cur.price)}</span></div>`;
  $("fac").innerHTML=cur.parts?h:`<p class="hint">—</p>`;
  const f=cur.fut,W=360,H=170,PX=34,TOP=24,BOT=30,top=Math.max(...f)*1.05;
  const X=i=>PX+i*(W-2*PX)/(f.length-1),Y=v=>TOP+(H-TOP-BOT)*(1-v/top);
  $("chart").innerHTML=`<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${t.cAlt}: ${fmt(f[0])} → ${fmt(f[f.length-1])} ${t.baht}"><line x1="${PX}" x2="${W-PX}" y1="${H-BOT}" y2="${H-BOT}" stroke="var(--line)"/><polyline fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-linejoin="round" points="${f.map((v,i)=>X(i)+","+Y(v)).join(" ")}"/>${f.map((v,i)=>`<line x1="${X(i)}" x2="${X(i)}" y1="${TOP}" y2="${H-BOT}" stroke="var(--line)" stroke-dasharray="2 3"/><rect x="${X(i)-4}" y="${Y(v)-4}" width="8" height="8" transform="rotate(45 ${X(i)} ${Y(v)})" fill="var(--accent)"/><text x="${X(i)}" y="${H-10}" text-anchor="middle">${NOW+i}</text>`).join("")}<text x="${X(0)}" y="${Y(f[0])-10}" text-anchor="middle">${fmt(f[0])}</text><text x="${X(f.length-1)}" y="${Y(f[f.length-1])-10}" text-anchor="middle">${fmt(f[f.length-1])}</text></svg><p class="hint">${t.cNote}</p>`;
}
function paintCmp(){
  const t=T[lang];
  $("cmp").hidden=!pinned;
  if(!pinned)return;
  const B=cur!==pinned?cur:null;
  const rows=[[t.car,c=>`${c.x.brand} ${c.x.model}`],[t.year,c=>c.x.year],[t.mileage,c=>fmt(c.x.mileage)+" km"],[t.trans,c=>t[c.x.trans==="AT"?"at":"mt"]],[t.fuel,c=>t[c.x.fuel]],[t.cc,c=>fmt(c.x.cc)+" cc"],[t.body,c=>t.bodies[c.x.body]||c.x.body],[t.color,c=>t.colors[c.x.color]||c.x.color]];
  let h=`<span></span><span class="h">${t.cmpA}</span><span class="h">${t.cmpB}</span>`;
  rows.forEach(([k,f])=>h+=`<span class="k">${k}</span><span>${f(pinned)}</span><span>${B?f(B):"—"}</span>`);
  h+=`<span class="k">${t.price}</span><span class="p">${fmt(pinned.price)}</span><span class="p">${B?fmt(B.price):"—"}</span>`;
  if(B){const d=B.price-pinned.price,pc=(d/pinned.price*100).toFixed(1);
    h+=`<span class="k">${t.cmpDiff}</span><span></span><span class="p ${d<0?"dn":"up"}">${sgn(d)} (${d<0?"−":"+"}${Math.abs(pc)}%)</span>`}
  else h+=`<span class="hint" style="grid-column:1/-1">${t.cmpWait}</span>`;
  $("cmpBody").innerHTML=`<div class="cmp">${h}</div>`;
}
function typeIt(){
  const el=$("lead"),s=el.textContent;let i=0;
  clearInterval(tw);clearTimeout(tt);el.classList.add("typing");el.textContent="";
  tw=setInterval(()=>{el.textContent=s.slice(0,++i);if(i>=s.length){clearInterval(tw);tt=setTimeout(()=>el.classList.remove("typing"),1200)}},16);
}
function paintMotion(){$("motion").innerHTML=isPaused()?PLAY:PAUSE;$("motion").setAttribute("aria-label",T[lang][isPaused()?"play":"pause"])}
function render(){
  document.documentElement.lang=lang;
  document.documentElement.dataset.theme=theme;
  document.querySelectorAll("[data-i]").forEach(e=>e.textContent=T[lang][e.dataset.i]);
  document.querySelectorAll("[data-al]").forEach(e=>e.setAttribute("aria-label",T[lang][e.dataset.al]));
  $("langBtn").setAttribute("aria-checked",lang==="en");
  $("themeBtn").innerHTML=theme==="dark"?SUN:MOON;
  $("themeBtn").setAttribute("aria-label",theme==="dark"?T[lang].light:T[lang].dark);
  $("soundBtn").setAttribute("aria-label",T[lang].sound);$("soundBtn").setAttribute("aria-pressed",isSound());
  document.title=T[lang].brandName+" - "+T[lang].title;
  if(!reduce&&typed!==lang){typed=lang;typeIt()}
  setTheme();paintMotion();
  fillVariants(true);fillColors(); // ป้ายใน dropdown เปลี่ยนตามภาษา
  if(document.querySelector("input[aria-invalid=true]"))check();
  if(cur)paint(false);else paintCmp();
}

// ===== ฟอร์มแบบเลือกไล่ลำดับ: ยี่ห้อ → รุ่น → ปี → สเปค (เฉพาะชุดที่มีจริงใน specs.js) =====
const FUELS=["gas","diesel","hybrid","ev"],GEARS=["AT","MT"]; // ลำดับตรงกับ tools/build_specs.py
const sel=(id,items,keepValue)=>{const el=$(id),old=el.value;el.replaceChildren(...items.map(([v,l])=>new Option(l,v)));if(keepValue&&items.some(([v])=>v===old))el.value=old};
const variants=()=>SPEC[$("brand").value][$("model").value][$("year").value];
const narrow=matchMedia("(max-width:480px)"); // จอมือถือ: ใช้ AT/MT แทนคำเต็ม ไม่ให้ป้ายสเปคถูกตัด
narrow.addEventListener("change",()=>fillVariants(true));
const vLabel=([cc,f,g,b])=>{const t=T[lang];return `${cc?(cc/1000).toFixed(1)+"L":t.motor} · ${t[FUELS[f]]} · ${narrow.matches?GEARS[g]:t[GEARS[g]==="AT"?"at":"mt"]} · ${t.bodies[BODY[b]]||BODY[b]}`};
function fillVariants(keepValue){
  sel("variant",variants().map((v,i)=>[String(i),vLabel(v)]),keepValue);
  showSeen();
}
// แสดงลิงก์แหล่งอ้างอิงของสเปครุ่นนี้
function showSeen(){$("seen").replaceChildren(T[lang].src+" ",...SRC[$("brand").value][$("model").value].flatMap((u,i)=>{const a=document.createElement("a");a.href=u;a.target="_blank";a.rel="noopener";a.textContent=new URL(u).hostname.replace(/^www\./,"");return i?[" · ",a]:[a]}))}
function fillYears(){sel("year",Object.keys(SPEC[$("brand").value][$("model").value]).sort((a,b)=>b-a).map(y=>[y,y]),true);fillVariants()}
function fillModels(){sel("model",Object.keys(SPEC[$("brand").value]).sort().map(m=>[m,m]));fillYears()}
function fillColors(){sel("color",COLORS.map(c=>[c,T[lang].colors[c]||c]),true)}
function fillBrands(){
  sel("brand",Object.keys(SPEC).sort().map(b=>[b,b]));
  fillModels();fillColors();
  EX.forEach(([brand,model,year,mileage])=>{
    const b=document.createElement("button");
    b.type="button";b.className="chip";b.textContent=model+" "+year;
    b.onclick=()=>{
      $("brand").value=brand;fillModels();$("model").value=model;fillYears();$("year").value=year;fillVariants();
      $("mileage").value=mileage;syncR();$("f").requestSubmit();
    };
    $("chips").append(b);
  });
}
const syncR=()=>{$("mileageR").value=$("mileage").value};

function setErr(id,msg){$("e-"+id).textContent=msg;$(id).setAttribute("aria-invalid",!!msg)}
function read(){
  const [cc,f,g,b]=variants()[+$("variant").value];
  return {brand:$("brand").value,model:$("model").value,year:+$("year").value,mileage:+$("mileage").value,trans:GEARS[g],fuel:FUELS[f],cc,body:BODY[b],color:$("color").value};
}
// ช่องที่กรอกเองได้มีแค่เลขไมล์ ที่เหลือมาจาก dropdown จึงถูกต้องเสมอ
function check(){
  const ok=$("mileage").value!==""&&+$("mileage").value>=0&&+$("mileage").value<=999999;
  setErr("mileage",ok?"":T[lang].eMile);
  if(!ok)$("mileage").focus();
  return ok;
}

$("mileageR").oninput=()=>{$("mileage").value=$("mileageR").value;setErr("mileage","")};
$("mileage").oninput=()=>{$("mileageR").value=$("mileage").value;setErr("mileage","")};
$("brand").onchange=fillModels;
$("model").onchange=fillYears;
$("year").onchange=()=>fillVariants();
$("variant").onchange=showSeen;
$("cmpClear").onclick=()=>{pinned=null;paintCmp();refresh()};
$("langBtn").onclick=()=>{lang=lang==="th"?"en":"th";store("lang",lang);render()};
$("themeBtn").onclick=()=>{theme=theme==="dark"?"light":"dark";store("theme",theme);render()};
$("soundBtn").onclick=()=>{setSound(!isSound());render();sfx("tick")};
$("motion").onclick=()=>{setPaused(!isPaused());paintMotion()};
$("f").onsubmit=async e=>{
  e.preventDefault();
  if(!check())return;
  const x=read();
  const id=++seq;
  scrollToEl(document.querySelector(".result"));
  sfx("scan");
  $("out").innerHTML='<div class="sk big"></div><div class="sk"></div><div class="sk"></div>';
  // ราคาปัจจุบัน + อีก 5 ปีข้างหน้า (ขับปีละ 15,000 กม.)
  const [r,...fut]=await Promise.all([predictPrice(x),...[1,2,3,4,5].map(k=>predictPrice({...x,year:x.year-k,mileage:x.mileage+15000*k})),new Promise(res=>setTimeout(res,450))]);
  if(id!==seq)return;
  cur={x,price:r.price,base:r.base,parts:r.parts,fut:[r.price,...fut.slice(0,5).map(f=>f.price)]};
  paint(true);
  showText(cur.price.toLocaleString("en-US")); // จุดในฉากหลังรวมตัวเป็นตัวเลขราคา
  refresh();
};

$("hid").textContent=String(1e6+Math.floor(Math.random()*9e6));
$("soundBtn").innerHTML=SPK;
fillBrands();syncR();
render();               // ตั้งธีมก่อน ให้ฉาก 3D อ่านสีได้
initFx($("fx"));
setTheme();paintMotion();
initUI(setScroll);
