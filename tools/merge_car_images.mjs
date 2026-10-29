// Merge researched photo records without making unverified facelift claims.
import {readFile, writeFile, access} from 'node:fs/promises';
const root=new URL('../data/car-images/',import.meta.url);
const path=new URL('inventory.json',root);
const inventory=JSON.parse(await readFile(path,'utf8'));
// Rebuild from research files so withdrawn or corrected candidates do not linger.
for(const car of inventory.cars)car.images=[];
const sources=['research-toyota.json','research-japanese.json','research-other.json','extra-toyota.json','extra-japan.json','extra-other.json','extra-manual.json','missing-bmw.json','missing-mercedes.json','missing-misc.json'];
for(const name of sources){
  let records;
  try{records=JSON.parse(await readFile(new URL(name,root),'utf8'))}catch(e){if(e.code==='ENOENT')continue;throw e}
  for(const image of records){
    const car=inventory.cars.find(c=>c.brand===image.brand&&c.model===image.model);
    if(!car||!Array.isArray(image.years)||!image.file?.startsWith('files/')||image.file.includes('..'))continue;
    if(!image.source||!image.author||!image.license||!image.license_url||!image.description)continue;
    try{await access(new URL(image.file,root))}catch{continue}
    const years=image.years.filter(y=>car.years.includes(y));
    const record={...image,years};
    delete record.brand;delete record.model;
    const existing=car.images.findIndex(p=>p.file===record.file);
    if(existing>=0)car.images[existing]=record;
    else if(!car.images.some(p=>p.source===record.source))car.images.push(record);
  }
}
await writeFile(path,JSON.stringify(inventory,null,2)+'\n');
console.log(`${inventory.cars.filter(c=>c.images.length).length}/${inventory.cars.length} models have at least one image`);
