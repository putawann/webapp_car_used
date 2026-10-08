// ===== ฉากหลัง 3D: รถจากจุดหลายหมื่นจุด (Three.js) =====
// รูปทรงรถด้านข้าง 6 แบบ (data.js) ถูกขึ้นรูปเป็น 3D: แผงข้างซ้าย/ขวา + เปลือกรอบนอกที่กางตามความกว้างรถ
// จุดเลื่อนเปลี่ยนรูปทรงวนไปเรื่อยๆ ล้อหมุน ถนน/เส้นความเร็ววิ่ง รถหันตามเมาส์ และรวมตัวเป็นตัวเลขราคาได้
import * as THREE from "three";
import {EffectComposer} from "three/addons/postprocessing/EffectComposer.js";
import {RenderPass} from "three/addons/postprocessing/RenderPass.js";
import {UnrealBloomPass} from "three/addons/postprocessing/UnrealBloomPass.js";
import {TYPES} from "./data.js";

THREE.ColorManagement.enabled=false; // ใช้สีตรงตาม CSS
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const small=innerWidth<700||matchMedia("(pointer:coarse)").matches;
const N=small?14000:36000;   // จุดตัวรถ
const NW=small?500:1100;     // จุดต่อล้อ
const HOLD=3,MORPH=2;        // วินาที: ค้างแต่ละแบบ / เวลาเปลี่ยนรูป
const SPEED=18;              // หน่วย/วินาที ของถนน
const ease=x=>x*x*(3-2*x);

// ---------- สุ่มจุดจากรูป 2D ----------
const RES=8,BW=60*RES,BH=36*RES;  // กรอบหน่วย x 2-62, y 16-52
const off=document.createElement("canvas");off.width=BW;off.height=BH;
const o=off.getContext("2d",{willReadFrequently:true});
// Knothe–Rosenblatt: r1 เลือกคอลัมน์ตามสัดส่วนจุด, r2 เลือกตำแหน่งในคอลัมน์
// ⇒ จุดที่ใช้ r1,r2 เดียวกันอยู่ตำแหน่งใกล้กันในทุกรูปทรง จึงเปลี่ยนรูปได้นุ่มโดยไม่วิ่งไขว้กัน
function kr(cols){
  const cum=[];let s=0;
  for(const c of cols)cum.push(s+=c.length);
  return (r1,r2)=>{
    let lo=0,hi=cum.length-1;const k=r1*s;
    while(lo<hi){const m=lo+hi>>1;if(cum[m]>k)hi=m;else lo=m+1}
    const c=cols[lo];
    return [2+lo*2/RES,16+c[Math.min(c.length-1,r2*c.length|0)]/RES];
  };
}
function sample(draw){
  o.setTransform(1,0,0,1,0,0);o.globalCompositeOperation="source-over";o.clearRect(0,0,BW,BH);
  o.setTransform(RES,0,0,RES,-2*RES,-16*RES);
  draw();
  const d=o.getImageData(0,0,BW,BH).data,A=(x,y)=>x>=0&&y>=0&&x<BW&&y<BH&&d[(y*BW+x)*4+3]>128;
  const E=[],F=[];
  for(let x=0;x<BW;x+=2){const e=[],f=[];for(let y=0;y<BH;y+=2)if(A(x,y))(A(x-3,y)&&A(x+3,y)&&A(x,y-3)&&A(x,y+3)?f:e).push(y);E.push(e);F.push(f)}
  return {edge:kr(E),fill:kr(F)};
}
// เมล็ดสุ่มของแต่ละจุด ใช้ร่วมกันทุกรูปทรง
const seeds=Array.from({length:N},(_,i)=>({k:i%10,r1:Math.random(),r2:Math.random(),r3:Math.random()}));
// ขึ้นรูป 3D: 30% ขอบแผงข้าง, 30% เนื้อแผงข้าง (z=±ครึ่งความกว้าง), 40% เปลือกรอบนอกกางตามความกว้าง
function build3D(full,panel,hw){
  const a=new Float32Array(N*3);
  seeds.forEach(({k,r1,r2,r3},i)=>{
    let u,v,z;
    if(k<6){[u,v]=(k<3?panel.edge:panel.fill)(r1,r2);z=(r3<.5?-1:1)*hw(v)}
    else{[u,v]=full.edge(r1,r2);z=(r3*2-1)*hw(v)}
    a[i*3]=u-32;a[i*3+1]=36-v;a[i*3+2]=z;
  });
  return new THREE.BufferAttribute(a,3);
}
const carHW=v=>v<31?9.5-(31-v)*.22:9.5; // ห้องโดยสารแคบกว่าตัวถัง
const CARS3D=TYPES.map(([body,win,x1,x2,r])=>{
  const B=new Path2D(body);
  const full=sample(()=>o.fill(B));
  const panel=sample(()=>{
    o.fill(B);o.globalCompositeOperation="destination-out";o.fill(new Path2D(win));
    o.beginPath();o.arc(x1,51-r,r+1.2,0,7);o.moveTo(x2+r+1.2,51-r);o.arc(x2,51-r,r+1.2,0,7);o.fill();
  });
  return {buf:build3D(full,panel,carHW),w:{x1,x2,r,s:1}};
});
function textShape(str){
  const s=sample(()=>{
    o.font="700 10px 'JetBrains Mono',monospace";o.textAlign="center";o.textBaseline="middle";
    const w=o.measureText(str).width,f=Math.min(1.6,46/w);
    o.setTransform(RES*f,0,0,RES*f,(32-2)*RES,(34-16)*RES);o.fillText(str,0,0);
  });
  return build3D(s,s,()=>1.4);
}

