// A rail of picture cards that shares one selection with a native dropdown (used for brands and models).
// With more than three items the rail loops: the cards are rendered three times and the
// scroll position is moved back to the middle copy whenever it settles in an outer copy.
// render(visual,item) fills a card's picture area; it runs on every update so it must be repeatable.
// label(item) is the card caption and name(item) the status line text (both default to the item itself).
export function createCarousel({track,previous,next,status,onSelect,render}){
  let items=[],selected='',labels={},name=item=>item,label=item=>item,buttons=[],loop=false;
  // expected: the card the code itself is scrolling to; a scroll that settles anywhere else came from the user.
  let settleTimer,expected=null;
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wrap=i=>loop?(i+items.length)%items.length:i;

  function paintSelection(){
    const index=items.indexOf(selected),n=items.length;
    buttons.forEach((button,i)=>{
      const on=n>0&&i%n===index;
      button.setAttribute('aria-pressed',on?'true':'false');
      button.tabIndex=on&&button.getAttribute('aria-hidden')!=='true'?0:-1;
      button.querySelector('.model-selected').textContent=labels.selected;
    });
    previous.disabled=!loop&&index<=0;
    next.disabled=!loop&&(index<0||index>=n-1);
    previous.textContent=labels.previous;
    next.textContent=labels.next;
    status.textContent=n?`${index+1} / ${n} · ${name(selected)}`:labels.none;
  }

  // Index of the card whose left edge is nearest the current scroll position.
  function startCard(){
    return buttons.reduce((best,button,i)=>
      Math.abs(button.offsetLeft-track.scrollLeft)<Math.abs(buttons[best].offsetLeft-track.scrollLeft)?i:best,0);
  }

  function scrollToCard(position,behavior){
    expected=position;
    clearTimeout(settleTimer);
    track.scrollTo({left:Math.max(0,buttons[position].offsetLeft),behavior:reduced()?'instant':behavior});
    settleTimer=setTimeout(settle,400);
  }

  function reveal(behavior='smooth'){
    const index=items.indexOf(selected),n=items.length;
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
    const n=items.length,start=startCard(),span=buttons[n].offsetLeft-buttons[0].offsetLeft;
    const shift=start<n-1?span:start>2*n-2?-span:0;
    if(!shift)return;
    expected=start+(shift>0?n:-n);
    track.scrollTo({left:track.scrollLeft+shift,behavior:'instant'});
    clearTimeout(settleTimer);
    settleTimer=setTimeout(settle,160);
  }

  function settle(){
    if(!buttons.length)return;
    const user=expected===null||startCard()!==expected;
    expected=null;
    if(user){
      let index;
      if(loop)index=(startCard()+1)%items.length;
      else if(track.scrollLeft<=2)index=0;
      else if(track.scrollLeft+track.clientWidth>=track.scrollWidth-2)index=items.length-1;
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
    if(index<0||index>=items.length)return;
    const changed=selected!==items[index];
    selected=items[index];
    paintSelection();
    if(changed)onSelect(selected);
    if(scroll)reveal();
    if(focus)buttons[loop?items.length+index:index].focus({preventScroll:true});
  }

  function card(item,clone){
    const button=document.createElement('button');
    button.type='button';button.className='model-card';button.dataset.item=item;
    if(clone)button.setAttribute('aria-hidden','true');
    const visual=document.createElement('span');visual.className='model-visual';
    const caption=document.createElement('span');caption.className='model-name';
    const badge=document.createElement('span');badge.className='model-selected';
    button.append(visual,caption,badge);
    button.onclick=()=>choose(items.indexOf(item));
    return button;
  }

  // state: {items, selected, labels:{selected,previous,next,none}, name?, label?}
  function update(state){
    const rebuild=items.join('|')!==state.items.join('|');
    const changed=selected!==state.selected;
    ({items,selected,labels}=state);
    name=state.name||(item=>item);
    label=state.label||(item=>item);
    if(rebuild){
      loop=items.length>3;
      const copy=clone=>items.map(item=>card(item,clone));
      buttons=loop?[...copy(true),...copy(false),...copy(true)]:copy(false);
      track.replaceChildren(...buttons);
      track.scrollLeft=0;
    }
    buttons.forEach((button,i)=>{
      const item=items[i%items.length];
      render(button.querySelector('.model-visual'),item);
      button.querySelector('.model-name').textContent=label(item);
    });
    paintSelection();
    if(rebuild||changed)reveal('instant');
  }

  previous.onclick=()=>choose(items.indexOf(selected)-1);
  next.onclick=()=>choose(items.indexOf(selected)+1);
  track.onkeydown=event=>{
    const index=items.indexOf(selected);
    const target={ArrowLeft:index-1,ArrowRight:index+1,Home:0,End:items.length-1}[event.key];
    if(target===undefined)return;
    event.preventDefault();choose(target,{focus:true});
  };
  track.addEventListener('scroll',()=>{
    clearTimeout(settleTimer);
    settleTimer=setTimeout(settle,160);
  },{passive:true});
  // Browsers with scrollend report the stop directly; the timer above covers the rest.
  track.addEventListener('scrollend',()=>{clearTimeout(settleTimer);settle()},{passive:true});
  new ResizeObserver(()=>reveal('instant')).observe(track);
  return {update};
}
