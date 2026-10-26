import test from 'node:test';
import assert from 'node:assert/strict';
import { mountWords } from '../dist/words.mjs';
import { mountGallery, projectMedia } from '../dist/gallery.mjs';

class Element {
  constructor(text = '') {
    this.textContent = text; this.hidden = false; this.attrs = {}; this.dataset = {}; this.children = []; this.handlers = {}; this.selectors = {}; this.focused = false; this.styles = {};
    this.style = { setProperty: (key, value) => this.styles[key] = value };
    const values = new Set(); this.classList = { add: (...args) => args.forEach(v => values.add(v)), remove: (...args) => args.forEach(v => values.delete(v)), contains: value => values.has(value), toggle(value) { if (values.has(value)) { values.delete(value); return false; } values.add(value); return true; } };
  }
  setAttribute(k,v) { this.attrs[k] = String(v); }
  getAttribute(k) { return this.attrs[k]; }
  removeAttribute(k) { delete this.attrs[k]; }
  addEventListener(type, fn) { (this.handlers[type] ??= []).push(fn); }
  removeEventListener(type, fn) { this.handlers[type] = (this.handlers[type] ?? []).filter(value => value !== fn); }
  emit(type, event = {}) { for (const fn of this.handlers[type] ?? []) fn({ preventDefault() {}, ...event }); }
  querySelectorAll(selector) { return this.selectors[selector] ?? []; }
  querySelector(selector) { return this.querySelectorAll(selector)[0] ?? null; }
  replaceChildren(...children) { this.children = children; }
  focus() { this.focused = true; }
  showModal() { this.open = true; }
  close() { this.open = false; this.emit('close'); }
  getBoundingClientRect() { return { left: 10, right: 400, top: 10, bottom: 400 }; }
}
function environment() {
  const document = new Element(); document.body = new Element(); const ids = {};
  document.getElementById = id => ids[id]; document.createElement = () => new Element(); document.dispatchEvent = event => { document.lastEvent = event; };
  const timers = new Map(); let timerId = 0;
  const reduced = new Element(); reduced.matches = false;
  const observers = {};
  const window = { setTimeout(fn) { timers.set(++timerId,fn); return timerId; }, clearTimeout(id) { timers.delete(id); }, matchMedia(q) { return q.includes('reduce') ? reduced : { matches: true }; }, CustomEvent: class { constructor(type,init) { this.type = type; this.detail = init.detail; } } };
  for (const name of ['MutationObserver','IntersectionObserver']) window[name] = class { constructor(fn) { this.fn = fn; observers[name] = this; } observe() {} unobserve(value) { this.unobserved = value; } disconnect() { this.disconnected = true; } };
  return { document, window, ids, timers, reduced, observers };
}

test('name, topic notes and clickable titles work with reduced motion and keyboard-friendly buttons', () => {
  const h = environment(); const name = new Element(), hint = new Element(); h.ids['name-bloom'] = name; h.ids['name-hint'] = hint;
  name.selectors['[data-letter-word]'] = [new Element('Elza'), new Element('Vitória')];
  for (const id of ['word-note','word-topic-label','word-topic-text','word-topic-link']) h.ids[id] = new Element();
  const buttons = ['backend','dados','ia'].map(id => { const button = new Element(); button.dataset.wordTopic = id; return button; }); h.document.selectors['[data-word-topic]'] = buttons;
  const title = new Element(); title.dataset.titleProject = 'mentalist'; h.document.selectors['[data-title-project]'] = [title];
  const heading = new Element(); h.document.selectors['main h2'] = [heading];
  const app = mountWords(h);
  assert.equal(name.disabled, false); assert.equal(hint.hidden, false); assert.equal(name.querySelectorAll('[data-letter-word]')[1].children.map(n => n.textContent).join(''), 'Vitória');
  name.emit('click'); assert.equal(name.classList.contains('is-blooming'), true); assert.equal(h.timers.size, 1);
  name.emit('click'); assert.equal(h.timers.size, 1);
  h.reduced.matches = true; h.reduced.emit('change'); assert.equal(name.classList.contains('is-blooming'), false);
  name.emit('click'); assert.equal(name.classList.contains('is-blooming'), false); assert.equal(name.classList.contains('is-bloomed'), true);
  buttons[1].emit('click'); assert.equal(buttons[1].getAttribute('aria-pressed'), 'true'); assert.equal(buttons[0].getAttribute('aria-pressed'), 'false'); assert.match(h.ids['word-topic-text'].textContent, /SQL e PostgreSQL/); assert.equal(h.ids['word-topic-link'].getAttribute('href'), '#tecnologias');
  buttons[2].emit('click'); assert.match(h.ids['word-topic-label'].textContent, /TRILHA DE ESTUDO/); assert.equal(h.ids['word-topic-link'].getAttribute('href'), '#sobre'); assert.equal(app.selectTopic('untrusted'), false);
  title.emit('click'); assert.equal(h.document.lastEvent.type, 'portfolio:open-project'); assert.equal(h.document.lastEvent.detail.id, 'mentalist'); assert.equal(h.document.lastEvent.detail.returnFocus, title);
  h.observers.IntersectionObserver.fn([{ target: heading, isIntersecting: true }]); assert.equal(heading.classList.contains('is-inked'), true); assert.equal(h.observers.IntersectionObserver.unobserved, heading);
  app.dispose(); assert.equal(h.timers.size, 0); assert.ok(Object.values(h.observers).every(observer => observer.disconnected));
});

