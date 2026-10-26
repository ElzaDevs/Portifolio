import { calculatePriority } from './journey.mjs';

export const missions = Object.freeze([
  { title: '01 / Uma ideia pode esperar', text: 'Uma melhoria pequena, sem pressa. Encontre a combinação de impacto baixo e urgência baixa.', impact: 'baixo', urgency: 'baixa', lesson: 'Prioridade D: um impacto baixo com pouca urgência pode entrar no planejamento.' },
  { title: '02 / Urgente tem contexto', text: 'Agora mantenha o impacto baixo e leve a urgência a crítica. Qual prioridade a matriz devolve?', impact: 'baixo', urgency: 'critica', lesson: 'Prioridade B: urgência crítica, sozinha, não transforma toda solicitação em prioridade A.' },
  { title: '03 / Atenção ao que importa', text: 'Aumente o impacto para alto e mantenha a urgência crítica. Compare a nova resposta.', impact: 'alto', urgency: 'critica', lesson: 'Prioridade A: nesta regra, alto impacto com urgência crítica recebe a maior prioridade.' },
]);

export function mountLabGame({ document }) {
  const check = document.getElementById('mission-check');
  if (!check) return null;
  const get = id => document.getElementById(id);
  const impact = get('impact-select'), urgency = get('urgency-select');
  const next = get('mission-next'), reset = get('mission-reset');
  const cleanups = []; let index = 0; const completed = new Set();
  const on = (node,type,fn) => { node.addEventListener(type,fn); cleanups.push(() => node.removeEventListener(type,fn)); };
  function render() {
    const mission = missions[index];
    get('mission-title').textContent = mission?.title ?? 'Seu caderno ganhou três descobertas.';
    get('mission-text').textContent = mission?.text ?? 'Você explorou como impacto e urgência se combinam. Continue experimentando livremente ou refaça o percurso.';
    get('mission-progress').textContent = `${completed.size} de ${missions.length} descobertas`;
    get('mission-fill').style.width = `${completed.size / missions.length * 100}%`;
    check.hidden = !mission; check.disabled = completed.has(index);
    next.hidden = !mission || !completed.has(index); reset.hidden = Boolean(mission);
    document.querySelectorAll('[data-mission-stamp]').forEach((stamp,i) => {
      stamp.dataset.complete = String(completed.has(i));
      stamp.setAttribute('aria-label',`Descoberta ${i+1}${completed.has(i) ? ', concluída' : ', a explorar'}`);
    });
  }
  function syncMatrix() {
    document.querySelectorAll('[data-matrix-cell]').forEach(cell => {
      const selected = cell.dataset.impact === impact.value && cell.dataset.urgency === urgency.value;
      if (selected) cell.setAttribute('aria-current','true'); else cell.removeAttribute('aria-current');
    });
  }
  on(check,'click',() => {
    const mission = missions[index]; if (!mission || completed.has(index)) return;
    const result = calculatePriority(impact.value,urgency.value);
    if (impact.value !== mission.impact || urgency.value !== mission.urgency) {
      get('mission-feedback').textContent = `Você encontrou prioridade ${result.code}. ${mission.text} Ajuste os dois controles e confira de novo.`;
      return;
    }
    completed.add(index); get('mission-feedback').textContent = `Descoberta registrada! ${mission.lesson}`;
    render(); next.focus();
  });
  on(next,'click',() => { if (!completed.has(index)) return; index++; get('mission-feedback').textContent = ''; render(); (index < missions.length ? check : reset).focus(); });
  on(reset,'click',() => { completed.clear(); index = 0; get('mission-feedback').textContent = ''; render(); check.focus(); });
  on(impact,'change',syncMatrix); on(urgency,'change',syncMatrix);
  for (const id of ['lab-preset','lab-reset']) on(get(id),'click',syncMatrix);
  render(); syncMatrix();
  return { dispose() { cleanups.forEach(fn => fn()); } };
}

