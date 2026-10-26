import { projects } from './projects.mjs';
import { stops, calculatePriority, cleanIds, toggleSaved, readPreference, savePreference } from './journey.mjs';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
let storage;
try { storage = window.localStorage; } catch { storage = undefined; }
const allowedProjects = Object.keys(projects);
let visited = cleanIds(readPreference(storage, 'elza-visited-v1', []), stops);
let saved = cleanIds(readPreference(storage, 'elza-projects-v1', []), allowedProjects);
let toastTimer;
function announce(message) {
  const element = $('#experience-feedback');
  element.textContent = message;
  element.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('is-visible'), 3600);
}

function renderJourney() {
  $('#visited-count').textContent = `${visited.length} de ${stops.length} lugares visitados`;
  $('#visited-fill').style.width = `${visited.length / stops.length * 100}%`;
  $$('[data-stop]').forEach(link => {
    const seen = visited.includes(link.dataset.stop);
    link.classList.toggle('is-visited', seen);
    link.setAttribute('aria-label', `${link.querySelector('strong').textContent}${seen ? ', visitado' : ''}`);
  });
  const footerCount = $('#footer-visited-count');
  if (footerCount) {
    footerCount.textContent = `${visited.length} de ${stops.length} lugares visitados`;
    $('#footer-visited-fill').style.width = `${visited.length / stops.length * 100}%`;
    const nextId = stops.find(id => !visited.includes(id));
    $('#footer-next-route').setAttribute('href',`#${nextId ?? 'projetos'}`);
    const names = {sobre:'Minhas raízes',projetos:'O ateliê',tecnologias:'Ferramentas',trajetoria:'O mirante',contato:'O correio'};
    $('#footer-next-label').textContent = nextId ? `Próxima parada: ${names[nextId]}` : 'Passeio completo. Revisitar o ateliê';
  }
}
function recordVisit(id) {
  if (!stops.includes(id) || visited.includes(id)) return;
  visited.push(id);
  savePreference(storage, 'elza-visited-v1', visited);
  renderJourney();
}
renderJourney();
$('#reset-journey').addEventListener('click', () => {
  visited = [];
  savePreference(storage, 'elza-visited-v1', visited);
  renderJourney();
  announce('Caderno de viagem reiniciado. Escolha seu próximo caminho.');
});
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) recordVisit(entry.target.id); });
  }, { rootMargin: '-12% 0px -30% 0px', threshold: 0.05 });
  stops.forEach(id => { const section = document.getElementById(id); if (section) observer.observe(section); });
} else {
  $$('a[href^="#"]').forEach(link => link.addEventListener('click', () => recordVisit(link.getAttribute('href').slice(1))));
}

const openTriggers = new Map();
function openPanel(id, trigger) {
  const panel = document.getElementById(id);
  openTriggers.set(id, trigger);
  if (panel.open) return;
  panel.showModal();
  document.body.classList.add('dialog-open');
  panel.querySelector('.panel-close')?.focus();
}
function closePanel(id) { document.getElementById(id).close(); }
$$('[data-quick-open]').forEach(button => button.addEventListener('click', () => openPanel('quick-dialog', button)));
$('#bag-open').addEventListener('click', event => { renderBag(); openPanel('bag-dialog', event.currentTarget); });
$('#footer-bag-open')?.addEventListener('click',event => { renderBag(); openPanel('bag-dialog',event.currentTarget); });
$$('[data-close]').forEach(button => button.addEventListener('click', () => closePanel(button.dataset.close)));
$$('[data-close-link]').forEach(link => link.addEventListener('click', () => closePanel(link.dataset.closeLink)));
$$('.panel-dialog').forEach(panel => {
  panel.addEventListener('close', () => {
    if (!document.querySelector('dialog[open]')) document.body.classList.remove('dialog-open');
    openTriggers.get(panel.id)?.focus();
  });
  panel.addEventListener('click', event => {
    if (event.target !== panel) return;
    const box = panel.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) panel.close();
  });
});

