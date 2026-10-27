// ===== ลูกเล่นหน้าเว็บ: เลื่อนหน้านุ่ม, เล่าเรื่องตามการเลื่อน, ตัวเลขถอดรหัส, เคอร์เซอร์วงเล็ง =====
import gsap from "gsap";
import {ScrollTrigger} from "gsap/ScrollTrigger";
import Lenis from "lenis";
gsap.registerPlugin(ScrollTrigger);

let lenis=null;
export function initUI(onScroll){
  lenis=new Lenis({lerp:.1});
  lenis.on("scroll",ScrollTrigger.update);
  gsap.ticker.add(t=>lenis.raf(t*1000));
  gsap.ticker.lagSmoothing(0);
  // ลิงก์ในหน้า (#form) ให้เลื่อนผ่าน Lenis
  document.addEventListener("click",e=>{
    const a=e.target.closest('a[href^="#"]');
    if(a){e.preventDefault();scrollToEl(document.querySelector(a.getAttribute("href")))}
  });
  // hero: ข้อความลอยขึ้นและจาง, รถย้ายไปด้านข้าง (ส่ง progress ให้ฉาก 3D)
  ScrollTrigger.create({trigger:"#hero",start:"top top",end:"bottom top",scrub:true,onUpdate:s=>onScroll(s.progress)});
  gsap.to("#hero .in",{yPercent:-30,opacity:0,ease:"none",scrollTrigger:{trigger:"#hero",start:"top top",end:"75% top",scrub:true}});
  // การ์ดค่อยๆ ลอยขึ้นมาเมื่อเลื่อนถึง
  gsap.utils.toArray("main > .card:not([hidden])").forEach(el=>gsap.from(el,{y:56,opacity:0,duration:1,ease:"power3.out",scrollTrigger:{trigger:el,start:"top 90%",once:true}}));
  cursor();
}
export function scrollToEl(el){
  if(!el)return;
  if(lenis)lenis.scrollTo(el,{offset:-16,duration:1.2});else el.scrollIntoView({behavior:"smooth"});
}
export const refresh=()=>ScrollTrigger.refresh();

// ตัวเลขถอดรหัส: สุ่มตัวอักษรแล้วค่อยๆ เผยจากซ้ายไปขวา
const GLYPHS="0123456789#%&*+=/<>";
export function scramble(el,text,dur=900){
  const t0=performance.now();
  (function f(now){
    if(!el.isConnected)return;
    const k=Math.min(1,(now-t0)/dur),n=Math.floor(k*text.length);
    el.textContent=text.slice(0,n)+[...text.slice(n)].map(c=>/[\s,.]/.test(c)?c:GLYPHS[Math.random()*GLYPHS.length|0]).join("");
    if(k<1)requestAnimationFrame(f);
  })(t0);
}

// เคอร์เซอร์วงเล็ง: เฉพาะอุปกรณ์ที่มีเมาส์ ขยายเมื่อชี้ของที่กดได้
function cursor(){
  const c=document.getElementById("cursor");
  if(!c||!matchMedia("(pointer:fine)").matches)return;
  c.hidden=false;
  let x=-100,y=-100,cx=x,cy=y;
  addEventListener("pointermove",e=>{x=e.clientX;y=e.clientY});
  document.addEventListener("pointerover",e=>c.classList.toggle("on",!!e.target.closest("a,button,input,select,label")));
  gsap.ticker.add(()=>{cx+=(x-cx)*.25;cy+=(y-cy)*.25;c.style.transform=`translate(${cx}px,${cy}px)`});
}
