import test from 'node:test';
import assert from 'node:assert/strict';
import { projects, matchesFilter, projectCountLabel } from '../dist/projects.mjs';

test('project filters preserve the expected project sets', () => {
  const tags = ['backend python', 'frontend', 'python'];
  assert.deepEqual(tags.map(tag => matchesFilter(tag, 'all')), [true, true, true]);
  assert.deepEqual(tags.map(tag => matchesFilter(tag, 'backend')), [true, false, false]);
  assert.deepEqual(tags.map(tag => matchesFilter(tag, 'python')), [true, false, true]);
  assert.equal(matchesFilter('backend python', 'py'), false);
  assert.equal(projectCountLabel(1), '1 projeto');
  assert.equal(projectCountLabel(0), '0 projetos');
});

test('every detail has complete content and only confirmed repositories are linked', () => {
  for (const project of Object.values(projects)) {
    for (const key of ['title', 'category', 'summary', 'problem', 'status']) assert.ok(project[key]);
    assert.ok(project.learning.length >= 3);
    assert.ok(project.tags.length >= 3);
  }
  assert.equal(projects.lacrei.repo, 'https://github.com/ElzaDevs/lacrei-saude-frontend');
  assert.equal(projects.fluxo.repo, 'https://github.com/ElzaDevs/fluxo_inteligente');
  assert.equal(projects.mentalist.repo, 'https://github.com/ElzaDevs/The-Mentalist-CBI-Selection');
  assert.equal(projects.doctorx.repo,null);
  assert.match(projects.doctorx.status,/Em desenvolvimento/);
  assert.match(projects.atlas.status,/colaborativo de hackathon/);
  assert.equal(projects.atlas.repo,'https://github.com/EduardaAndrade16/Atlas-Skills');
});

// Minimal DOM harness executes the actual event handlers without a browser.
// It validates state transitions, not rendering, layout or native dialog behavior.
class Element {
  constructor(attrs = {}) { this.attrs = {...attrs}; this.dataset = {}; this.listeners = {}; this.hidden = false; this.textContent = ''; this.children = []; this.classes = new Set(); this.classList = { add: x => this.classes.add(x), remove: x => this.classes.delete(x), toggle: (x, force) => { const value = force ?? !this.classes.has(x); value ? this.classes.add(x) : this.classes.delete(x); return value; } }; }
  setAttribute(key, value) { this.attrs[key] = String(value); }
  getAttribute(key) { return this.attrs[key] ?? null; }
  removeAttribute(key) { delete this.attrs[key]; }
  addEventListener(event, handler) { (this.listeners[event] ??= []).push(handler); }
  async fire(event, extra = {}) { for (const handler of this.listeners[event] ?? []) await handler({ target: this, ...extra }); }
  focus() { this.focused = true; }
  replaceChildren(...items) { this.children = items; }
  showModal() { this.open = true; }
  close() { this.open = false; this.fire('close'); }
}