function openProject(id, returnFocus = document.activeElement) { document.dispatchEvent(new CustomEvent('portfolio:open-project', {detail: {id, returnFocus}})); }
function renderBag() {
  $('#bag-count').textContent = saved.length;
  $('#bag-open').setAttribute('aria-label', `Abrir mochila, ${saved.length} ${saved.length === 1 ? 'projeto guardado' : 'projetos guardados'}`);
  $('#bag-empty').hidden = saved.length > 0;
  $('#bag-clear').hidden = saved.length === 0;
  const footerBag = $('#footer-bag-count');
  if (footerBag) footerBag.textContent = `${saved.length} de ${allowedProjects.length} projetos guardados`;
  const collectionCount = $('#bag-collection-count');
  if (collectionCount) {
    collectionCount.textContent = `${saved.length} de ${allowedProjects.length} projetos na mochila`;
    $('#bag-collection-fill').style.width = `${saved.length / allowedProjects.length * 100}%`;
    $('#bag-collection-title').textContent = saved.length === allowedProjects.length ? 'Coleção do ateliê completa' : ['Pronta para explorar', 'Seu primeiro achado', 'Uma boa dupla de ideias'][saved.length] ?? `${saved.length} ideias para explorar`;
    $('#bag-collection').classList.toggle('is-complete', saved.length === allowedProjects.length);
    $('#bag-collection').dataset.stage = String(saved.length);
  }
  $$('[data-bookmark]').forEach(button => {
    const active = saved.includes(button.dataset.bookmark);
    button.setAttribute('aria-pressed', String(active));
    button.classList.toggle('is-saved', active);
    button.querySelector('span').textContent = active ? 'Guardado na mochila' : 'Guardar na mochila';
  });
  const list = $('#bag-items');
  list.replaceChildren(...saved.map(id => {
    const li = document.createElement('li');
    const content = document.createElement('div');
    const title = document.createElement('strong'); title.textContent = projects[id].title;
    const tags = document.createElement('span'); tags.textContent = projects[id].tags.join(' · ');
    content.append(title, tags);
    const open = document.createElement('button'); open.type = 'button'; open.textContent = 'Abrir ↗';
    open.addEventListener('click', () => { const origin = openTriggers.get('bag-dialog') ?? $('#bag-open'); closePanel('bag-dialog'); openProject(id, origin); });
    const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'bag-remove'; remove.textContent = '✕';
    remove.setAttribute('aria-label', `Retirar ${projects[id].title} da mochila`);
    remove.addEventListener('click', () => { saved = saved.filter(value => value !== id); savePreference(storage, 'elza-projects-v1', saved); renderBag(); $('#bag-clear').hidden ? $('#bag-dialog .panel-close').focus() : $('#bag-clear').focus(); announce('Projeto retirado da mochila.'); });
    li.append(content, open, remove);
    return li;
  }));
}
$$('[data-bookmark]').forEach(button => button.addEventListener('click', () => {
  const id = button.dataset.bookmark;
  saved = toggleSaved(saved, id, allowedProjects);
  const persisted = savePreference(storage, 'elza-projects-v1', saved);
  renderBag();
  announce(saved.includes(id) ? `${projects[id].title} guardado${persisted ? ' na mochila.' : ' nesta visita. O navegador não permitiu salvar a seleção.'}` : 'Projeto retirado da mochila.');
}));
$('#bag-clear').addEventListener('click', () => { saved = []; savePreference(storage, 'elza-projects-v1', saved); renderBag(); $('#bag-dialog .panel-close').focus(); announce('Mochila esvaziada.'); });
renderBag();