export function mountTrails({ document }) {
  const cards = [...document.querySelectorAll('[data-trail-kind]')];
  const buttons = [...document.querySelectorAll('[data-trail-filter]')];
  const cleanups = [];
  const kinds = new Set(['todas',...cards.map(card => card.dataset.trailKind)]);
  function filter(kind) {
    if (!kinds.has(kind)) return false;
    cards.forEach(card => { card.hidden = kind !== 'todas' && card.dataset.trailKind !== kind; });
    buttons.forEach(button => button.setAttribute('aria-pressed',String(button.dataset.trailFilter === kind)));
    const visible = cards.filter(card => !card.hidden).length;
    const status = document.getElementById('trail-count');
    if (status) status.textContent = `${visible} de ${cards.length} trilhas`;
    return true;
  }
  buttons.forEach(button => { button.hidden = false; const fn = () => filter(button.dataset.trailFilter); button.addEventListener('click',fn); cleanups.push(() => button.removeEventListener('click',fn)); });
  filter('todas');
  return { filter, dispose() { cleanups.forEach(fn => fn()); } };
}

/** Finite, bounded bursts: no cursor trail, scroll capture or background loop. */
export function mountPetals({ document, window }) {
  const zones = [...document.querySelectorAll('[data-petal-zone]')];
  const toggles = [...document.querySelectorAll('[data-petal-toggle]')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const cleanups = [], timers = new Map(); let enabled = true;
  const on = (target,type,fn,options) => { target.addEventListener(type,fn,options); cleanups.push(() => target.removeEventListener(type,fn,options)); };
  const allowed = () => enabled && !reduced.matches && !document.hidden && !document.body.classList.contains('motion-paused');
  const clear = zone => { window.clearTimeout(timers.get(zone)); timers.delete(zone); const layer = zone.querySelector('.petal-layer'); layer?.replaceChildren(); };
  const stop = () => zones.forEach(clear);
  function burst(zone) {
    if (!allowed() || timers.has(zone)) return false;
    const box = zone.getBoundingClientRect();
    if (box.bottom <= 0 || box.top >= window.innerHeight) return false;
    const layer = zone.querySelector('.petal-layer'); if (!layer) return false;
    const visibleTop = Math.max(0,-box.top);
    layer.style.setProperty('--petal-top',`${visibleTop-30}px`);
    layer.style.setProperty('--petal-fall',`${Math.min(box.height-visibleTop,window.innerHeight-Math.max(0,box.top))+50}px`);
    const petals = Array.from({length:10},(_,i) => {
      const petal = document.createElement('i');
      petal.style.setProperty('--petal-left',`${6+i*9.3}%`);
      petal.style.setProperty('--petal-delay',`${(i%4)*.13}s`);
      petal.style.setProperty('--petal-drift',`${(i%2 ? -1 : 1)*(20+i*4)}px`);
      petal.style.setProperty('--petal-turn',`${i*37}deg`);
      return petal;
    });
    layer.replaceChildren(...petals); timers.set(zone,window.setTimeout(() => clear(zone),4200)); return true;
  }
  function sync() {
    if (!allowed()) stop();
    toggles.forEach(button => {
      button.disabled = reduced.matches || document.body.classList.contains('motion-paused');
      button.setAttribute('aria-pressed',String(enabled));
      button.textContent = button.disabled ? 'Pétalas em pausa' : enabled ? 'Pétalas ligadas' : 'Pétalas desligadas';
    });
  }
  toggles.forEach(button => { button.hidden = false; on(button,'click',() => { enabled = !enabled; sync(); }); });
  zones.forEach(zone => {
    on(zone,'change',() => burst(zone));
    on(zone,'toggle',event => { if (event.target.open) burst(zone); },true);
    on(zone,'click',event => { if (event.target.closest('[data-petal-trigger]')) burst(zone); });
  });
  on(reduced,'change',sync); on(document,'visibilitychange',sync);
  const mutation = new window.MutationObserver(sync); mutation.observe(document.body,{attributes:true,attributeFilter:['class']});
  let visibility;
  if (window.IntersectionObserver) { visibility = new window.IntersectionObserver(entries => entries.forEach(entry => { if (!entry.isIntersecting) clear(entry.target); }),{threshold:.01}); zones.forEach(zone => visibility.observe(zone)); }
  sync();
  return { burst, dispose() { stop(); cleanups.forEach(fn => fn()); mutation.disconnect(); visibility?.disconnect(); } };
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  const game = mountLabGame({document}), trails = mountTrails({document}), petals = mountPetals({document,window});
  window.addEventListener('pagehide',event => { if (!event.persisted) { game?.dispose(); trails.dispose(); petals.dispose(); } });
}
