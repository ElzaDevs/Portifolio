const views = Object.freeze({
  bakery: { label: 'NA CONFEITARIA DA KIKI', hint: 'Entre, escolha um caminho e deixe a curiosidade guiar.', source: 'https://www.pinterest.com/pin/tamagotchi-meetson-bg--427771664620176669/' },
  sky: { label: 'UMA CIDADE CHEIA DE POSSIBILIDADES', hint: 'Dê uma volta com a Kiki ou escolha seu próximo destino.', source: 'https://www.pinterest.com/pin/594404850796479753/' },
  garden: { label: 'UMA PAUSA NO JARDIM 3D', hint: 'Arraste para girar. Os três destinos continuam ao alcance.' },
});

export function mountKiki({ document, window }) {
  const card = document.getElementById('kiki-card');
  const stage = document.getElementById('atelier-stage');
  if (!card || !stage) return null;
  const status = document.getElementById('scene-status'), hint = document.getElementById('scene-hint');
  const flightButton = document.getElementById('kiki-fly'), rider = document.getElementById('kiki-rider');
  const modeButtons = [...document.querySelectorAll('[data-kiki-view]')];
  const source = document.getElementById('world-source'), spriteSource = document.getElementById('sprite-source');
  const bakery = document.getElementById('bakery-art'), city = document.getElementById('city-art');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cleanups = [];
  const on = (target,type,fn) => { target.addEventListener(type,fn); cleanups.push(() => target.removeEventListener(type,fn)); };
  let current = 'bakery', flightTimer;
  const canMove = () => !reduced.matches && !document.hidden && !document.body.classList.contains('motion-paused');
  function stopFlight() { window.clearTimeout(flightTimer); rider.classList.remove('is-flying'); flightButton.disabled = false; }
  function setView(id) {
    if (!Object.hasOwn(views,id)) return false;
    stopFlight(); current = id; card.dataset.world = stage.dataset.world = id;
    modeButtons.forEach(button => button.setAttribute('aria-pressed',String(button.dataset.kikiView === id)));
    bakery.setAttribute('aria-hidden',String(id !== 'bakery')); city.setAttribute('aria-hidden',String(id !== 'sky'));
    status.textContent = views[id].label; hint.textContent = views[id].hint;
    source.hidden = id === 'garden'; spriteSource.hidden = id !== 'sky';
    if (views[id].source) source.setAttribute('href',views[id].source);
    flightButton.hidden = id !== 'sky'; rider.hidden = id !== 'sky';
    document.dispatchEvent(new window.CustomEvent('portfolio:scene-mode',{detail:{view:id}}));
    if (id === 'garden') document.dispatchEvent(new window.CustomEvent('portfolio:scene-3d'));
    return true;
  }
  modeButtons.forEach(button => { button.hidden = false; on(button,'click',() => setView(button.dataset.kikiView)); });
  on(flightButton,'click',() => {
    if (current !== 'sky') return;
    stopFlight();
    const message = document.getElementById('shop-message');
    if (!canMove()) { message.textContent = 'O vento está em pausa. Os destinos e as encomendas continuam disponíveis.'; return; }
    const width = stage.clientWidth || stage.getBoundingClientRect().width || 400;
    rider.style.setProperty('--flight-span',`${Math.min(width*.46,200)}px`);
    void rider.offsetWidth; rider.classList.add('is-flying'); flightButton.disabled = true;
    message.textContent = 'Uma volta pela cidade. Qual projeto vai na próxima entrega?';
    flightTimer = window.setTimeout(stopFlight,5600);
  });
  document.querySelectorAll('[data-delivery-project]').forEach(button => on(button,'click',() => {
    stopFlight();
    document.dispatchEvent(new window.CustomEvent('portfolio:open-project',{detail:{id:button.dataset.deliveryProject,returnFocus:button}}));
  }));
  on(reduced,'change',stopFlight); on(document,'visibilitychange',stopFlight);
  const observer = new window.MutationObserver(() => { if (!canMove()) stopFlight(); });
  observer.observe(document.body,{attributes:true,attributeFilter:['class']});
  let visibilityObserver;
  if (window.IntersectionObserver) {
    visibilityObserver = new window.IntersectionObserver(entries => { if (!entries[0].isIntersecting) stopFlight(); },{threshold:.01}); visibilityObserver.observe(stage);
  }
  setView('bakery');
  return { setView, dispose() { stopFlight(); cleanups.forEach(cleanup => cleanup()); observer.disconnect(); visibilityObserver?.disconnect(); } };
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  const kiki = mountKiki({document,window});
  window.addEventListener('pagehide',event => { if (!event.persisted) kiki?.dispose(); });
}
