/** Pointer depth affects scenery only. Touch, focus and scrolling stay on their native paths. */
export function mountNature({ document, window }) {
  const surfaces = [...document.querySelectorAll('[data-canopy]')];
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  const cleanups = []; const pending = new Map();
  const allowed = () => fine.matches && !reduced.matches && !document.body.classList.contains('motion-paused') && !document.hidden;
  const reset = surface => {
    if (pending.has(surface)) window.cancelAnimationFrame(pending.get(surface)); pending.delete(surface);
    surface.style.removeProperty('--canopy-x'); surface.style.removeProperty('--canopy-y');
  };
  const resetAll = () => surfaces.forEach(reset);
  function syncPolicy() { resetAll(); surfaces.forEach(surface => surface.classList.toggle('nature-still', !allowed())); }
  const on = (target, name, fn) => { target.addEventListener(name,fn); cleanups.push(() => target.removeEventListener(name,fn)); };
  const rainToggle = document.getElementById('rain-toggle');
  const rain = document.getElementById('tree-rain');
  const tree = document.getElementById('tree-art');
  const treeFigure = document.getElementById('tree-figure');
  if (rainToggle && rain && tree && treeFigure) {
    let retried = false;
    const ready = () => { if (tree.naturalWidth > 0) { treeFigure.hidden = false; rainToggle.hidden = false; } };
    const fail = () => {
      rain.hidden = true; rainToggle.hidden = true; rainToggle.setAttribute('aria-pressed','false');
      rainToggle.textContent = 'Ver chuva cair';
      if (!retried && tree.dataset.fallback) { retried = true; tree.src = tree.dataset.fallback; }
      else treeFigure.hidden = true;
    };
    on(tree,'load',ready); on(tree,'error',fail);
    if (tree.complete) tree.naturalWidth > 0 ? ready() : fail();
    on(rainToggle,'click',() => {
      if (rainToggle.hidden || tree.naturalWidth === 0) return;
      const enabled = rainToggle.getAttribute('aria-pressed') !== 'true';
      rainToggle.setAttribute('aria-pressed',String(enabled)); rain.hidden = !enabled;
      rainToggle.textContent = enabled ? 'Pausar a chuva' : 'Ver chuva cair';
    });
  }
  surfaces.forEach(surface => {
    on(surface, 'pointermove', event => {
      if (event.pointerType !== 'mouse' || !allowed()) { reset(surface); return; }
      if (pending.has(surface)) return;
      const x = event.clientX, y = event.clientY;
      pending.set(surface, window.requestAnimationFrame(() => {
        pending.delete(surface); if (!allowed()) return;
        const box = surface.getBoundingClientRect();
        const nx = Math.max(-1,Math.min(1,(x-box.left)/Math.max(1,box.width)*2-1));
        const ny = Math.max(-1,Math.min(1,(y-box.top)/Math.max(1,box.height)*2-1));
        surface.style.setProperty('--canopy-x', `${nx*6}px`); surface.style.setProperty('--canopy-y', `${ny*4}px`);
      }));
    });
    on(surface,'pointerleave',() => reset(surface)); on(surface,'focusin',() => reset(surface));
  });
  on(reduced,'change',syncPolicy); on(fine,'change',syncPolicy); on(document,'visibilitychange',syncPolicy);
  const bodyObserver = new window.MutationObserver(syncPolicy);
  bodyObserver.observe(document.body,{attributes:true,attributeFilter:['class']});
  let observer;
  if (window.IntersectionObserver) {
    observer = new window.IntersectionObserver(entries => entries.forEach(entry => {
      entry.target.classList.toggle('nature-visible',entry.isIntersecting);
      if (!entry.isIntersecting) reset(entry.target);
    }),{threshold:0.01});
    surfaces.forEach(surface => observer.observe(surface));
  } else surfaces.forEach(surface => surface.classList.add('nature-visible'));
  syncPolicy();
  return { dispose() { resetAll(); cleanups.forEach(cleanup => cleanup()); bodyObserver.disconnect(); observer?.disconnect(); } };
}
if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  const nature = mountNature({document,window});
  window.addEventListener('pagehide',event => { if (!event.persisted) nature.dispose(); });
}
