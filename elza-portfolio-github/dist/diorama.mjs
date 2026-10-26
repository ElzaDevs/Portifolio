import { buildAtelier } from './atelier-model.mjs';
import { canAnimateScene, clamp, mayDragScene, pinPosition, scenePixelRatio } from './spatial-policy.mjs';

/** The DOM controller is injectable for state tests; the production renderer is WebGL. */
export function mountAtelier({ THREE, stage, canvas, controls, status, hint, document, window, createRenderer }) {
  const renderer = createRenderer ? createRenderer(canvas) : new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  renderer.setPixelRatio(scenePixelRatio(window.devicePixelRatio, coarse));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-3.7, 3.7, 3.2, -3.2, 0.1, 100);
  camera.position.set(6.5, 5.7, 8.2);
  camera.lookAt(0, 1.05, 0);
  const ambient = new THREE.HemisphereLight('#fff4d9', '#6b805c', 2.1);
  const sun = new THREE.DirectionalLight('#fff0cd', 2.3);
  sun.position.set(-3, 7, 5); sun.castShadow = true;
  sun.shadow.mapSize.set(coarse ? 256 : 512, coarse ? 256 : 512);
  Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 5, bottom: -4, near: 0.1, far: 20 });
  sun.shadow.normalBias = 0.04;
  scene.add(ambient, sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.13 }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.57; ground.receiveShadow = true; scene.add(ground);
  const model = buildAtelier(THREE); scene.add(model.root);
  const pins = [...stage.querySelectorAll('[data-scene-anchor]')];
  const position = new THREE.Vector3();
  let width = 1, height = 1, visible = true, contextLost = false, disposed = false;
  let frame = 0, lastTime = 0, clock = 0, targetAngle = 0, pointer = null;
  const unbind = [];
  const on = (target, name, fn, options) => { target.addEventListener(name, fn, options); unbind.push(() => target.removeEventListener(name, fn, options)); };
  const motionPaused = () => reduced.matches || document.body.classList.contains('motion-paused');
  const active = () => !disposed && (stage.dataset.world ?? 'garden') === 'garden' && canAnimateScene({ visible, pageVisible: !document.hidden, motionPaused: motionPaused(), contextLost });
  function projectPins() {
    model.root.updateMatrixWorld(true); camera.updateMatrixWorld();
    for (const pin of pins) {
      const anchor = model.anchors[pin.dataset.sceneAnchor];
      if (!anchor) continue;
      anchor.getWorldPosition(position); position.project(camera);
      const projected = pinPosition(position, width, height, Math.max(23,(pin.offsetWidth || 32)/2+8), Math.max(25,(pin.offsetHeight || 32)/2+4));
      pin.style.setProperty('--pin-x', `${projected.x}px`);
      pin.style.setProperty('--pin-y', `${projected.y}px`);
    }
  }
  function render() {
    if (disposed || contextLost) return;
    model.root.rotation.y = targetAngle; projectPins(); renderer.render(scene, camera);
  }
  function stop() { if (frame) window.cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
  function tick(time) {
    frame = 0;
    if (!active()) return;
    const elapsed = lastTime ? Math.min((time - lastTime) / 1000, 0.1) : 0;
    // Coarse pointers use 30 fps; the decorative animation does not run offscreen.
    if (!coarse || !lastTime || elapsed >= 1 / 32) {
      clock += elapsed; lastTime = time; model.animate(clock); render();
    }
    frame = window.requestAnimationFrame(tick);
  }
  function syncAnimation() { stop(); render(); if (active()) frame = window.requestAnimationFrame(tick); }
  function resize() {
    const box = stage.getBoundingClientRect(); width = Math.max(1, stage.clientWidth || box.width); height = Math.max(1, stage.clientHeight || box.height);
    const halfHeight = 3.2; const halfWidth = halfHeight * width / height;
    camera.left = -halfWidth; camera.right = halfWidth; camera.top = halfHeight; camera.bottom = -halfHeight;
    camera.updateProjectionMatrix(); renderer.setSize(width, height, false); render();
  }
  function syncLight() {
    const evening = document.body.classList.contains('evening');
    const night = document.body.classList.contains('night');
    ambient.color.set(night ? '#c9d9ec' : evening ? '#ffe0af' : '#fff4d9'); ambient.intensity = night ? 1.1 : evening ? 1.4 : 2.1;
    sun.color.set(night ? '#b8d3e6' : evening ? '#ffba7d' : '#fff0cd'); sun.intensity = night ? 1.25 : evening ? 1.7 : 2.3;
    model.setEvening(evening); syncAnimation();
  }
  function turn(delta) { targetAngle += delta; render(); }
  for (const button of controls.querySelectorAll('[data-scene-turn]')) on(button, 'click', () => turn(Number(button.dataset.sceneTurn)));
  on(controls.querySelector('[data-scene-reset]'), 'click', () => { targetAngle = 0; render(); });
  on(canvas, 'pointerdown', event => {
    if (event.button !== 0 || pointer) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, angle: targetAngle, dragging: false };
  });
  on(canvas, 'pointermove', event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
    if (!pointer.dragging && !mayDragScene(dx, dy, event.pointerType)) return;
    if (!pointer.dragging) { pointer.dragging = true; canvas.setPointerCapture?.(event.pointerId); stage.classList.add('is-dragging'); }
    targetAngle = pointer.angle + clamp(dx / width * 3, -Math.PI, Math.PI); render();
  });
  const release = event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    pointer = null; stage.classList.remove('is-dragging');
  };
  on(window, 'pointerup', release); on(canvas, 'pointercancel', release); on(canvas, 'lostpointercapture', release);
  on(document, 'visibilitychange', syncAnimation); on(reduced, 'change', syncAnimation);
  on(document, 'portfolio:scene-mode', syncAnimation);
  const bodyObserver = new window.MutationObserver(syncLight);
  bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  let visibilityObserver;
  if (window.IntersectionObserver) {
    visibilityObserver = new window.IntersectionObserver(entries => { visible = entries[0].isIntersecting; syncAnimation(); }, { threshold: 0.01 });
    visibilityObserver.observe(stage);
  }
  let resizeObserver;
  if (window.ResizeObserver) { resizeObserver = new window.ResizeObserver(resize); resizeObserver.observe(stage); }
  else on(window, 'resize', resize);
  on(canvas, 'webglcontextlost', event => {
    event.preventDefault(); contextLost = true; stop(); stage.dataset.state = 'poster'; controls.hidden = true;
    if ((stage.dataset.world ?? 'garden') === 'garden') { status.textContent = 'Ateliê ilustrado'; hint.textContent = 'Explore os atalhos do cenário.'; }
  });
  on(canvas, 'webglcontextrestored', () => {
    contextLost = false; stage.dataset.state = 'ready'; controls.hidden = false;
    if ((stage.dataset.world ?? 'garden') === 'garden') { status.textContent = 'UM PEQUENO MUNDO EM 3D'; hint.textContent = 'Arraste para girar · 01, 02 e 03 levam às seções'; } resize(); syncLight();
  });
  resize(); syncLight(); stage.dataset.state = 'ready'; controls.hidden = false;
  if ((stage.dataset.world ?? 'garden') === 'garden') { status.textContent = 'UM PEQUENO MUNDO EM 3D'; hint.textContent = 'Arraste para girar · 01, 02 e 03 levam às seções'; }
  function dispose() {
    if (disposed) return;
    disposed = true; stop(); unbind.forEach(remove => remove()); bodyObserver.disconnect(); visibilityObserver?.disconnect(); resizeObserver?.disconnect();
    model.dispose(); ground.geometry.dispose(); ground.material.dispose(); renderer.dispose();
  }
  return { dispose, render, get angle() { return targetAngle; } };
}

export async function loadAtelier({ document, window, importThree = () => import('./vendor/three/three.module.js') }) {
  const stage = document.getElementById('atelier-stage');
  if (!stage) return null;
  const controls = document.getElementById('scene-controls');
  const status = document.getElementById('scene-status');
  const hint = document.getElementById('scene-hint');
  try {
    const THREE = await importThree();
    return mountAtelier({ THREE, stage, canvas: document.getElementById('atelier-canvas'), controls, status, hint, document, window });
  } catch {
    // A failed import or unsupported WebGL retains the image and ordinary section links.
    stage.dataset.state = 'poster'; controls.hidden = true;
    if ((stage.dataset.world ?? 'garden') === 'garden') { status.textContent = 'Ateliê ilustrado'; hint.textContent = 'Explore os atalhos do cenário.'; }
    return null;
  }
}
