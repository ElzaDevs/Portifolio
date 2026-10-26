import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from '../dist/vendor/three/three.module.js';
import { buildAtelier } from '../dist/atelier-model.mjs';
import { cardTilt, canAnimateScene, scenePixelRatio, mayDragScene, pinPosition } from '../dist/spatial-policy.mjs';
import { mountAtelier, loadAtelier } from '../dist/diorama.mjs';

test('spatial limits preserve touch scrolling, bounded tilt and low pixel density', () => {
  assert.deepEqual(cardTilt(-100, 900, { left: 0, top: 0, width: 300, height: 400 }, 2.5), { x: -2.5, y: -2.5, lightX: 0, lightY: 100 });
  assert.equal(cardTilt(1, 1, { left: 0, top: 0, width: 0, height: 20 }).x, 0);
  assert.equal(scenePixelRatio(3, true), 1); assert.equal(scenePixelRatio(3, false), 1.5); assert.equal(scenePixelRatio(NaN, false), 1);
  assert.equal(mayDragScene(9, 80, 'touch'), false); assert.equal(mayDragScene(40, 8, 'touch'), true); assert.equal(mayDragScene(7, 0, 'touch'), false);
  assert.deepEqual(pinPosition({ x: 20, y: -30 }, 400, 300), { x: 377, y: 275 });
  const state = { visible: true, pageVisible: true, motionPaused: false, contextLost: false };
  assert.equal(canAnimateScene(state), true);
  for (const [key, value] of [['visible', false], ['pageVisible', false], ['motionPaused', true], ['contextLost', true]]) assert.equal(canAnimateScene({ ...state, [key]: value }), false);
});

test('the original model has complete geometry, finite animation and deterministic disposal', () => {
  const model = buildAtelier(THREE); let meshes = 0, triangles = 0;
  const geometries = new Set(), materials = new Set();
  model.root.traverse(item => { if (item.isMesh) { meshes++; triangles += (item.geometry.index?.count ?? item.geometry.attributes.position.count) / 3; geometries.add(item.geometry); materials.add(item.material); } });
  assert.ok(meshes > 100 && meshes < 160); assert.ok(triangles < 16_000);
  for (const name of ['Cottage', 'MossRoof', 'Tree', 'OpenBook', 'AtelierCat']) assert.ok(model.root.getObjectByName(name));
  const bounds = new THREE.Box3().setFromObject(model.root); assert.ok(bounds.min.y > -0.6 && bounds.max.y < 3.3);
  assert.deepEqual(Object.keys(model.anchors), ['sobre', 'tecnologias', 'projetos']);
  model.animate(1234.5); model.setEvening(true);
  model.root.traverse(item => { assert.ok(item.position.toArray().every(Number.isFinite)); assert.ok(item.rotation.toArray().slice(0,3).every(Number.isFinite)); });
  let disposedGeometry = 0, disposedMaterial = 0;
  geometries.forEach(value => value.addEventListener('dispose', () => disposedGeometry++)); materials.forEach(value => value.addEventListener('dispose', () => disposedMaterial++));
  model.dispose(); assert.equal(disposedGeometry, geometries.size); assert.equal(disposedMaterial, materials.size);
});

class Surface {
  constructor() { this.listeners = new Map(); this.dataset = {}; this.hidden = false; this.textContent = ''; this.styles = new Map(); this.style = { setProperty: (k,v) => this.styles.set(k,v) }; const values = new Set(); this.classList = { contains: v => values.has(v), add: v => values.add(v), remove: v => values.delete(v) }; }
  addEventListener(name, fn) { const listeners = this.listeners.get(name) ?? []; listeners.push(fn); this.listeners.set(name, listeners); }
  removeEventListener(name, fn) { this.listeners.set(name, (this.listeners.get(name) ?? []).filter(value => value !== fn)); }
  emit(name, detail = {}) { for (const fn of this.listeners.get(name) ?? []) fn({ button: 0, pointerId: 1, pointerType: 'touch', preventDefault() {}, ...detail }); }
  getBoundingClientRect() { return { width: 400, height: 357 }; }
}
function harness() {
  const document = new Surface(), window = new Surface(); document.body = new Surface(); document.hidden = false;
  const stage = new Surface(), canvas = new Surface(), controls = new Surface(), status = new Surface(), hint = new Surface();
  const left = new Surface(), right = new Surface(), reset = new Surface(); left.dataset.sceneTurn = '-0.45'; right.dataset.sceneTurn = '0.45';
  controls.querySelectorAll = () => [left,right]; controls.querySelector = () => reset;
  const pins = ['sobre','tecnologias','projetos'].map(key => { const pin = new Surface(); pin.dataset.sceneAnchor = key; return pin; }); stage.querySelectorAll = () => pins;
  const ids = { 'atelier-stage': stage, 'atelier-canvas': canvas, 'scene-controls': controls, 'scene-status': status, 'scene-hint': hint }; document.getElementById = id => ids[id];
  const reduced = new Surface(); reduced.matches = false; window.matchMedia = q => q.includes('reduce') ? reduced : { matches: true }; window.devicePixelRatio = 3;
  const frames = new Map(); let serial = 0; window.requestAnimationFrame = fn => { frames.set(++serial,fn); return serial; }; window.cancelAnimationFrame = id => frames.delete(id);
  const observers = {};
  for (const name of ['MutationObserver','IntersectionObserver','ResizeObserver']) window[name] = class { constructor(fn) { this.fn = fn; observers[name] = this; } observe() {} disconnect() { this.disconnected = true; } };
  const renderer = { shadowMap: {}, renders: 0, disposed: false, setPixelRatio(v) { this.ratio = v; }, setSize(w,h) { this.size = [w,h]; }, render(scene,camera) { this.renders++; this.scene = scene; this.camera = camera; }, dispose() { this.disposed = true; } };
  return { THREE, document, window, stage, canvas, controls, status, hint, left, right, reset, reduced, frames, observers, renderer, pins, createRenderer: () => renderer };
}

