import {findCarImage} from './car-images.js';

// One selection shared by the picture rail and the native model dropdown.
// With more than three models the rail loops: the cards are rendered three times and the
// scroll position is moved back to the middle copy whenever it settles in an outer copy.
export function createModelCarousel({track,previous,next,status,onSelect}){
  let brand='',models=[],selected='',year=0,cars=[],labels={},buttons=[],loop=false;
  let settleTimer,programmatic=false;
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const imageUrl=photo=>new URL(`../data/car-images/${photo.illustration_file||photo.file}`,import.meta.url).href;
  const wrap=i=>loop?(i+models.length)%models.length:i;

  function paintSelection(){
    const index=models.indexOf(selected),n=models.length;
    buttons.forEach((button,i)=>{
      const on=n>0&&i%n===index;
      button.setAttribute('aria-pressed',on?'true':'false');
      button.tabIndex=on&&button.getAttribute('aria-hidden')!=='true'?0:-1;
      button.querySelector('.model-selected').textContent=labels.selectedModel;
    });
    previous.disabled=!loop&&index<=0;
    next.disabled=!loop&&(index<0||index>=n-1);
    previous.textContent=labels.previousModel;
    next.textContent=labels.nextModel;
    status.textContent=n?`${index+1} / ${n} · ${brand} ${selected}`:labels.noModels;
  }

  // Index of the card whose left edge is nearest the current scroll position.
  function startCard(){
    return buttons.reduce((best,button,i)=>
      Math.abs(button.offsetLeft-track.scrollLeft)<Math.abs(buttons[best].offsetLeft-track.scrollLeft)?i:best,0);
  }

  function scrollToCard(position,behavior){
    programmatic=true;
    clearTimeout(settleTimer);
    track.scrollTo({left:Math.max(0,buttons[position].offsetLeft),behavior:reduced()?'instant':behavior});
    settleTimer=setTimeout(settle,400);
  }

  function reveal(behavior='smooth'){
    const index=models.indexOf(selected),n=models.length;
    if(index<0||!buttons.length)return;
    if(!loop){
      // Keep three complete cards in view; center the selection when it has neighbours.
      scrollToCard(Math.max(0,Math.min(index-1,n-3)),behavior);
      return;
    }
    // Show the selection in the middle, using whichever copy is closest so wrapping scrolls one card.
    const from=startCard();
    const target=[0,1,2].map(k=>k*n+index-1).filter(p=>p>=0&&p<=3*n-3)
      .reduce((best,p)=>Math.abs(p-from)<Math.abs(best-from)?p:best);
    scrollToCard(target,behavior);
  }

  // Jump back to the matching card in the middle copy; the copies look identical, so this is invisible.
  function recenter(){
    if(!loop)return;
    const n=models.length,start=startCard(),span=buttons[n].offsetLeft-buttons[0].offsetLeft;
    const shift=start<n-1?span:start>2*n-2?-span:0;
    if(!shift)return;
    programmatic=true;
    track.scrollTo({left:track.scrollLeft+shift,behavior:'instant'});
    clearTimeout(settleTimer);
    settleTimer=setTimeout(settle,160);
  }

  function settle(){
    const user=!programmatic;
    programmatic=false;
    if(!buttons.length)return;
    if(user){
      let index;
      if(loop)index=(startCard()+1)%models.length;
      else if(track.scrollLeft<=2)index=0;
      else if(track.scrollLeft+track.clientWidth>=track.scrollWidth-2)index=models.length-1;
      else{
        const bounds=track.getBoundingClientRect(),center=bounds.left+bounds.width/2;
        index=buttons.reduce((best,button,i)=>{
          const box=button.getBoundingClientRect(),prev=buttons[best].getBoundingClientRect();
          return Math.abs(box.left+box.width/2-center)<Math.abs(prev.left+prev.width/2-center)?i:best;
        },0);
      }
      choose(index,{scroll:false});
    }
    recenter();
  }

  function choose(index,{scroll=true,focus=false}={}){
    index=wrap(index);
    if(index<0||index>=models.length)return;
    const changed=selected!==models[index];
    selected=models[index];
    paintSelection();
    if(changed)onSelect(selected);
    if(scroll)reveal();
    if(focus)buttons[loop?models.length+index:index].focus({preventScroll:true});
  }

  function card(model,clone){
    const button=document.createElement('button');
    button.type='button';button.className='model-card';button.dataset.model=model;
    if(clone)button.setAttribute('aria-hidden','true');
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
      loop=models.length>3;
      const copy=clone=>models.map(model=>card(model,clone));
      buttons=loop?[...copy(true),...copy(false),...copy(true)]:copy(false);
      track.replaceChildren(...buttons);
      track.scrollLeft=0;
    }
    buttons.forEach((button,i)=>setImage(button,models[i%models.length]));
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
    settleTimer=setTimeout(settle,160);
  },{passive:true});
  new ResizeObserver(()=>reveal('instant')).observe(track);
  return {update};
}
