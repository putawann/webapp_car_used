// Build the model/year research inventory from the actual model and specs.
// Existing manual research is not overwritten.
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {SPEC, SRC} from '../js/specs.js';

const encoder=JSON.parse(await readFile(new URL('../model/encoder.json',import.meta.url),'utf8'));
const cars=encoder.known_brand_model_pairs.map(pair=>{
  const [brand,model]=pair.split('|');
  if(!SPEC[brand]?.[model])throw new Error(`Missing specs: ${pair}`);
  return {brand,model,years:Object.keys(SPEC[brand][model]).map(Number).sort((a,b)=>a-b),spec_sources:SRC[brand][model],images:[]};
});
const path=new URL('../data/car-images/inventory.json',import.meta.url);
await mkdir(new URL('../data/car-images/',import.meta.url),{recursive:true});
await writeFile(path,JSON.stringify({model_id:encoder.model_id,note:'Years are available in specs, not verified facelift boundaries. No image is approved until its model, market, years and license have been checked.',cars},null,2)+'\n',{flag:'wx'});
console.log(`${cars.length} models, ${new Set(cars.map(c=>c.brand)).size} brands, ${cars.reduce((n,c)=>n+c.years.length,0)} model-year entries`);
