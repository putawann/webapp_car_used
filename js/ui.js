export function initUI(){}
export function scrollToEl(el){el?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'})}
export function scramble(el,text){el.textContent=text}
export function refresh(){}
