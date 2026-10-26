/** Original low-poly clay diorama. Geometry only; no DOM, network or textures. */
export function buildAtelier(THREE) {
  const root = new THREE.Group();
  root.name = 'ElzaAtelier';
  const palette = {
    grass: '#92aa58', soil: '#c5a47e', rim: '#ae8b65', cream: '#f3f5e3',
    roof: '#6b7f3a', roofEdge: '#455826', wood: '#ab8059', darkWood: '#846349',
    door: '#6f906b', water: '#8bc9c0', paleWater: '#d7ebe0', rock: '#d6cfaf',
    leaf: '#799851', leafLight: '#b6c77b', leafDark: '#47622a', flower: '#fff1c5',
    gold: '#e9b864', cat: '#344a3e', book: '#b56b52', bookPaper: '#f5e8c8',
  };
  const materialCache = new Map();
  function material(name, extra = {}) {
    const key = `${name}:${JSON.stringify(extra)}`;
    if (!materialCache.has(key)) materialCache.set(key, new THREE.MeshLambertMaterial({ color: palette[name] ?? name, ...extra }));
    return materialCache.get(key);
  }
  const geometry = {
    box: new THREE.BoxGeometry(1, 1, 1),
    ball: new THREE.IcosahedronGeometry(1, 2),
    smallBall: new THREE.IcosahedronGeometry(1, 1),
    cylinder: new THREE.CylinderGeometry(1, 1, 1, 12),
    cone: new THREE.ConeGeometry(1, 1, 12),
  };
  function mesh(shape, color, position, scale = [1, 1, 1], parent = root) {
    const item = new THREE.Mesh(typeof shape === 'string' ? geometry[shape] : shape, typeof color === 'string' ? material(color) : color);
    item.position.set(...position); item.scale.set(...scale);
    item.castShadow = true; item.receiveShadow = true;
    parent.add(item); return item;
  }
  function box(color, position, scale, parent = root) { return mesh('box', color, position, scale, parent); }
  function ball(color, position, scale, parent = root) { return mesh('ball', color, position, scale, parent); }

  // A rounded island, a wooden base and a soft moss edge.
  const base = mesh(new THREE.CylinderGeometry(2.73, 2.5, 0.43, 48), 'soil', [0, -0.29, 0]);
  base.name = 'IslandBase';
  mesh(new THREE.CylinderGeometry(2.81, 2.74, 0.15, 48), 'grass', [0, -0.02, 0]);
  const rim = mesh(new THREE.TorusGeometry(2.52, 0.075, 6, 48), 'rim', [0, -0.49, 0]);
  rim.rotation.x = Math.PI / 2;

  // Cottage with a full roof prism, timber frame and an arched entrance.
  const cottage = new THREE.Group(); cottage.name = 'Cottage'; root.add(cottage);
  box('cream', [0.68, 0.88, -0.65], [1.65, 1.54, 1.42], cottage);
  const roofShape = new THREE.Shape();
  roofShape.moveTo(-1.02, 0); roofShape.lineTo(1.02, 0); roofShape.lineTo(0, 0.85); roofShape.closePath();
  const roof = mesh(new THREE.ExtrudeGeometry(roofShape, { depth: 1.83, bevelEnabled: false }), 'roof', [0.68, 1.66, -1.57], [1, 1, 1], cottage);
  roof.name = 'MossRoof';
  // Roof-edge beams follow the sloping sides.
  for (const side of [-1, 1]) {
    const beam = box('roofEdge', [0.68 + side * 0.5, 2.08, 0.29], [1.34, 0.075, 0.09], cottage);
    beam.rotation.z = -side * Math.atan2(0.85, 1.02);
  }
  box('darkWood', [0.68, 1.64, 0.1], [1.75, 0.09, 0.09], cottage);
  for (const x of [-0.11, 1.47]) box('wood', [x, 0.87, 0.12], [0.075, 1.55, 0.08], cottage);
  box('wood', [0.68, 0.16, 0.12], [1.7, 0.1, 0.09], cottage);
  const doorShape = new THREE.Shape();
  doorShape.moveTo(-0.29, 0); doorShape.lineTo(0.29, 0); doorShape.lineTo(0.29, 0.66);
  doorShape.quadraticCurveTo(0.29, 0.99, 0, 1.03); doorShape.quadraticCurveTo(-0.29, 0.99, -0.29, 0.66); doorShape.closePath();
  const doorGeo = new THREE.ExtrudeGeometry(doorShape, { depth: 0.04, bevelEnabled: false });
  mesh(doorGeo, 'darkWood', [0.48, 0.17, 0.13], [1.13, 1.08, 1], cottage);
  mesh(doorGeo, 'door', [0.48, 0.18, 0.18], [1, 1, 1], cottage);
  ball('gold', [0.66, 0.67, 0.24], [0.032, 0.032, 0.032], cottage);
  const windowMaterial = material('gold', { emissive: '#e9ad5b', emissiveIntensity: 0.24 });
  const window = mesh(new THREE.CircleGeometry(0.235, 24), windowMaterial, [1.08, 1.22, 0.145], [1, 1, 1], cottage);
  window.castShadow = false;
  const frame = mesh(new THREE.TorusGeometry(0.243, 0.035, 6, 24), 'wood', [1.08, 1.22, 0.17], [1, 1, 1], cottage);
  frame.castShadow = false;
  box('wood', [1.08, 1.22, 0.185], [0.035, 0.44, 0.03], cottage);
  box('wood', [1.08, 1.22, 0.185], [0.44, 0.035, 0.03], cottage);
  box(windowMaterial, [1.515, 1.0, -0.72], [0.03, 0.49, 0.49], cottage);
  for (const z of [-0.995, -0.445]) box('wood', [1.54, 1, z], [0.07, 0.59, 0.06], cottage);
  for (const y of [0.73, 1.27]) box('wood', [1.54, y, -0.72], [0.07, 0.06, 0.59], cottage);
  box('wood', [1.55, 1, -0.72], [0.07, 0.49, 0.035], cottage);
  box('cream', [1.15, 2.17, -1.06], [0.27, 0.7, 0.27], cottage);
  box('wood', [1.15, 2.55, -1.06], [0.36, 0.09, 0.36], cottage);
  for (let i = 0; i < 3; i++) box('rock', [0.5, 0.12 - i * 0.02, 0.42 + i * 0.25], [0.97 + i * 0.07, 0.12, 0.31], cottage);

  // A tree with rounded, gently animated canopy clusters.
  const tree = new THREE.Group(); tree.name = 'Tree'; root.add(tree);
  const trunk = mesh(new THREE.CylinderGeometry(0.105, 0.19, 1.88, 9), 'wood', [-1.35, 0.97, -0.79], [1, 1, 1], tree);
  trunk.rotation.z = -0.09;
  for (const [x, y, z, rotation] of [[-1.57, 1.52, -0.78, 0.65], [-1.11, 1.69, -0.78, -0.62]]) {
    const branch = mesh(new THREE.CylinderGeometry(0.055, 0.09, 0.7, 8), 'wood', [x, y, z], [1, 1, 1], tree); branch.rotation.z = rotation;
  }
  const leafData = [[-1.36, 2.43, -0.84, 0.78], [-1.97, 2.14, -0.8, 0.65], [-0.77, 2.25, -0.87, 0.64], [-1.52, 2.13, -0.21, 0.67], [-1.27, 2.67, -1.1, 0.57], [-1.72, 2.55, -1.25, 0.55]];
  const leaves = leafData.map(([x, y, z, size], index) => {
    const item = ball(['leaf', 'leafLight', 'leafDark'][index % 3], [x, y, z], [size, size * 0.83, size * 0.82], tree);
    item.rotation.y = index * 0.7; return item;
  });

  // Pond, pale water rings, stones and an arched wooden footbridge.
  const pond = mesh(new THREE.CircleGeometry(1, 40), 'water', [-1.12, 0.068, 1.03], [1.13, 0.72, 1]);
  pond.rotation.x = -Math.PI / 2; pond.castShadow = false;
  const ripples = [0.26, 0.47].map((radius, index) => {
    const item = mesh(new THREE.TorusGeometry(radius, 0.012, 4, 40), material('paleWater', { transparent: true, opacity: 0.55 }), [-1.37, 0.077 + index * 0.002, 1.17]);
    item.rotation.x = -Math.PI / 2; item.scale.y = 0.74; item.castShadow = false; return item;
  });
  for (let i = 0; i < 13; i++) {
    const angle = i / 13 * Math.PI * 2;
    const stone = ball('rock', [-1.12 + Math.cos(angle) * 1.12, 0.11, 1.03 + Math.sin(angle) * 0.7], [0.14 + (i % 3) * 0.025, 0.09, 0.12]);
    stone.rotation.y = angle;
  }
  for (let i = 0; i < 9; i++) {
    const x = -1.2 + i * 0.16;
    box('wood', [x, 0.19 + Math.sin(i / 8 * Math.PI) * 0.12, 0.8], [0.15, 0.055, 0.59]);
  }
  for (const z of [0.46, 1.14]) {
    for (const x of [-1.23, 0.1]) mesh('cylinder', 'darkWood', [x, 0.42, z], [0.035, 0.54, 0.035]);
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-1.23, 0.63, z), new THREE.Vector3(-0.56, 0.78, z), new THREE.Vector3(0.1, 0.63, z)]);
    mesh(new THREE.TubeGeometry(curve, 12, 0.024, 5, false), 'wood', [0, 0, 0]);
  }
  // Garden plants and a small open book on a bench.
  for (const [x, z, size] of [[1.87, 0.77, 0.34], [2.15, -0.28, 0.25], [-2.1, -1.33, 0.27], [0.7, -1.97, 0.28], [1.9, -1.4, 0.23]]) {
    ball('leafDark', [x, 0.19, z], [size, size * 0.7, size]);
    ball('leafLight', [x - 0.12, 0.25, z + 0.07], [size * 0.67, size * 0.7, size * 0.65]);
  }
  const flowerCenters = [[1.65, 1.35], [1.96, 1.1], [1.83, 1.6], [-0.31, 1.83]];
  flowerCenters.forEach(([x, z], index) => {
    const y = 0.39 + index % 2 * 0.1;
    mesh('cylinder', 'leafDark', [x, y / 2, z], [0.017, y, 0.017]);
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2;
      ball('flower', [x + Math.cos(a) * 0.063, y, z + Math.sin(a) * 0.063], [0.06, 0.023, 0.045]);
    }
    ball('gold', [x, y + 0.013, z], [0.038, 0.03, 0.038]);
  });
  box('darkWood', [1.35, 0.32, 1.61], [0.85, 0.07, 0.38]);
  for (const x of [1.05, 1.65]) box('wood', [x, 0.18, 1.61], [0.07, 0.3, 0.31]);
  const book = new THREE.Group(); book.name = 'OpenBook'; book.position.set(1.35, 0.39, 1.61); root.add(book);
  for (const side of [-1, 1]) {
    const cover = box('book', [side * 0.14, 0, 0], [0.28, 0.035, 0.28], book); cover.rotation.z = side * -0.13;
    const page = box('bookPaper', [side * 0.14, 0.025, 0], [0.25, 0.025, 0.25], book); page.rotation.z = side * -0.13;
  }
  // A cat keeps watch by the porch.
  const cat = new THREE.Group(); cat.name = 'AtelierCat'; cat.position.set(1.39, 0.08, 0.54); root.add(cat);
  ball('cat', [0, 0.18, 0], [0.14, 0.2, 0.12], cat);
  ball('cat', [0, 0.38, 0.025], [0.13, 0.12, 0.12], cat);
  for (const side of [-1, 1]) {
    const ear = mesh('cone', 'cat', [side * 0.085, 0.5, 0.02], [0.055, 0.13, 0.048], cat); ear.rotation.z = side * -0.17;
    ball('gold', [side * 0.047, 0.39, 0.13], [0.014, 0.024, 0.01], cat);
  }
  const tailCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.15, -0.06), new THREE.Vector3(0.22, 0.1, -0.11), new THREE.Vector3(0.28, 0.33, -0.11)]);
  const tail = mesh(new THREE.TubeGeometry(tailCurve, 10, 0.035, 5, false), 'cat', [0, 0, 0], [1, 1, 1], cat);

  const fireflies = Array.from({ length: 5 }, (_, i) => {
    const item = mesh('smallBall', new THREE.MeshBasicMaterial({ color: '#f6dfa2', transparent: true, opacity: 0.65 }), [-2 + i * 0.85, 1.0 + i % 3 * 0.38, 0.6 + i % 2 * 0.6], [0.025, 0.025, 0.025]);
    item.castShadow = false; return item;
  });
  const anchors = {};
  for (const [key, position] of Object.entries({ sobre: [-1.82, 2.9, -0.4], tecnologias: [1.18, 2.45, -0.4], projetos: [-0.54, 0.64, 1.27] })) {
    const anchor = new THREE.Object3D(); anchor.position.set(...position); root.add(anchor); anchors[key] = anchor;
  }

  function animate(time) {
    leaves.forEach((leaf, i) => { leaf.rotation.z = Math.sin(time * 0.7 + i) * 0.035; });
    ripples.forEach((ring, i) => { const size = 1 + Math.sin(time * 0.9 + i) * 0.11; ring.scale.set(size, size * 0.74, 1); });
    fireflies.forEach((item, i) => { item.position.y = 1 + i % 3 * 0.38 + Math.sin(time * 0.8 + i * 2) * 0.12; item.scale.setScalar(0.022 + (Math.sin(time + i) + 1) * 0.006); });
    tail.rotation.y = Math.sin(time * 0.7) * 0.12;
  }
  function setEvening(value) { windowMaterial.emissiveIntensity = value ? 0.7 : 0.24; fireflies.forEach(item => { item.material.opacity = value ? 0.95 : 0.4; }); }
  function dispose() {
    const geometries = new Set(); const materials = new Set();
    root.traverse(item => { if (item.geometry) geometries.add(item.geometry); if (item.material) (Array.isArray(item.material) ? item.material : [item.material]).forEach(value => materials.add(value)); });
    geometries.forEach(value => value.dispose()); materials.forEach(value => value.dispose());
  }
  root.updateMatrixWorld(true);
  return { root, anchors, animate, setEvening, dispose };
}