test('3D cover controls expose one face; media viewer cycles real assets and restores focus', () => {
  const h = environment();
  for (const id of ['art-dialog','art-image','art-caption','art-counter','art-next','art-previous','art-close','art-source']) h.ids[id] = new Element();
  const controls = new Element(); h.document.selectors['[data-cover-controls]'] = [controls];
  const flip = new Element(); flip.dataset.coverFlip = 'mentalist'; flip.selectors.span = [new Element()]; h.document.selectors['[data-cover-flip]'] = [flip];
  for (const part of ['stage','front','back']) h.ids[`cover-${part}-mentalist`] = new Element();
  const open = new Element(); open.dataset.artOpen = 'mentalist'; h.document.selectors['[data-art-open]'] = [open];
  const app = mountGallery(h); assert.equal(controls.hidden, false);
  flip.emit('click'); assert.equal(h.ids['cover-stage-mentalist'].classList.contains('is-flipped'), true); assert.equal(h.ids['cover-front-mentalist'].hidden, true); assert.equal(h.ids['cover-back-mentalist'].hidden, false); assert.equal(h.ids['cover-front-mentalist'].getAttribute('aria-hidden'), 'true'); assert.equal(h.ids['cover-back-mentalist'].getAttribute('aria-hidden'), 'false'); assert.equal(flip.getAttribute('aria-pressed'), 'true');
  flip.emit('click'); assert.equal(h.ids['cover-front-mentalist'].getAttribute('aria-hidden'), 'false'); assert.equal(flip.querySelector('span').textContent, 'Por trás do projeto');
  open.emit('click'); assert.equal(h.ids['art-dialog'].open, true); assert.equal(h.ids['art-close'].focused, true); assert.equal(h.ids['art-image'].src, projectMedia.mentalist[0].src); assert.equal(h.ids['art-counter'].textContent, '1 de 2');
  h.ids['art-next'].emit('click'); assert.equal(h.ids['art-image'].src, projectMedia.mentalist[1].src); assert.equal(h.ids['art-counter'].textContent, '2 de 2');
  h.ids['art-dialog'].emit('keydown', { key: 'ArrowRight' }); assert.equal(h.ids['art-counter'].textContent, '1 de 2');
  h.ids['art-previous'].emit('click'); assert.equal(h.ids['art-counter'].textContent, '2 de 2');
  h.ids['art-close'].emit('click'); assert.equal(h.ids['art-dialog'].open, false); assert.equal(open.focused, true); assert.equal(h.document.body.classList.contains('dialog-open'), false);
  assert.equal(app.openMedia('unknown', open), false);
  assert.equal(app.openMedia('fluxo', open), true); assert.match(h.ids['art-caption'].textContent, /não é uma captura/); assert.equal(h.ids['art-source'].textContent, 'Conhecer o código no GitHub ↗'); h.ids['art-close'].emit('click');
  app.openMedia('lacrei', open); assert.equal(h.ids['art-next'].hidden, true); assert.equal(h.ids['art-previous'].hidden, true); assert.match(h.ids['art-source'].getAttribute('href'), /github.com\/ElzaDevs\/lacrei-saude-frontend/);
  app.openMedia('doctorx', open); assert.equal(h.ids['art-source'].hidden,true); assert.equal(h.ids['art-source'].getAttribute('href'),undefined); assert.match(h.ids['art-caption'].textContent,/enviada pela autora/);
  app.openMedia('atlas', open); assert.equal(h.ids['art-source'].hidden,false); assert.equal(h.ids['art-source'].getAttribute('href'),'https://github.com/EduardaAndrade16/Atlas-Skills'); assert.equal(h.ids['art-source'].textContent,'Ver repositório da equipe ↗');
  h.ids['art-dialog'].emit('click', { target: h.ids['art-dialog'], clientX: 0, clientY: 0 }); assert.equal(h.ids['art-dialog'].open, false);
  app.dispose(); assert.ok(Object.values(h.ids).every(element => Object.values(element.handlers).every(handlers => handlers.length === 0)));
});
