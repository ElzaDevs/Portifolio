import { cardTilt } from './spatial-policy.mjs';
import { loadAtelier } from './diorama.mjs';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
const cards = [...document.querySelectorAll('.project-card')];
function reset(card) {
  card.style.removeProperty('--tilt-x'); card.style.removeProperty('--tilt-y'); card.style.removeProperty('--light-x'); card.style.removeProperty('--light-y');
  card.classList.remove('is-tilting');
}
function allowed() { return fine.matches && !reduced.matches && !document.body.classList.contains('motion-paused'); }
for (const card of cards) {
  card.addEventListener('pointermove', event => {
    if (!allowed() || event.pointerType !== 'mouse' || card.contains(document.activeElement)) { reset(card); return; }
    const tilt = cardTilt(event.clientX, event.clientY, card.getBoundingClientRect(), 2.5);
    card.style.setProperty('--tilt-x', `${tilt.x}deg`); card.style.setProperty('--tilt-y', `${tilt.y}deg`);
    card.style.setProperty('--light-x', `${tilt.lightX}%`); card.style.setProperty('--light-y', `${tilt.lightY}%`);
    card.classList.add('is-tilting');
  }, { passive: true });
  card.addEventListener('pointerleave', () => reset(card));
  card.addEventListener('focusin', () => reset(card));
}
function resetAll() { cards.forEach(reset); }
reduced.addEventListener('change', resetAll); fine.addEventListener('change', resetAll);
new MutationObserver(resetAll).observe(document.body, { attributes: true, attributeFilter: ['class'] });
let mounted, mounting = false;
async function start() { if (mounted || mounting) return; mounting = true; try { mounted = await loadAtelier({ document, window }); } finally { mounting = false; } }
const stage = document.getElementById('atelier-stage');
document.addEventListener('portfolio:scene-3d', () => { if (stage.dataset.world === 'garden') start(); });
if (stage.dataset.world && stage.dataset.world !== 'garden') {
  // The illustrated world is usable immediately; WebGL loads only on request.
} else if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); start(); }
  }, { rootMargin: '200px' });
  observer.observe(stage);
} else start();
window.addEventListener('pagehide', event => { if (!event.persisted) mounted?.dispose(); });
