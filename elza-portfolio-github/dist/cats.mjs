const messages = Object.freeze([
  { title:'A curiosidade matou o gato…', punch:'de vontade de aparecer.', note:'Três visitantes. Zero explicações. Todos muito vivos.' },
  { title:'Você encontrou um bug.', punch:'Era só um gato.', note:'Miau.exe executado com sucesso. Pode continuar a investigação.' },
  { title:'Você clicou por curiosidade.', punch:'Eles entenderam “petisco”.', note:'O atendimento felino chegou antes do previsto.' },
  { title:'Era para ter silêncio.', punch:'Vieram três gatos.', note:'Um deles já se declarou dono deste portfólio.' },
  { title:'A curiosidade chamou.', punch:'O comitê dos gatos veio.', note:'A pauta da reunião é: carinho, cochilo e mais carinho.' },
]);
const coats = ['ink','ginger','cream','smoke','tuxedo'];

function nextDifferent(length,previous,random) {
  const value = Math.floor(random() * (previous < 0 ? length : length-1));
  return previous >= 0 && value >= previous ? value+1 : value;
}

export function mountCats({document,window,random=Math.random}) {
  const trigger = document.getElementById('tree-curiosity');
  const dialog = document.getElementById('cat-surprise');
  if (!trigger || !dialog) return null;
  const visitors = document.getElementById('cat-visitors');
  const title = document.getElementById('cat-surprise-title');
  const closeButton = document.getElementById('cat-surprise-close');
  const cats = [...dialog.querySelectorAll('.visitor-cat')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const headerCat = document.getElementById('header-cat');
  const cleanups=[]; let timer, lastMessage=-1, lastCoat=-1, origin=trigger;
  const on=(target,type,fn)=>{target.addEventListener(type,fn);cleanups.push(()=>target.removeEventListener(type,fn));};
  const canMove=()=>!reduced.matches&&!document.hidden&&!document.body.classList.contains('motion-paused');
  function stop() {window.clearTimeout(timer);visitors.classList.remove('is-jumping');}
  function reveal(blackCat=false) {
    stop();
    lastMessage=nextDifferent(messages.length,lastMessage,random);
    const message=messages[lastMessage];const punch=document.createElement('em');punch.textContent=message.punch;
    title.replaceChildren(document.createTextNode(message.title),punch);
    document.getElementById('cat-surprise-note').textContent=message.note;
    lastCoat=blackCat ? coats.indexOf('ink') : nextDifferent(coats.length,lastCoat,random);
    const palette=[coats[lastCoat]];const remaining=coats.filter(coat=>coat!==palette[0]);
    for(let i=0;i<2;i++)palette.push(remaining.splice(Math.floor(random()*remaining.length),1)[0]);
    cats.forEach((cat,i)=>{cat.dataset.coat=palette[i===1?0:i===0?1:2];});
    if(canMove()) {void visitors.offsetWidth;visitors.classList.add('is-jumping');timer=window.setTimeout(stop,850);}
  }
  function open(returnFocus=trigger,blackCat=false) {
    if(dialog.open || document.querySelector('dialog[open]'))return false;
    origin=returnFocus;dialog.showModal();document.body.classList.add('dialog-open');reveal(blackCat);closeButton.focus();return true;
  }
  trigger.disabled=false;
  on(trigger,'click',()=>open(trigger));
  if(headerCat){headerCat.disabled=false;on(headerCat,'click',()=>open(headerCat,true));}
  on(document.getElementById('cat-surprise-again'),'click',()=>reveal());
  for(const button of [closeButton,document.getElementById('cat-surprise-back')])on(button,'click',()=>dialog.close());
  on(dialog,'close',()=>{stop();if(!document.querySelector('dialog[open]'))document.body.classList.remove('dialog-open');origin.focus({preventScroll:true});});
  on(dialog,'cancel',stop);
  on(dialog,'click',event=>{
    if(event.target!==dialog)return;
    const box=dialog.getBoundingClientRect();
    if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();
  });
  const sync=()=>{if(!canMove())stop();};
  on(reduced,'change',sync);on(document,'visibilitychange',sync);
  const observer=new window.MutationObserver(sync);observer.observe(document.body,{attributes:true,attributeFilter:['class']});
  return {open,dispose(){stop();if(dialog.open)dialog.close();cleanups.forEach(fn=>fn());observer.disconnect();trigger.disabled=true;if(headerCat)headerCat.disabled=true;}};
}
if(typeof document!=='undefined'&&typeof window!=='undefined') {
  const cats=mountCats({document,window});
  window.addEventListener('pagehide',event=>{if(!event.persisted)cats?.dispose();});
}
