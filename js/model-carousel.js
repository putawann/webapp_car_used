import {findCarImage} from './car-images.js';

// One selection shared by the picture rail and the native model dropdown.
export function createModelCarousel({track,previous,next,status,onSelect}){
  let brand='',models=[],selected='',year=0,cars=[],labels={},buttons=[];
  let settleTimer,programmatic=false;
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const imageUrl=photo=>new URL(`../data/car-images/${photo.illustration_file||photo.file}`,import.meta.url).href;

  function paintSelection(){
    const index=models.indexOf(selected);
    buttons.forEach((button,i)=>{
      button.setAttribute('aria-pressed',i===index?'true':'false');
      button.tabIndex=i===index?0:-1;
      button.querySelector('.model-selected').textContent=labels.selectedModel;
    });
    previous.disabled=index<=0;
    next.disabled=index<0||index>=models.length-1;
    previous.textContent=labels.previousModel;
    next.textContent=labels.nextModel;
    status.textContent=models.length?`${index+1} / ${models.length} · ${brand} ${selected}`:labels.noModels;
  }

  function reveal(behavior='smooth'){
    const index=models.indexOf(selected),button=buttons[index];
    if(!button)return;
    // Keep three complete cards in view; center the selection when it has neighbours.
    const first=Math.max(0,Math.min(index-1,models.length-3));
    const left=buttons[first].offsetLeft;
    programmatic=true;
    clearTimeout(settleTimer);
    track.scrollTo({left:Math.max(0,left),behavior:reduced()?'instant':behavior});
    settleTimer=setTimeout(()=>{programmatic=false},400);
  }

  function choose(index,{scroll=true,focus=false}={}){
    if(index<0||index>=models.length)return;
    const changed=selected!==models[index];
    selected=models[index];
    paintSelection();
    if(changed)onSelect(selected);
    if(scroll)reveal();
    if(focus)buttons[index].focus({preventScroll:true});
  }

  function setImage(button,model){
    const photo=findCarImage(cars,brand,model,year)?.photo;
    const img=button.querySelector('img'),fallback=button.querySelector('.model-image-fallback');
    fallback.textContent=labels.noImage;
    fallback.hidden=!!photo;
    img.hidden=!photo;
    if(!photo){img.removeAttribute('src');return}
    const url=imageUrl(photo);
    if(img.src!==url)img.src=url;
  }

  function update(state){
    const rebuild=brand!==state.brand||models.join('|')!==state.models.join('|');
    const changed=selected!==state.selected;
    ({brand,models,selected,year,cars,labels}=state);
    if(rebuild){
      buttons=models.map(model=>{
        const button=document.createElement('button');
        button.type='button';button.className='model-card';button.dataset.model=model;
        const visual=document.createElement('span');visual.className='model-visual';
        const img=document.createElement('img');img.alt='';img.loading='lazy';img.decoding='async';
        img.width=600;img.height=450;
        const fallback=document.createElement('span');fallback.className='model-image-fallback';fallback.hidden=true;
        img.onerror=()=>{img.hidden=true;fallback.hidden=false};
        visual.append(img,fallback);
        const name=document.createElement('span');name.className='model-name';name.textContent=model;
        const badge=document.createElement('span');badge.className='model-selected';
        button.append(visual,name,badge);
        button.onclick=()=>choose(models.indexOf(model));
        return button;
      });
      track.replaceChildren(...buttons);
      track.scrollLeft=0;
    }
    buttons.forEach((button,i)=>setImage(button,models[i]));
    paintSelection();
    if(rebuild||changed)reveal('instant');
  }

  previous.onclick=()=>choose(models.indexOf(selected)-1);
  next.onclick=()=>choose(models.indexOf(selected)+1);
  track.onkeydown=event=>{
    const index=models.indexOf(selected);
    const target={ArrowLeft:index-1,ArrowRight:index+1,Home:0,End:models.length-1}[event.key];
    if(target===undefined)return;
    event.preventDefault();choose(target,{focus:true});
  };
  const userScroll=()=>{programmatic=false;clearTimeout(settleTimer)};
  track.addEventListener('pointerdown',userScroll,{passive:true});
  track.addEventListener('wheel',userScroll,{passive:true});
  track.addEventListener('scroll',()=>{
    clearTimeout(settleTimer);
    if(programmatic){settleTimer=setTimeout(()=>{programmatic=false},160);return}
    settleTimer=setTimeout(()=>{
      if(!buttons.length)return;
      const bounds=track.getBoundingClientRect(),center=bounds.left+bounds.width/2;
      let index;
      if(track.scrollLeft<=2)index=0;
      else if(track.scrollLeft+track.clientWidth>=track.scrollWidth-2)index=models.length-1;
      else index=buttons.reduce((best,button,i)=>{
        const box=button.getBoundingClientRect(),prev=buttons[best].getBoundingClientRect();
        return Math.abs(box.left+box.width/2-center)<Math.abs(prev.left+prev.width/2-center)?i:best;
      },0);
      choose(index,{scroll:false});
    },160);
  },{passive:true});
  new ResizeObserver(()=>reveal('instant')).observe(track);
  return {update};
}