// ---------- ฉาก ----------
let renderer,scene,camera,composer,bloom,car,body,wheels=[],road,streak,mat,lineMat,dark=false;
let clock=0,last=0,spin=0,paused=false,scrollP=0,view=0,camZ=127,Hv=80,Wv=160;
let mouse=new THREE.Vector2(),mouseW=new THREE.Vector3(1e4,1e4,0),yaw=-.5,pitch=.2;
let A,B,start=0,dur=0,k=0,mode="car",textUntil=0,wFrom,wTo;
const aD=new Float32Array(N),aR=new Float32Array(N);
seeds.forEach((s,i)=>{aD[i]=(1-s.r1)*.3;aR[i]=Math.random()}); // หน่วงเวลาให้เปลี่ยนรูปจากหน้ารถไปท้ายรถ

const VS=`attribute vec3 posB;attribute float aD;attribute float aR;
uniform float uMix,uTime,uSize,uBob,uPx;uniform vec3 uMouse;varying float vA;
void main(){
  float m=clamp(uMix*1.3-aD,0.,1.);m=m*m*(3.-2.*m);
  vec3 p=mix(position,posB,m);
  p.y+=uBob;
  p+=.12*vec3(sin(uTime*1.3+aR*40.),cos(uTime*1.1+aR*31.),sin(uTime*.9+aR*17.));
  p+=normalize(p+vec3(.001))*sin(m*3.1416)*2.5*aR; // ระหว่างเปลี่ยนรูปให้พองออกเล็กน้อย
  vec4 w=modelMatrix*vec4(p,1.);
  vec2 dv=w.xy-uMouse.xy;float dl=length(dv);
  w.xy+=dv/max(dl,.001)*smoothstep(10.,0.,dl)*4.;  // จุดหลบเมาส์
  vec4 mv=viewMatrix*w;
  gl_Position=projectionMatrix*mv;
  gl_PointSize=uSize*uPx*(.6+aR)*(120./-mv.z);
  vA=.35+.65*aR;
}`;
const FS=`uniform vec3 uColor;uniform float uAlpha;varying float vA;
void main(){vec2 c=gl_PointCoord-.5;float r=dot(c,c);if(r>.25)discard;gl_FragColor=vec4(uColor,uAlpha*vA*(1.-r*4.));}`;

