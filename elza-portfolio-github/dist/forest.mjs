const views=Object.freeze({rio:{position:30,label:'À margem do rio'},bosque:{position:50,label:'No coração do bosque'},copas:{position:70,label:'Entre árvores e folhas'}});
export function mountForest({document}) {
  const scene=document.getElementById('forest-scene');if(!scene)return null;
  const controls=document.getElementById('forest-controls');
  const pan=document.getElementById('forest-pan');
  const buttons=[...document.querySelectorAll('[data-forest-view]')];
  const light=document.getElementById('forest-light');const cleanups=[];
  const on=(node,type,fn)=>{node.addEventListener(type,fn);cleanups.push(()=>node.removeEventListener(type,fn));};
  function setPosition(position,id='') {
    const value=Number(position);if(!Number.isFinite(value))return false;
    const bounded=Math.max(20,Math.min(80,value));
    scene.style.setProperty('--forest-position',`${bounded}%`);pan.value=String(bounded);
    buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.forestView===id)));
    document.getElementById('forest-view-output').textContent=id?views[id].label:'Seu próprio enquadramento';return true;
  }
  function setView(id){return views[id]?setPosition(views[id].position,id):false;}
  buttons.forEach(button=>on(button,'click',()=>setView(button.dataset.forestView)));
  on(pan,'input',()=>setPosition(pan.value));
  on(light,'click',()=>{const enabled=light.getAttribute('aria-pressed')!=='true';light.setAttribute('aria-pressed',String(enabled));scene.dataset.rays=enabled?'on':'off';light.textContent=enabled?'Luz filtrada ligada':'Luz filtrada desligada';});
  controls.hidden=false;setView('bosque');
  return {setView,dispose(){cleanups.forEach(fn=>fn());}};
}
if(typeof document!=='undefined'&&typeof window!=='undefined') {
  const forest=mountForest({document});window.addEventListener('pagehide',event=>{if(!event.persisted)forest?.dispose();});
}
