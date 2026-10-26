import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { mountLabGame, mountTrails, mountPetals, missions } from '../dist/playful.mjs';
import { priorityMatrix } from '../dist/journey.mjs';

class Node {
  constructor() { this.dataset = {}; this.attrs = {}; this.handlers = new Map(); this.children = []; this.values = {}; this.style = {setProperty:(k,v) => {this.values[k]=v;}}; this.classList = {contains:key => this.classes?.has(key) ?? false}; this.box = {top:0,bottom:600,height:600}; }
  addEventListener(type,fn) { this.handlers.set(type,[...(this.handlers.get(type)??[]),fn]); }
  removeEventListener(type,fn) { this.handlers.set(type,(this.handlers.get(type)??[]).filter(v=>v!==fn)); }
  emit(type,event={}) { (this.handlers.get(type)??[]).forEach(fn=>fn({target:this,...event})); }
  setAttribute(k,v) { this.attrs[k]=String(v); } removeAttribute(k) { delete this.attrs[k]; } getAttribute(k) {return this.attrs[k];}
  replaceChildren(...items) {this.children=items;} focus() {this.focused=true;} getBoundingClientRect() {return this.box;}
  querySelector(selector) {return this.queries?.[selector];} closest() {return this.trigger ? this : null;}
}

test('the lab validates actual inputs, explains wrong attempts, tracks three discoveries and restarts', () => {
  const ids = Object.fromEntries(['mission-check','mission-next','mission-reset','impact-select','urgency-select','mission-title','mission-text','mission-progress','mission-fill','mission-feedback','lab-preset','lab-reset'].map(id=>[id,new Node()]));
  const stamps = missions.map(()=>new Node()); const cells=[];
  for (const [impact,values] of Object.entries(priorityMatrix)) for (const urgency of Object.keys(values)) {const cell=new Node();cell.dataset={impact,urgency};cells.push(cell);}
  const document = {getElementById:id=>ids[id],querySelectorAll:s=>s==='[data-mission-stamp]'?stamps:cells};
  ids['impact-select'].value='medio';ids['urgency-select'].value='media';
  const app=mountLabGame({document});
  assert.equal(cells.filter(c=>c.getAttribute('aria-current')==='true').length,1);
  ids['mission-check'].emit('click');assert.match(ids['mission-feedback'].textContent,/prioridade C/);assert.equal(ids['mission-next'].hidden,true);
  for(let i=0;i<missions.length;i++) {
    ids['impact-select'].value=missions[i].impact; ids['urgency-select'].value=missions[i].urgency;
    ids['urgency-select'].emit('change');
    const current=cells.filter(c=>c.getAttribute('aria-current')==='true');assert.equal(current.length,1);assert.equal(current[0].dataset.impact,missions[i].impact);assert.equal(current[0].dataset.urgency,missions[i].urgency);
    ids['mission-check'].emit('click');assert.equal(ids['mission-check'].disabled,true);assert.equal(ids['mission-next'].focused,true);assert.match(ids['mission-feedback'].textContent,/Descoberta registrada/);
    ids['mission-check'].emit('click');assert.equal(ids['mission-progress'].textContent,`${i+1} de 3 descobertas`);
    ids['mission-next'].emit('click');
  }
  assert.equal(ids['mission-check'].hidden,true);assert.equal(ids['mission-reset'].hidden,false);assert.equal(ids['mission-reset'].focused,true);assert.equal(ids['mission-fill'].style.width,'100%');
  assert.ok(stamps.every(s=>s.dataset.complete==='true'));
  ids['mission-reset'].emit('click');assert.equal(ids['mission-progress'].textContent,'0 de 3 descobertas');assert.equal(ids['mission-check'].hidden,false);assert.equal(ids['mission-check'].disabled,false);assert.ok(stamps.every(s=>s.dataset.complete==='false'));
  app.dispose();assert.ok(Object.values(ids).every(n=>[...n.handlers.values()].every(list=>list.length===0)));
});

