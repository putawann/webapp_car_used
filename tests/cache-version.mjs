// ทุกไฟล์ JS/CSS ที่หน้าเว็บโหลดต้องมี ?v= เลขเดียวกัน ไม่งั้นมือถืออาจใช้ไฟล์เก่าจากแคชปนกับ HTML ใหม่
import {readFile, readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';

const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const credits=await readFile(new URL('../credits.html',import.meta.url),'utf8');
const versions=new Set([...html.matchAll(/\?v=([\w.-]+)/g),...credits.matchAll(/\?v=([\w.-]+)/g)].map(m=>m[1]));
assert.equal(versions.size,1,`one version everywhere, found ${[...versions]}`);
const [v]=versions;
const map=JSON.parse(html.match(/<script type="importmap">(.*?)<\/script>/s)[1]).imports;
const modules=(await readdir(new URL('../js/',import.meta.url))).filter(f=>f.endsWith('.js'));
for(const f of modules)assert.equal(map[`./js/${f}`],`./js/${f}?v=${v}`,`import map entry for js/${f}`);
assert(html.includes(`src="js/app.js?v=${v}"`));
assert(html.includes(`css/style.css?v=${v}`)&&credits.includes(`css/style.css?v=${v}`));
console.log(`cache version ok: ${v}, ${modules.length} modules`);