const thoughts = [
  'Uma pausa para o café. Por onde vamos começar?',
  'Primeiro eu tento entender o problema. Depois escolho as ferramentas.',
  'O laboratório logo abaixo mostra uma regra real do Fluxo Inteligente.',
  'Gostou de um projeto? Guarde na mochila para voltar depois.',
  'Backend, interfaces e dados fazem parte de caminhos que se encontram.',
];
let thoughtIndex = 0;
$('#cat-tip').addEventListener('click', () => { thoughtIndex = (thoughtIndex + 1) % thoughts.length; $('#shop-message').textContent = thoughts[thoughtIndex]; });
let projectIndex = 0;
$('#surprise-project').addEventListener('click', () => { openProject(allowedProjects[projectIndex % allowedProjects.length], $('#surprise-project')); projectIndex++; });

const impact = $('#impact-select');
const urgency = $('#urgency-select');
function renderPriority() {
  const result = calculatePriority(impact.value, urgency.value);
  $('#priority-output').replaceChildren();
  const letter = document.createElement('b'); letter.textContent = result.code;
  const label = document.createElement('span'); label.textContent = `Prioridade ${result.label}`;
  $('#priority-output').append(letter, label);
  $('#priority-explanation').textContent = result.explanation;
  $('.priority-result').dataset.level = result.code;
}
impact.addEventListener('change', renderPriority);
urgency.addEventListener('change', renderPriority);
$('#lab-preset').addEventListener('click', () => { impact.value = 'alto'; urgency.value = 'critica'; renderPriority(); });
$('#lab-reset').addEventListener('click', () => { impact.value = 'medio'; urgency.value = 'media'; renderPriority(); });
renderPriority();

const tabs = $$('.about-tabs [role="tab"]');
function activateTab(tab) {
  tabs.forEach(item => {
    const selected = item === tab;
    item.setAttribute('aria-selected', String(selected));
    item.tabIndex = selected ? 0 : -1;
    document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
  });
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateTab(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length];
    if (event.key === 'ArrowLeft') next = tabs[(index - 1 + tabs.length) % tabs.length];
    if (event.key === 'Home') next = tabs[0];
    if (event.key === 'End') next = tabs.at(-1);
    if (next) { event.preventDefault(); activateTab(next); next.focus(); }
  });
});
$$('[data-skill-filter]').forEach(button => button.addEventListener('click', () => {
  $(`.filter[data-filter="${button.dataset.skillFilter}"]`)?.click();
  document.getElementById('projetos').scrollIntoView({behavior: document.body.classList.contains('motion-paused') ? 'auto' : 'smooth'});
}));

const mediaMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const storedMotion = readPreference(storage, 'elza-motion-v1', null);
let motionPaused = typeof storedMotion === 'boolean' ? storedMotion : false;
function renderMotion() {
  const effectivePause = motionPaused || mediaMotion.matches;
  document.body.classList.toggle('motion-paused', effectivePause);
  document.documentElement.classList.toggle('motion-paused', effectivePause);
  $('#motion-toggle').setAttribute('aria-pressed', String(effectivePause));
  $('#motion-toggle').disabled = mediaMotion.matches;
  $('#motion-toggle').setAttribute('aria-label', mediaMotion.matches ? 'Movimento reduzido conforme a preferência do dispositivo' : motionPaused ? 'Retomar animações' : 'Pausar animações');
  $('#motion-toggle').title = mediaMotion.matches ? 'Movimento reduzido conforme a preferência do dispositivo' : motionPaused ? 'Retomar animações' : 'Pausar animações';
}
$('#motion-toggle').addEventListener('click', () => { motionPaused = !motionPaused; savePreference(storage, 'elza-motion-v1', motionPaused); renderMotion(); });
mediaMotion.addEventListener('change', renderMotion);
renderMotion();

let scrollQueued = false;
function updateReadingProgress() {
  const height = document.documentElement.scrollHeight - window.innerHeight;
  const progress = height > 0 ? Math.min(1, Math.max(0, window.scrollY / height)) : 0;
  $('#reading-progress').style.transform = `scaleX(${progress})`;
  scrollQueued = false;
}
window.addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; window.requestAnimationFrame(updateReadingProgress); } }, {passive:true});
window.addEventListener('resize', updateReadingProgress);
updateReadingProgress();
