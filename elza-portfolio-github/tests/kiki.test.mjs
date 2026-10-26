import test from 'node:test';
import assert from 'node:assert/strict';
import { mountKiki } from '../dist/kiki.mjs';

class Surface {
  constructor() {
    this.dataset = {}; this.attrs = {}; this.handlers = {}; this.hidden = false; this.disabled = false; this.textContent = ''; this.properties = {};
    const classes = new Set(); this.classList = { contains: v => classes.has(v), add: v => classes.add(v), remove: v => classes.delete(v) };
    this.style = { setProperty: (k,v) => this.properties[k] = v };
  }
  setAttribute(k,v) { this.attrs[k] = String(v); }
  getAttribute(k) { return this.attrs[k]; }
  addEventListener(k,fn) { (this.handlers[k] ??= []).push(fn); }
  removeEventListener(k,fn) { this.handlers[k] = (this.handlers[k] ?? []).filter(v => v !== fn); }
  emit(k,event = {}) { for (const fn of this.handlers[k] ?? []) fn(event); }
  getBoundingClientRect() { return { width: 400, height: 380 }; }
}

test('Kiki views, optional flight, project deliveries and motion policy work together', () => {
  const document = new Surface(); document.body = new Surface(); document.hidden = false;
  const ids = Object.fromEntries(['kiki-card','atelier-stage','scene-status','scene-hint','kiki-fly','kiki-rider','world-source','sprite-source','bakery-art','city-art','shop-message'].map(id => [id,new Surface()]));
  document.getElementById = id => ids[id]; const events = []; document.dispatchEvent = event => events.push(event);
  const modes = ['bakery','sky','garden'].map(id => { const element = new Surface(); element.dataset.kikiView = id; return element; });
  const project = new Surface(); project.dataset.deliveryProject = 'fluxo';
  document.querySelectorAll = selector => selector === '[data-kiki-view]' ? modes : selector === '[data-delivery-project]' ? [project] : [];
  const reduced = new Surface(); reduced.matches = false; const timers = new Map(); let timerId = 0; const observers = {};
  const window = { matchMedia: () => reduced, setTimeout(fn) { timers.set(++timerId,fn); return timerId; }, clearTimeout(id) { timers.delete(id); }, CustomEvent: class { constructor(type,init = {}) { this.type = type; this.detail = init.detail; } } };
  for (const name of ['MutationObserver','IntersectionObserver']) window[name] = class { constructor(fn) { observers[name] = this; this.fn = fn; } observe() {} disconnect() { this.disconnected = true; } };
  const app = mountKiki({document,window});
  assert.equal(ids['atelier-stage'].dataset.world,'bakery'); assert.equal(modes[0].getAttribute('aria-pressed'),'true'); assert.equal(ids['city-art'].getAttribute('aria-hidden'),'true'); assert.equal(ids['kiki-fly'].hidden,true);
  modes[1].emit('click'); assert.equal(ids['atelier-stage'].dataset.world,'sky'); assert.equal(ids['kiki-fly'].hidden,false); assert.equal(ids['sprite-source'].hidden,false); assert.match(ids['world-source'].getAttribute('href'),/594404850796479753/);
  ids['kiki-fly'].emit('click'); assert.equal(ids['kiki-rider'].classList.contains('is-flying'),true); assert.equal(ids['kiki-fly'].disabled,true); assert.equal(timers.size,1);
  modes[0].emit('click'); assert.equal(ids['kiki-rider'].classList.contains('is-flying'),false); assert.equal(timers.size,0); assert.equal(ids['kiki-rider'].hidden,true);
  modes[2].emit('click'); assert.equal(events.at(-1).type,'portfolio:scene-3d'); assert.equal(ids['world-source'].hidden,true);
  modes[1].emit('click'); reduced.matches = true; reduced.emit('change'); ids['kiki-fly'].emit('click'); assert.equal(timers.size,0); assert.match(ids['shop-message'].textContent,/vento está em pausa/);
  reduced.matches = false; ids['kiki-fly'].emit('click'); assert.equal(timers.size,1); document.hidden = true; document.emit('visibilitychange'); assert.equal(timers.size,0);
  document.hidden = false; ids['kiki-fly'].emit('click'); observers.IntersectionObserver.fn([{isIntersecting:false}]); assert.equal(timers.size,0);
  ids['kiki-fly'].emit('click'); document.body.classList.add('motion-paused'); observers.MutationObserver.fn(); assert.equal(timers.size,0);
  document.body.classList.remove('motion-paused'); ids['kiki-fly'].emit('click'); project.emit('click'); assert.equal(timers.size,0); assert.equal(events.at(-1).type,'portfolio:open-project'); assert.equal(events.at(-1).detail.id,'fluxo'); assert.equal(events.at(-1).detail.returnFocus,project);
  assert.equal(app.setView('unknown'),false); assert.equal(app.setView('toString'),false);
  app.dispose(); assert.ok(Object.values(observers).every(value => value.disconnected)); assert.ok(Object.values(ids).every(value => Object.values(value.handlers).every(list => list.length === 0)));
});