function wheelGeo(){
  const n=NW,p=new Float32Array(n*3),r=new Float32Array(n);
  for(let i=0;i<n;i++){
    const sp=i%5<2,rr=sp?.2+Math.random()*.54:.74+(1-Math.random()**2)*.26;
    const a=sp?(Math.random()*5|0)*1.2566+(Math.random()-.5)*.1:Math.random()*6.283;
    p[i*3]=Math.cos(a)*rr;p[i*3+1]=Math.sin(a)*rr;p[i*3+2]=(Math.random()-.5)*(sp?.25:.45);r[i]=Math.random();
  }
  const g=new THREE.BufferGeometry(),pa=new THREE.BufferAttribute(p,3);
  g.setAttribute("position",pa);g.setAttribute("posB",pa);
  g.setAttribute("aD",new THREE.BufferAttribute(new Float32Array(n),1));g.setAttribute("aR",new THREE.BufferAttribute(r,1));
  return g;
}
// ถนน 3 เลน: เส้นประเลื่อนไปทางซ้าย จางที่ปลาย
const LANES=[-13,0,13],DASH=16,RL=48;
const roadPos=new Float32Array(LANES.length*DASH*6),roadCol=new Float32Array(LANES.length*DASH*6);
// เส้นความเร็วหลุดจากท้ายรถ
const NS=70,sPos=new Float32Array(NS*6),sCol=new Float32Array(NS*6),sl=Array.from({length:NS},()=>({l:0}));
const cA=new THREE.Color(),cB=new THREE.Color(),cT=new THREE.Color();