test('menu, filters, project details, clipboard and scene controls transition correctly', async () => {
  const ids = Object.fromEntries(['dialog-problem-title','dialog-learning-title','main-nav','light-toggle','filter-result','project-dialog','dialog-title','dialog-eyebrow','dialog-summary','dialog-problem','dialog-status','dialog-learning','dialog-tags','dialog-repo','dialog-pending','dialog-close','dialog-image-wrap','dialog-image','dialog-image-caption','copy-email','copy-feedback','email-link'].map(id => [id, new Element()]));
  ids['email-link'].attrs.href = 'mailto:elzamendes1212@gmail.com';
  const menu = new Element({'aria-expanded': 'false'});
  const filters = ['all','backend','frontend','python'].map(filter => Object.assign(new Element(), {dataset:{filter}}));
  const cards = ['backend python','frontend','python'].map(tags => Object.assign(new Element(), {dataset:{tags}}));
  const triggers = Object.keys(projects).map(project => Object.assign(new Element(), {dataset:{project}}));
  const navigationLinks = ['sobre','projetos','trajetoria','contato'].map(id => new Element({href:`#${id}`}));
  ids['main-nav'].querySelectorAll = () => navigationLinks;
  const body = new Element();
  const documentEvents = {};
  globalThis.document = {
    body,
    querySelector: selector => selector === '.menu-toggle' ? menu : ids[selector.slice(1)],
    querySelectorAll: selector => ({'.project-card':cards,'.filter':filters,'.project-open':triggers}[selector] ?? []),
    getElementById: id => ids[id],
    createElement: () => new Element(),
    addEventListener: (event, handler) => { documentEvents[event] = handler; },
  };
  globalThis.window = {matchMedia: () => ({addEventListener: () => {}})};
  let copied;
  Object.defineProperty(globalThis, 'navigator', { configurable:true, value: {clipboard:{writeText: async text => {copied=text;}}} });
  await import('../dist/app.mjs');
  await menu.fire('click');
  assert.equal(menu.getAttribute('aria-expanded'), 'true');
  assert.ok(ids['main-nav'].classes.has('is-open'));
  documentEvents.keydown({key:'Escape'});
  assert.equal(menu.getAttribute('aria-expanded'), 'false');
  assert.ok(menu.focused);
  await menu.fire('click');
  await navigationLinks[1].fire('click');
  assert.equal(menu.getAttribute('aria-expanded'), 'false');
  await filters[1].fire('click');
  assert.deepEqual(cards.map(card => card.hidden), [false,true,true]);
  assert.equal(ids['filter-result'].textContent, '1 projeto');
  assert.equal(filters[1].getAttribute('aria-pressed'), 'true');
  await filters[2].fire('click');
  assert.deepEqual(cards.map(card => card.hidden), [true,false,true]);
  await filters[3].fire('click');
  assert.deepEqual(cards.map(card => card.hidden), [false,true,false]);
  assert.equal(ids['filter-result'].textContent, '2 projetos');
  await filters[0].fire('click');
  assert.ok(cards.every(card => !card.hidden));
  await triggers[0].fire('click');
  assert.equal(ids['project-dialog'].open, true);
  assert.equal(ids['dialog-title'].textContent, 'Fluxo Inteligente');
  assert.equal(ids['dialog-repo'].href, projects.fluxo.repo);
  assert.equal(ids['dialog-repo'].hidden, false);
  assert.equal(ids['dialog-learning'].children.length, 3);
  await ids['dialog-close'].fire('click');
  assert.equal(ids['project-dialog'].open, false);
  assert.ok(triggers[0].focused);
  await triggers[1].fire('click');
  assert.equal(ids['dialog-repo'].hidden, false);
  assert.equal(ids['dialog-pending'].hidden, true);
  assert.equal(ids['dialog-repo'].href, projects.lacrei.repo);
  assert.equal(ids['dialog-image-wrap'].hidden, false);
  assert.equal(ids['dialog-image'].src, projects.lacrei.image.src);
  await triggers[0].fire('click');
  assert.equal(ids['dialog-image-wrap'].hidden, false);
  assert.equal(ids['dialog-image'].src, projects.fluxo.image.src);
  const externalTrigger = new Element();
  documentEvents['portfolio:open-project']({detail:{id:'mentalist', returnFocus:externalTrigger}});
  assert.equal(ids['dialog-title'].textContent, 'The Mentalist — CBI Selection');
  await ids['dialog-close'].fire('click');
  assert.equal(externalTrigger.focused, true);
  await triggers[3].fire('click');
  assert.equal(ids['dialog-title'].textContent,'Medica Doctor X');
  assert.equal(ids['dialog-repo'].hidden,true);
  assert.equal(ids['dialog-repo'].getAttribute('href'),null);
  assert.equal(ids['dialog-pending'].hidden,false);
  assert.match(ids['dialog-pending'].textContent,/Power BI/);
  assert.equal(ids['dialog-learning-title'].textContent,'Próximos passos');
  await ids['dialog-close'].fire('click');
  await triggers[4].fire('click');
  assert.equal(ids['dialog-title'].textContent,'Atlas Skills');
  assert.equal(ids['dialog-repo'].hidden,false);
  assert.equal(ids['dialog-repo'].href,'https://github.com/EduardaAndrade16/Atlas-Skills');
  assert.equal(ids['dialog-learning-title'].textContent,'Frentes do projeto em equipe');
  await ids['dialog-close'].fire('click');
  await ids['copy-email'].fire('click');
  assert.equal(copied, 'elzamendes1212@gmail.com');
  assert.match(ids['copy-feedback'].textContent, /copiado/);
  navigator.clipboard.writeText = async () => {throw new Error('clipboard unavailable');};
  await ids['copy-email'].fire('click');
  assert.match(ids['copy-feedback'].textContent, /Não foi possível/);
  await ids['light-toggle'].fire('click');
  assert.ok(body.classes.has('evening'));
  assert.equal(ids['light-toggle'].getAttribute('aria-pressed'), 'true');
  await ids['light-toggle'].fire('click');
  assert.equal(body.classes.has('evening'), false);
});
