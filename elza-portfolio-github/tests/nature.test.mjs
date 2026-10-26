import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mountNature } from '../dist/nature.mjs';

class Surface {
  constructor() {
    this.listeners = new Map(); this.properties = new Map(); const classes = new Set();
    this.classList = { contains: v => classes.has(v), add: v => classes.add(v), remove: v => classes.delete(v), toggle(v, enabled) { if (enabled) classes.add(v); else classes.delete(v); } };
    this.style = { setProperty: (k,v) => this.properties.set(k,v), removeProperty: k => this.properties.delete(k) };
  }
  addEventListener(n, fn) { this.listeners.set(n, [...this.listeners.get(n) ?? [], fn]); }
  setAttribute(n,v) { (this.attrs ??= {})[n] = String(v); }
  getAttribute(n) { return this.attrs?.[n]; }
  removeEventListener(n, fn) { this.listeners.set(n, (this.listeners.get(n) ?? []).filter(v => v !== fn)); }
  emit(n, event = {}) { for (const fn of this.listeners.get(n) ?? []) fn({ preventDefault() { throw Error('Native scroll must not be cancelled'); }, ...event }); }
  getBoundingClientRect() { return { left: 0, top: 0, width: 400, height: 400 }; }
}

test('scenery depth is bounded, never captures touch, and pauses with visibility or motion policy', () => {
  const surface = new Surface(), document = new Surface(), reduced = new Surface(), fine = new Surface();
  const rainToggle = new Surface(), rain = new Surface(); rain.hidden = true; rainToggle.setAttribute('aria-pressed','false');
  const tree = new Surface(), treeFigure = new Surface(); tree.complete = true; tree.naturalWidth = 420;
  document.body = new Surface(); document.hidden = false; document.querySelectorAll = () => [surface]; document.getElementById = id => ({'rain-toggle':rainToggle,'tree-rain':rain,'tree-art':tree,'tree-figure':treeFigure}[id]); reduced.matches = false; fine.matches = true;
  const frames = new Map(); let id = 0; const observers = {};
  const window = { matchMedia: query => query.includes('reduce') ? reduced : fine, requestAnimationFrame(fn) { frames.set(++id,fn); return id; }, cancelAnimationFrame(id) { frames.delete(id); } };
  for (const name of ['MutationObserver','IntersectionObserver']) window[name] = class { constructor(fn) { observers[name] = this; this.fn = fn; } observe() {} disconnect() { this.disconnected = true; } };
  const app = mountNature({ document, window });
  assert.equal(rainToggle.hidden,false); rainToggle.emit('click'); assert.equal(rain.hidden,false); assert.equal(rainToggle.getAttribute('aria-pressed'),'true'); rainToggle.emit('click'); assert.equal(rain.hidden,true);
  surface.emit('pointermove', { pointerType: 'touch', clientX: 350, clientY: 60 }); assert.equal(frames.size, 0);
  surface.emit('pointermove', { pointerType: 'mouse', clientX: 900, clientY: -500 }); assert.equal(frames.size, 1);
  const entry = [...frames.entries()][0]; frames.delete(entry[0]); entry[1](); assert.equal(surface.properties.get('--canopy-x'), '6px'); assert.equal(surface.properties.get('--canopy-y'), '-4px');
  surface.emit('pointerleave'); assert.equal(surface.properties.size, 0);
  surface.emit('pointermove', { pointerType: 'mouse', clientX: 100, clientY: 200 }); assert.equal(frames.size, 1);
  reduced.matches = true; reduced.emit('change'); assert.equal(frames.size, 0); assert.equal(surface.classList.contains('nature-still'), true);
  surface.emit('pointermove', { pointerType: 'mouse', clientX: 100, clientY: 200 }); assert.equal(frames.size, 0);
  reduced.matches = false; reduced.emit('change'); assert.equal(surface.classList.contains('nature-still'), false);
  document.hidden = true; document.emit('visibilitychange'); assert.equal(surface.classList.contains('nature-still'), true);
  document.hidden = false; document.emit('visibilitychange'); document.body.classList.add('motion-paused'); observers.MutationObserver.fn(); assert.equal(surface.classList.contains('nature-still'), true);
  document.body.classList.remove('motion-paused'); observers.MutationObserver.fn(); assert.equal(surface.classList.contains('nature-still'), false);
  fine.matches = false; fine.emit('change'); assert.equal(surface.classList.contains('nature-still'), true);
  observers.IntersectionObserver.fn([{ target: surface, isIntersecting: true }]); assert.equal(surface.classList.contains('nature-visible'), true);
  observers.IntersectionObserver.fn([{ target: surface, isIntersecting: false }]); assert.equal(surface.classList.contains('nature-visible'), false);
  app.dispose(); assert.equal(frames.size, 0); assert.ok(Object.values(observers).every(o => o.disconnected)); assert.ok([...surface.listeners.values()].every(list => list.length === 0));
});

test('tree failure retries the original once, then removes the broken space and rain controls', () => {
  const document = new Surface(), tree = new Surface(), figure = new Surface(), rain = new Surface(), button = new Surface(), media = new Surface();
  tree.complete = false; tree.naturalWidth = 0; tree.dataset = {fallback:'assets/arvore-chuva.png'};
  button.hidden = rain.hidden = true; figure.hidden = false;
  document.body = new Surface(); document.querySelectorAll = () => []; document.getElementById = id => ({'tree-art':tree,'tree-figure':figure,'tree-rain':rain,'rain-toggle':button}[id]);
  const window = {matchMedia:() => media, MutationObserver:class {observe(){} disconnect(){}}};
  const app = mountNature({document,window});
  button.emit('click'); assert.equal(rain.hidden,true); assert.equal(button.hidden,true);
  tree.emit('error'); assert.equal(tree.src,'assets/arvore-chuva.png'); assert.equal(figure.hidden,false); assert.equal(button.hidden,true);
  tree.naturalWidth = 420; tree.emit('load'); assert.equal(button.hidden,false);
  button.emit('click'); assert.equal(rain.hidden,false);
  tree.naturalWidth = 0; tree.emit('error'); assert.equal(figure.hidden,true); assert.equal(rain.hidden,true); assert.equal(button.hidden,true); assert.equal(button.getAttribute('aria-pressed'),'false');
  app.dispose(); assert.ok([...tree.listeners.values()].every(list => list.length === 0));
});

function luminance(hex) {
  const channels = hex.match(/[a-f\d]{2}/gi).map(value => parseInt(value,16)/255).map(value => value <= .04045 ? value/12.92 : ((value+.055)/1.055)**2.4);
  return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;
}
test('the actual matcha palette provides readable key text, buttons and cozy social icons', () => {
  const css = fs.readFileSync(new URL('../dist/matcha.css', import.meta.url),'utf8');
  const palette = Object.fromEntries([...css.matchAll(/--(matcha-[\w-]+):(#[a-f\d]{6})/gi)].map(match => [match[1],match[2]]));
  for (const [foreground,background] of [['matcha-ink','matcha-milk'],['matcha-ink','matcha-light'],['matcha-milk','matcha-dark'],['matcha-ink','matcha-mist'],['matcha-moss','matcha-milk']]) {
    const a = luminance(palette[foreground]), b = luminance(palette[background]); const ratio = (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    assert.ok(ratio >= 4.5, `${foreground} / ${background}: ${ratio.toFixed(2)}`);
  }
  assert.match(css, /\.contact-section a:focus-visible[^}]+outline-color:var\(--matcha-milk\)/);
});
