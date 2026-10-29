import {readFile, access} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {SPEC} from '../js/specs.js';
import {findCarImage} from '../js/car-images.js';

const root=new URL('../data/car-images/',import.meta.url);
const inventory=JSON.parse(await readFile(new URL('inventory.json',root),'utf8'));
const encoder=JSON.parse(await readFile(new URL('../model/encoder.json',import.meta.url),'utf8'));
const newspaper=inventory.image_style==='newspaper'?JSON.parse(await readFile(new URL('newspaper-manifest.json',root),'utf8')):null;
if(newspaper)assert.equal(new Set(newspaper.items.map(item=>item.output_file)).size,newspaper.items.length,'Illustration filenames must be unique');
assert.equal(inventory.model_id,encoder.model_id);
assert.deepEqual(new Set(inventory.cars.map(c=>`${c.brand}|${c.model}`)),new Set(encoder.known_brand_model_pairs));
let images=0,covered=0;
for(const car of inventory.cars){
  const expected=Object.keys(SPEC[car.brand][car.model]).map(Number).sort((a,b)=>a-b);
  assert.deepEqual(car.years,expected);
  const seen=new Set();
  for(const image of car.images){
    assert(image.file.startsWith('files/')&&!image.file.includes('..'));
    await access(new URL(image.file,root));
    if(newspaper){
      assert(image.illustration_file?.startsWith('newspaper/')&&!image.illustration_file.includes('..'));
      await access(new URL(image.illustration_file,root));
      const entry=newspaper.items.find(item=>item.brand===car.brand&&item.model===car.model&&item.original_file===image.file);
      assert.equal(entry?.status,'complete',`Unreviewed illustration: ${image.file}`);
      assert.equal(entry.output_file,image.illustration_file);
      assert(image.illustration_changes,'Transformed images must identify the changes');
    }
    for(const field of ['author','source','license','license_url','description'])assert(image[field],`${car.brand} ${car.model}: missing ${field}`);
    for(const year of image.years){assert(expected.includes(year));seen.add(year)}
    images++;
  }
  covered+=seen.size;
}
console.log(`image inventory ok: ${inventory.cars.length} models, ${images} images, ${covered} model-years covered`);
if(newspaper)assert.equal(newspaper.items.length,images,'Every original image must have one illustration');
const first=inventory.cars.find(c=>c.brand==='TOYOTA'&&c.model==='CAMRY');
assert(findCarImage([first],'TOYOTA','CAMRY',2018)?.matchingYear);
const synthetic=[{brand:'TEST',model:'CAR',images:[{years:[2020],file:'a'},{years:[2021],file:'b'}]}];
assert.equal(findCarImage(synthetic,'TEST','CAR',2021).photo.file,'b');
assert.equal(findCarImage(synthetic,'TEST','CAR',2019).matchingYear,false);
assert.equal(findCarImage(synthetic,'TEST','OTHER',2020),null);