export function initFx(canvas){
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:"high-performance"})}
  catch(e){canvas.hidden=true;return false} // ไม่มี WebGL: ซ่อนฉากหลัง เว็บยังใช้ได้
  renderer.outputColorSpace=THREE.LinearSRGBColorSpace;
  scene=new THREE.Scene();
  camera=new THREE.PerspectiveCamera(35,1,1,2000);
  car=new THREE.Group();scene.add(car);
  mat=new THREE.ShaderMaterial({uniforms:{uMix:{value:1},uTime:{value:0},uSize:{value:small?2.4:1.9},uColor:{value:new THREE.Color()},uAlpha:{value:1},uBob:{value:0},uMouse:{value:mouseW},uPx:{value:1}},vertexShader:VS,fragmentShader:FS,transparent:true,depthWrite:false});
  const g=new THREE.BufferGeometry();
  // เริ่มจากจุดกระจายเป็นก้อนแล้วรวมเป็นซีดาน (ข้ามถ้าเครื่องตั้งลดการเคลื่อนไหว)
  const cloud=new Float32Array(N*3);for(let i=0;i<N*3;i++)cloud[i]=(Math.random()-.5)*140;
  A=reduce?CARS3D[0].buf:new THREE.BufferAttribute(cloud,3);B=CARS3D[0].buf;dur=reduce?0:2.6;
  wFrom=wTo=CARS3D[0].w;
  g.setAttribute("position",A);g.setAttribute("posB",B);
  g.setAttribute("aD",new THREE.BufferAttribute(aD,1));g.setAttribute("aR",new THREE.BufferAttribute(aR,1));
  body=new THREE.Points(g,mat);body.frustumCulled=false;car.add(body);
  for(let i=0;i<4;i++){const w=new THREE.Points(wheelGeo(),mat);w.frustumCulled=false;wheels.push(w);car.add(w)}
  lineMat=new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.6,depthWrite:false});
  const rg=new THREE.BufferGeometry();rg.setAttribute("position",new THREE.BufferAttribute(roadPos,3));rg.setAttribute("color",new THREE.BufferAttribute(roadCol,3));
  road=new THREE.LineSegments(rg,lineMat);road.frustumCulled=false;car.add(road);
  const sg=new THREE.BufferGeometry();sg.setAttribute("position",new THREE.BufferAttribute(sPos,3));sg.setAttribute("color",new THREE.BufferAttribute(sCol,3));
  streak=new THREE.LineSegments(sg,lineMat);streak.frustumCulled=false;car.add(streak);
  composer=new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene,camera));
  bloom=new UnrealBloomPass(new THREE.Vector2(256,256),.85,.55,.12);composer.addPass(bloom);
  addEventListener("resize",resize);resize();
  addEventListener("pointermove",e=>{mouse.set(e.clientX/innerWidth*2-1,-(e.clientY/innerHeight)*2+1)});
  document.addEventListener("pointerleave",()=>mouse.set(9,9));
  mouse.set(9,9);
  setTheme();
  requestAnimationFrame(frame);
  return true;
}
function resize(){
  const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,1.75);
  renderer.setPixelRatio(dpr);renderer.setSize(w,h,false);composer.setPixelRatio(dpr);composer.setSize(w,h);
  camera.aspect=w/h;
  camZ=Math.max(140,153/camera.aspect); // ให้รถกว้างไม่เกิน ~60% ของจอ
  camera.position.set(0,0,camZ);camera.updateProjectionMatrix();
  Hv=2*camZ*Math.tan(THREE.MathUtils.degToRad(17.5));Wv=Hv*camera.aspect;
  mat.uniforms.uPx.value=dpr*camZ/127;
}
export function setTheme(){
  if(!renderer)return;
  const cs=getComputedStyle(document.documentElement);
  dark=document.documentElement.dataset.theme==="dark";
  cA.set(cs.getPropertyValue("--accent").trim());cB.set(cs.getPropertyValue("--bg").trim());
  renderer.setClearColor(cB,1);
  mat.uniforms.uColor.value.copy(cA);
  mat.uniforms.uAlpha.value=dark?.5:.4;
  mat.blending=dark?THREE.AdditiveBlending:THREE.NormalBlending;mat.needsUpdate=true;
}
export const isPaused=()=>paused;
export function setPaused(v){paused=v}
export function setScroll(p){scrollP=p}
// ให้จุดรวมตัวเป็นข้อความ (เช่นราคา) ค้างไว้สักพักแล้วกลับเป็นรถ
export function showText(str){
  if(!renderer||paused)return;
  mode="text";morphTo(textShape(str),{...wTo,s:0},1.4);textUntil=clock+1.4+3.5;
}
function mixAt(){return dur?Math.min(1,Math.max(0,(clock-start)/dur)):1}
const lerpW=(a,b,t)=>({x1:a.x1+(b.x1-a.x1)*t,x2:a.x2+(b.x2-a.x2)*t,r:a.r+(b.r-a.r)*t,s:a.s+(b.s-a.s)*t});
function morphTo(buf,w,d){
  const m=mixAt();
  if(m<1){ // กำลังเปลี่ยนรูปอยู่: เก็บตำแหน่งปัจจุบัน (สูตรเดียวกับ shader) เป็นจุดเริ่มใหม่
    const s=new Float32Array(N*3),a=A.array,b=B.array;
    for(let i=0;i<N;i++){let t=Math.min(1,Math.max(0,m*1.3-aD[i]));t=t*t*(3-2*t);for(let j=i*3;j<i*3+3;j++)s[j]=a[j]+(b[j]-a[j])*t}
    A=new THREE.BufferAttribute(s,3);wFrom=lerpW(wFrom,wTo,ease(m));
  }else{A=B;wFrom=wTo}
  B=buf;wTo=w;start=clock;dur=d;
  body.geometry.setAttribute("position",A);body.geometry.setAttribute("posB",B);
}
function frame(t){
  requestAnimationFrame(frame);
  if(document.hidden)return;
  const dt=Math.min(.05,(t-last)/1000||0);last=t;
  if(!paused)clock+=dt;
  // ตารางเวลา: ค้างรถแต่ละแบบ HOLD วิ แล้วเปลี่ยนเป็นแบบถัดไป
  let m=mixAt();
  if(mode==="car"&&m>=1&&clock-start-dur>HOLD){k=(k+1)%CARS3D.length;morphTo(CARS3D[k].buf,CARS3D[k].w,MORPH);m=0}
  if(mode==="text"&&clock>textUntil){mode="car";morphTo(CARS3D[k].buf,CARS3D[k].w,1.6);m=0}
  const W=lerpW(wFrom,wTo,ease(m)),c=W.s; // c = ความเป็นรถ (0 ตอนเป็นตัวเลข)
  if(!paused)spin+=dt*SPEED/W.r;
  const u=mat.uniforms;
  u.uMix.value=m;u.uTime.value=clock;u.uBob.value=c*(Math.sin(clock*11)*.14+Math.sin(clock*23)*.06);
  // ล้อ 4 ล้อ
  wheels.forEach((w,i)=>{
    w.position.set((i<2?W.x1:W.x2)-32,W.r-15,(i%2?1:-1)*8.3);
    w.visible=c>.03;w.scale.setScalar(W.r*c);w.rotation.z=-spin;
  });
  // ถนน
  const sh=(clock*SPEED)%6;let n=0;
  for(const z of LANES)for(let d=0;d<DASH;d++){
    const x=-RL+d*6-sh;
    cT.copy(cA).lerp(cB,Math.max(Math.min(1,(Math.abs(x+1.5)/RL)**2),1-c));
    roadPos.set([x,-15.3,z,x+3,-15.3,z],n*6);roadCol.set([cT.r,cT.g,cT.b,cT.r,cT.g,cT.b],n*6);n++;
  }
  road.geometry.attributes.position.needsUpdate=road.geometry.attributes.color.needsUpdate=true;
  // เส้นความเร็ว
  sl.forEach((s,i)=>{
    if(!paused){s.l-=dt*.9;if(s.l<=0&&Math.random()<.08)Object.assign(s,{l:1,x:-24-Math.random()*6,y:-12+Math.random()*20,z:(Math.random()-.5)*18,v:SPEED*(.6+Math.random()*.9),len:2+Math.random()*3});if(s.l>0)s.x-=s.v*dt}
    const on=s.l>0;cT.copy(cA).lerp(cB,on?1-s.l*c*.8:1);
    sPos.set(on?[s.x,s.y,s.z,s.x+s.len,s.y,s.z]:[0,0,0,0,0,0],i*6);sCol.set([cT.r,cT.g,cT.b,cT.r,cT.g,cT.b],i*6);
  });
  streak.geometry.attributes.position.needsUpdate=streak.geometry.attributes.color.needsUpdate=true;
  // ตำแหน่งบนจอ: hero = กลางค่อนบน, เลื่อนลง = ย้ายไปขวา เล็กลง จางลง (มือถืออยู่กลาง)
  view+=(scrollP-view)*.08;const p=ease(Math.min(1,view));
  car.position.set(p*Wv*(small?0:.34),(1-p)*Hv*.2-p*Hv*.05,0);
  car.scale.setScalar(1-p*.28);
  u.uAlpha.value=(dark?.5:.4)*(1-p*.55);
  // หันตามเมาส์ ตอนเป็นตัวเลขหันตรง
  const inside=mouse.x<2,mx=inside?mouse.x:0,my=inside?mouse.y:0;
  const ty=c*(-.5+Math.sin(clock*.23)*.35+mx*.3),tp=c*(.2-my*.12);
  yaw+=(ty-yaw)*.05;pitch+=(tp-pitch)*.05;car.rotation.set(pitch,yaw,0);
  // ตำแหน่งเมาส์บนระนาบ z=0 (สำหรับให้จุดหลบ)
  if(inside){mouseW.set(mouse.x,mouse.y,.5).unproject(camera).sub(camera.position).normalize();mouseW.multiplyScalar(-camera.position.z/mouseW.z).add(camera.position)}
  else mouseW.set(1e4,1e4,0);
  if(dark)composer.render();else renderer.render(scene,camera);
}