test('the visible matrix matches all sixteen source-backed rules and trail filtering preserves native details', () => {
  const html=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
  const cells=[...html.matchAll(/<td data-matrix-cell data-impact="([^"]+)" data-urgency="([^"]+)">([A-D])<\/td>/g)];
  assert.equal(cells.length,16);for(const [,impact,urgency,code] of cells)assert.equal(code,priorityMatrix[impact][urgency]);
  const cards=['formacao','curso','certificacao','curso'].map(kind=>{const n=new Node();n.dataset.trailKind=kind;return n;});
  const buttons=['todas','formacao','curso','certificacao'].map(kind=>{const n=new Node();n.dataset.trailFilter=kind;return n;}); const status=new Node();
  const app=mountTrails({document:{querySelectorAll:s=>s==='[data-trail-kind]'?cards:buttons,getElementById:()=>status}});
  buttons[2].emit('click');assert.equal(status.textContent,'2 de 4 trilhas');assert.equal(cards[0].hidden,true);assert.equal(cards[1].hidden,false);assert.equal(buttons[2].getAttribute('aria-pressed'),'true');
  assert.equal(app.filter('invalid'),false);buttons[0].emit('click');assert.ok(cards.every(c=>!c.hidden));app.dispose();
});

test('petals are finite and bounded, never block input, stop offscreen and obey both motion controls', () => {
  const zone=new Node(),layer=new Node(),toggle=new Node(),document=new Node(),media=new Node();
  zone.queries={'.petal-layer':layer}; document.body=new Node();document.body.classes=new Set();document.hidden=false;document.createElement=()=>new Node();document.querySelectorAll=s=>s==='[data-petal-zone]'?[zone]:[toggle];
  const timers=new Map(),observers={};let seq=0;
  const window={innerHeight:800,matchMedia:()=>media,setTimeout(fn){timers.set(++seq,fn);return seq;},clearTimeout(id){timers.delete(id);}};
  for(const name of ['MutationObserver','IntersectionObserver'])window[name]=class {constructor(fn){this.fn=fn;observers[name]=this;}observe(){}disconnect(){this.disconnected=true;}};
  const app=mountPetals({document,window});assert.equal(layer.children.length,0);
  zone.emit('change');assert.equal(layer.children.length,10);assert.equal(timers.size,1);zone.emit('change');assert.equal(layer.children.length,10);assert.equal(timers.size,1);
  [...timers.values()][0]();assert.equal(layer.children.length,0);assert.equal(timers.size,0);
  zone.emit('change');observers.IntersectionObserver.fn([{target:zone,isIntersecting:false}]);assert.equal(layer.children.length,0);
  zone.box={top:-700,bottom:-100,height:600};assert.equal(app.burst(zone),false);
  zone.box={top:-900,bottom:1100,height:2000};assert.equal(app.burst(zone),true);assert.equal(layer.values['--petal-top'],'870px');assert.equal(layer.values['--petal-fall'],'850px');observers.IntersectionObserver.fn([{target:zone,isIntersecting:false}]);zone.box={top:0,bottom:600,height:600};
  toggle.emit('click');assert.equal(toggle.getAttribute('aria-pressed'),'false');assert.equal(app.burst(zone),false);toggle.emit('click');
  media.matches=true;media.emit('change');assert.equal(toggle.disabled,true);assert.equal(app.burst(zone),false);media.matches=false;media.emit('change');
  document.body.classes.add('motion-paused');observers.MutationObserver.fn();assert.equal(toggle.disabled,true);assert.equal(app.burst(zone),false);
  document.body.classes.clear();observers.MutationObserver.fn();zone.emit('change');assert.equal(layer.children.length,10);
  document.hidden=true;document.emit('visibilitychange');assert.equal(layer.children.length,0);assert.equal(app.burst(zone),false);
  app.dispose();assert.equal(timers.size,0);assert.ok(Object.values(observers).every(o=>o.disconnected));assert.ok([...zone.handlers.values()].every(list=>list.length===0));
});
