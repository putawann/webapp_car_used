// Exact-year images are preferred; other photos of the same model are illustrative fallbacks.
export function findCarImage(cars,brand,model,year){
  const car=cars.find(c=>c.brand===brand&&c.model===model);
  if(!car)return null;
  const photo=car.images.find(p=>!p.representative&&p.years.includes(year))||car.images[0];
  return photo?{photo,matchingYear:!photo.representative&&photo.years.includes(year)}:null;
}