test('real scene controller rotates, respects pause and visibility, and recovers context', () => {
  const h = harness(); const controller = mountAtelier(h);
  assert.equal(h.stage.dataset.state, 'ready'); assert.equal(h.controls.hidden, false); assert.equal(h.renderer.ratio, 1); assert.equal(h.frames.size, 1);
  assert.ok(h.pins.every(pin => /px$/.test(pin.styles.get('--pin-x'))));
  h.stage.dataset.world = 'bakery'; h.document.emit('portfolio:scene-mode'); assert.equal(h.frames.size, 0);
  h.stage.dataset.world = 'garden'; h.document.emit('portfolio:scene-mode'); assert.equal(h.frames.size, 1);
  h.right.emit('click'); assert.equal(controller.angle, .45); h.left.emit('click'); assert.equal(controller.angle, 0);
  h.canvas.emit('pointerdown', { clientX: 100, clientY: 100 });
  h.canvas.emit('pointermove', { clientX: 105, clientY: 190 }); assert.equal(controller.angle, 0);
  h.canvas.emit('pointermove', { clientX: 180, clientY: 105 }); assert.ok(Math.abs(controller.angle - .6) < 1e-12);
  h.window.emit('pointerup'); assert.equal(h.stage.classList.contains('is-dragging'), false);
  h.reset.emit('click'); assert.equal(controller.angle, 0);
  h.reduced.matches = true; h.reduced.emit('change'); assert.equal(h.frames.size, 0);
  const before = h.renderer.renders; h.right.emit('click'); assert.equal(controller.angle, .45); assert.ok(h.renderer.renders > before);
  h.reduced.matches = false; h.reduced.emit('change'); assert.equal(h.frames.size, 1);
  h.document.hidden = true; h.document.emit('visibilitychange'); assert.equal(h.frames.size, 0);
  h.document.hidden = false; h.document.emit('visibilitychange'); assert.equal(h.frames.size, 1);
  h.observers.IntersectionObserver.fn([{ isIntersecting: false }]); assert.equal(h.frames.size, 0);
  h.observers.IntersectionObserver.fn([{ isIntersecting: true }]); assert.equal(h.frames.size, 1);
  h.document.body.classList.add('motion-paused'); h.observers.MutationObserver.fn(); assert.equal(h.frames.size, 0);
  h.document.body.classList.remove('motion-paused'); h.document.body.classList.add('evening'); h.observers.MutationObserver.fn(); assert.equal(h.frames.size, 1);
  const windowMesh = h.renderer.scene.children.find(item => item.name === 'ElzaAtelier').getObjectByName('Cottage').children.find(item => item.material?.emissiveIntensity === .7); assert.ok(windowMesh);
  h.canvas.emit('webglcontextlost'); assert.equal(h.stage.dataset.state, 'poster'); assert.equal(h.controls.hidden, true); assert.equal(h.frames.size, 0);
  h.canvas.emit('webglcontextrestored'); assert.equal(h.stage.dataset.state, 'ready'); assert.equal(h.controls.hidden, false); assert.equal(h.frames.size, 1);
  controller.dispose(); assert.equal(h.frames.size, 0); assert.equal(h.renderer.disposed, true); assert.ok(Object.values(h.observers).every(observer => observer.disconnected));
});

test('failed Three import or unavailable WebGL leaves the illustrated links available', async () => {
  for (const importThree of [async () => { throw Error('offline'); }, async () => ({ ...THREE, WebGLRenderer: class { constructor() { throw Error('WebGL unavailable'); } } })]) {
    const h = harness(); const result = await loadAtelier({ document: h.document, window: h.window, importThree });
    assert.equal(result, null); assert.equal(h.stage.dataset.state, 'poster'); assert.equal(h.controls.hidden, true); assert.equal(h.stage.querySelectorAll().length, 3);
    assert.equal(h.hint.textContent, 'Explore os atalhos do cenário.'); assert.equal(h.frames.size, 0);
  }
});
