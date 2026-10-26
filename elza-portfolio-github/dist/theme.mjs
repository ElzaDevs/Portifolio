import { readPreference, savePreference } from './journey.mjs';

export function mountTheme({document,window}) {
  const button=document.getElementById('light-toggle');
  if(!button)return null;
  let storage;try{storage=window.localStorage;}catch{}
  let night=readPreference(storage,'elza-night-v1',false)===true;
  function render(announce=false) {
    document.body.classList.toggle('night',night);
    // Existing illustrated/3D lighting observes this class; night styles override its old sunset colors.
    document.body.classList.toggle('evening',night);
    button.setAttribute('aria-pressed',String(night));
    button.setAttribute('aria-label',night?'Mudar para o dia':'Mudar para a noite');
    button.setAttribute('title',night?'O jardim está à noite. Mudar para o dia':'O jardim está de dia. Mudar para a noite');
    document.getElementById('theme-icon')?.setAttribute('href',night?'#moon':'#sun');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',night?'#15251e':'#f3f5e3');
    const status=document.getElementById('theme-status');
    if(status&&announce)status.textContent=night?'A noite chegou ao jardim.':'O dia voltou ao jardim.';
  }
  const toggle=()=>{night=!night;render(true);savePreference(storage,'elza-night-v1',night);};
  button.addEventListener('click',toggle);render();
  return {dispose(){button.removeEventListener('click',toggle);}};
}
