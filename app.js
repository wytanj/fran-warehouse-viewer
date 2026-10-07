import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/* ===== Unit geometry (metres) — from BASE ARCHITECTURAL PLAN ===== */
const W = 7.1;
const D = 13.1;
const H_CEIL = 3.0;
const H_RACK = 1.9;
const WALL_T = 0.12;
const WC_W = 1.8;
const WC_D = 1.8;
const DOOR_X0 = 0.7;      // ~600 mm offset + start
const DOOR_W = 1.595;
const STAGING_D = 2.5;
const LEVELS = 4;
const PITCH = 0.45;
const BAY_W = 1.5;        // longspan bay width
const SHELF_D = 0.55;     // single-deep depth
const COL_W = 0.4;
const COL_D = 0.2;

const CAP = {
  A: {
    title: 'Capacity — Option A (Long-aisle)',
    html:
      '<strong>~22 bays</strong> × <strong>4 levels</strong> ≈ <strong>~88 shelf positions</strong><br/>' +
      'Left + right double-deep longspan along 13.1 m walls.<br/>' +
      'Main aisle ≈ <strong>2.4 m</strong> (≥ 1.2 m). Staging <strong>2.5 m</strong> at entrance.<br/>' +
      'Rack height 1.9 m · pitch ~0.45 m · light-duty / longspan.',
  },
  B: {
    title: 'Capacity — Option B (Cross-bay)',
    html:
      '<strong>~28 bays</strong> × <strong>4 levels</strong> ≈ <strong>~112 shelf positions</strong><br/>' +
      'Shorter runs ⊥ to long walls · denser bay count.<br/>' +
      'Pick aisles <strong>1.1 m</strong>. Staging <strong>2.5 m</strong> · WC + doors clear.<br/>' +
      'Rack height 1.9 m · pitch ~0.45 m · light-duty / longspan.',
  },
};

let option = 'A';
let rackGroup = null;

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a222d);
scene.fog = new THREE.Fog(0x1a222d, 28, 55);

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.05, 200);
camera.position.set(11, 9, 8);

const controls = new OrbitControls(camera, canvas);
controls.target.set(W / 2, 0.6, D / 2);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI * 0.49;
controls.minDistance = 2;
controls.maxDistance = 40;
controls.update();

/* Lights */
scene.add(new THREE.AmbientLight(0xb8c4d4, 0.55));
const sun = new THREE.DirectionalLight(0xfff2e0, 1.05);
sun.position.set(6, 14, 4);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 40;
sun.shadow.camera.left = -12;
sun.shadow.camera.right = 12;
sun.shadow.camera.top = 16;
sun.shadow.camera.bottom = -8;
scene.add(sun);
const fill = new THREE.DirectionalLight(0x88aacc, 0.35);
fill.position.set(-8, 6, 10);
scene.add(fill);
/* Soft window wash from glazed façade (top = +Z) */
const windowLight = new THREE.DirectionalLight(0xa8d4ff, 0.45);
windowLight.position.set(W / 2, 2.2, D + 4);
scene.add(windowLight);

const unit = new THREE.Group();
scene.add(unit);

function mat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: opts.roughness ?? 0.75,
    metalness: opts.metalness ?? 0.05,
    transparent: opts.opacity != null,
    opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.FrontSide,
  });
}

function box(w, h, d, material, x, y, z, parent = unit) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function labelSprite(text, color = '#e8eef5', scale = 1) {
  const cv = document.createElement('canvas');
  cv.width = 512;
  cv.height = 128;
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, 512, 128);
  ctx.fillStyle = 'rgba(15,20,28,0.75)';
  roundRect(ctx, 8, 24, 496, 80, 12);
  ctx.fill();
  ctx.font = 'bold 42px Segoe UI, system-ui, sans-serif';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 64);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const spr = new THREE.Sprite(
    new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })
  );
  spr.scale.set(2.2 * scale, 0.55 * scale, 1);
  spr.renderOrder = 10;
  return spr;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/* Floor */
const floorMat = mat(0x3a4554, { roughness: 0.9 });
box(W, 0.05, D, floorMat, W / 2, -0.025, D / 2).receiveShadow = true;

/* Floor grid (1 m) */
{
  const grid = new THREE.GridHelper(Math.max(W, D) + 2, Math.max(W, D) + 2, 0x4a5868, 0x2e3846);
  grid.position.set(W / 2, 0.001, D / 2);
  grid.material.transparent = true;
  grid.material.opacity = 0.35;
  unit.add(grid);
}

/* Perimeter walls (open top for viewing) */
const wallMat = mat(0x6b7686, { roughness: 0.85 });
const glassMat = mat(0x8ec8e8, { roughness: 0.15, metalness: 0.2, opacity: 0.35, side: THREE.DoubleSide });

/* Bottom wall (entrance) — split around doors */
const hWall = 2.4;
box(DOOR_X0, hWall, WALL_T, wallMat, DOOR_X0 / 2, hWall / 2, 0);
const rightOfDoor = W - WC_W - (DOOR_X0 + DOOR_W);
box(rightOfDoor, hWall, WALL_T, wallMat, DOOR_X0 + DOOR_W + rightOfDoor / 2, hWall / 2, 0);
/* WC front wall segment already covered by WC box */

/* Left wall */
box(WALL_T, hWall, D, wallMat, 0, hWall / 2, D / 2);
/* Right wall — above WC */
box(WALL_T, hWall, D - WC_D, wallMat, W, hWall / 2, WC_D + (D - WC_D) / 2);
box(WALL_T, hWall, WC_D, wallMat, W, hWall / 2, WC_D / 2);

/* Top glazed façade */
box(W, hWall * 0.92, 0.06, glassMat, W / 2, (hWall * 0.92) / 2, D);
/* Top-left recess indication (~1.0–1.2 m deep × ~1.0 m wide) */
const recessMat = mat(0x5a6575, { roughness: 0.8 });
box(1.0, hWall, 1.1, recessMat, 0.5 + WALL_T, hWall / 2, D - 0.55);

/* Ceiling ghost */
box(W, 0.04, D, mat(0x2a3340, { opacity: 0.25, side: THREE.DoubleSide }), W / 2, H_CEIL, D / 2);

/* Columns (approx along long walls) */
const colMat = mat(0x8a93a0, { roughness: 0.7, metalness: 0.15 });
const colZs = [3.2, 7.0, 10.8];
for (const z of colZs) {
  box(COL_W, H_CEIL, COL_D, colMat, COL_W / 2 + 0.02, H_CEIL / 2, z);
  box(COL_W, H_CEIL, COL_D, colMat, W - COL_W / 2 - 0.02, H_CEIL / 2, z);
}

/* WC / MV enclosure */
const wcMat = mat(0xc97b63, { roughness: 0.7 });
box(WC_W, 2.2, WC_D, wcMat, W - WC_W / 2, 1.1, WC_D / 2);
const wcLabel = labelSprite('WC / MV', '#ffc4b0', 0.85);
wcLabel.position.set(W - WC_W / 2, 2.5, WC_D / 2);
unit.add(wcLabel);

/* Entrance doors (open swing indication) */
const doorMat = mat(0x5b8def, { roughness: 0.45, metalness: 0.1 });
box(DOOR_W, 2.1, 0.08, doorMat, DOOR_X0 + DOOR_W / 2, 1.05, 0.04);
const doorLabel = labelSprite('ENTRANCE', '#9ec0ff', 0.9);
doorLabel.position.set(DOOR_X0 + DOOR_W / 2, 2.45, 0.4);
unit.add(doorLabel);

/* Staging zone marker (floor tint) */
{
  const stageGeo = new THREE.PlaneGeometry(W - WC_W - 0.2, STAGING_D - 0.15);
  const stageMat = new THREE.MeshStandardMaterial({
    color: 0x4a7c59,
    transparent: true,
    opacity: 0.28,
    roughness: 1,
  });
  const stage = new THREE.Mesh(stageGeo, stageMat);
  stage.rotation.x = -Math.PI / 2;
  stage.position.set((W - WC_W) / 2, 0.03, STAGING_D / 2);
  stage.receiveShadow = true;
  unit.add(stage);
  const stLab = labelSprite('STAGING', '#9ddeb0', 0.8);
  stLab.position.set((W - WC_W) / 2, 0.35, STAGING_D / 2);
  unit.add(stLab);
}

/* Window façade label */
{
  const lab = labelSprite('GLAZED FAÇADE', '#b8e0ff', 0.95);
  lab.position.set(W / 2, 2.7, D + 0.3);
  unit.add(lab);
}

/* Axis helpers + dimension labels */
{
  const axes = new THREE.AxesHelper(2.5);
  axes.position.set(-0.3, 0.05, -0.3);
  unit.add(axes);
  const lx = labelSprite('X width 7.1 m', '#ff8888', 0.75);
  lx.position.set(W / 2, 0.25, -0.7);
  unit.add(lx);
  const lz = labelSprite('Z depth 13.1 m', '#88ff88', 0.75);
  lz.position.set(-0.9, 0.25, D / 2);
  unit.add(lz);
  const ly = labelSprite('Y up · ceil 3.0 m', '#8888ff', 0.7);
  ly.position.set(-0.5, H_CEIL + 0.25, -0.5);
  unit.add(ly);
}

/* Footprint outline */
{
  const pts = [
    new THREE.Vector3(0, 0.02, 0),
    new THREE.Vector3(W, 0.02, 0),
    new THREE.Vector3(W, 0.02, D),
    new THREE.Vector3(0, 0.02, D),
    new THREE.Vector3(0, 0.02, 0),
  ];
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: 0x7ec8ff })
  );
  unit.add(line);
}

/* ===== Racking builders ===== */
const frameMat = mat(0xb8954a, { roughness: 0.55, metalness: 0.25 });
const shelfMat = mat(0xd4c09a, { roughness: 0.65, metalness: 0.08 });
const aisleMat = new THREE.MeshStandardMaterial({
  color: 0x3d9cf0,
  transparent: true,
  opacity: 0.18,
  roughness: 1,
});

function makeBay(parent, x, z, bayW, depth, rotY = 0) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  /* uprights */
  const post = 0.05;
  const hw = bayW / 2;
  const hd = depth / 2;
  for (const px of [-hw + post, hw - post]) {
    for (const pz of [-hd + post, hd - post]) {
      box(post, H_RACK, post, frameMat, px, H_RACK / 2, pz, g);
    }
  }
  /* shelves */
  for (let i = 0; i < LEVELS; i++) {
    const y = 0.08 + i * PITCH;
    if (y > H_RACK - 0.05) break;
    box(bayW - 0.04, 0.03, depth - 0.04, shelfMat, 0, y, 0, g);
  }
  /* top beam */
  box(bayW, 0.04, 0.04, frameMat, 0, H_RACK - 0.02, -hd + 0.02, g);
  box(bayW, 0.04, 0.04, frameMat, 0, H_RACK - 0.02, hd - 0.02, g);
  parent.add(g);
  return g;
}

function aisleStrip(parent, x, z, w, d) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), aisleMat);
  m.rotation.x = -Math.PI / 2;
  m.position.set(x, 0.04, z);
  parent.add(m);
}

function buildOptionA(parent) {
  /*
   * Long-aisle: double-deep along left & right long walls.
   * Clear staging 0..STAGING_D, clear WC, columns by inset.
   * Left double-deep: two rows of SHELF_D at x inset from wall.
   * Right same. Main aisle down centre ≥ 1.2 m.
   */
  const inset = 0.35; // clear of columns (~0.4)
  const rowD = SHELF_D;
  const z0 = STAGING_D + 0.15;
  const z1 = D - 0.35;
  const span = z1 - z0;
  const nBays = Math.floor(span / BAY_W);
  const used = nBays * BAY_W;
  const zStart = z0 + (span - used) / 2 + BAY_W / 2;

  let bayCount = 0;

  // Left wall: double-deep (two rows)
  for (let row = 0; row < 2; row++) {
    const x = inset + rowD / 2 + row * (rowD + 0.05);
    for (let i = 0; i < nBays; i++) {
      const z = zStart + i * BAY_W;
      makeBay(parent, x, z, BAY_W - 0.05, rowD, 0);
      bayCount++;
    }
  }

  // Right wall: double-deep — start after WC
  const rightZ0 = Math.max(z0, WC_D + 0.25);
  const rightSpan = z1 - rightZ0;
  const nRight = Math.floor(rightSpan / BAY_W);
  const rightUsed = nRight * BAY_W;
  const rightZStart = rightZ0 + (rightSpan - rightUsed) / 2 + BAY_W / 2;
  for (let row = 0; row < 2; row++) {
    const x = W - inset - rowD / 2 - row * (rowD + 0.05);
    for (let i = 0; i < nRight; i++) {
      const z = rightZStart + i * BAY_W;
      makeBay(parent, x, z, BAY_W - 0.05, rowD, 0);
      bayCount++;
    }
  }

  // Main aisle strip
  const leftEdge = inset + 2 * rowD + 0.05;
  const rightEdge = W - inset - 2 * rowD - 0.05;
  const aisleW = rightEdge - leftEdge;
  aisleStrip(parent, leftEdge + aisleW / 2, (z0 + z1) / 2, aisleW * 0.92, span);

  const aisleLab = labelSprite(`MAIN AISLE ~${aisleW.toFixed(1)} m`, '#9ecfff', 0.85);
  aisleLab.position.set(W / 2, 0.3, (z0 + z1) / 2);
  parent.add(aisleLab);

  CAP.A.html =
    `<strong>~${bayCount} bays</strong> × <strong>${LEVELS} levels</strong> ≈ <strong>~${bayCount * LEVELS} shelf positions</strong><br/>` +
    `Left + right double-deep longspan along 13.1 m walls.<br/>` +
    `Main aisle ≈ <strong>${aisleW.toFixed(1)} m</strong> (≥ 1.2 m). Staging <strong>${STAGING_D} m</strong> at entrance.<br/>` +
    `Rack height ${H_RACK} m · pitch ~${PITCH} m · light-duty / longspan.`;
}

function buildOptionB(parent) {
  /*
   * Cross-bay: runs perpendicular to long walls (bay length along X).
   * Pick aisles 1.1 m between runs of depth SHELF_D.
   */
  const aisle = 1.1;
  const runD = SHELF_D;
  const pitch = runD + aisle;
  const z0 = STAGING_D + 0.2;
  const z1 = D - 0.4;
  const nRuns = Math.floor((z1 - z0 + aisle) / pitch);
  const inset = 0.35;
  const runLen = W - 2 * inset; // full width minus wall/column clearance
  const bayAlong = 1.55;
  const nBaysPerRun = Math.floor(runLen / bayAlong);

  let bayCount = 0;
  for (let r = 0; r < nRuns; r++) {
    const z = z0 + runD / 2 + r * pitch;
    // Skip / shorten if overlapping WC zone
    let x0 = inset;
    let usable = runLen;
    if (z - runD / 2 < WC_D + 0.15) {
      // keep clear of WC: only use left portion
      usable = W - WC_W - inset - 0.25 - inset;
      if (usable < bayAlong) continue;
    }
    const n = Math.floor(usable / bayAlong);
    const used = n * bayAlong;
    const startX = x0 + (usable - used) / 2 + bayAlong / 2;
    for (let i = 0; i < n; i++) {
      const x = startX + i * bayAlong;
      // bay oriented with depth along Z (default), width along X
      makeBay(parent, x, z, bayAlong - 0.06, runD, 0);
      bayCount++;
    }
    // aisle marker after each run (except last)
    if (r < nRuns - 1) {
      const az = z + runD / 2 + aisle / 2;
      aisleStrip(parent, inset + usable / 2, az, usable * 0.9, aisle * 0.85);
    }
  }

  const pickLab = labelSprite('PICK AISLES ~1.1 m', '#9ecfff', 0.85);
  pickLab.position.set(W / 2, 0.3, z0 + (nRuns * pitch) / 2);
  parent.add(pickLab);

  CAP.B.html =
    `<strong>~${bayCount} bays</strong> × <strong>${LEVELS} levels</strong> ≈ <strong>~${bayCount * LEVELS} shelf positions</strong><br/>` +
    `Shorter runs ⊥ to long walls · denser bay count.<br/>` +
    `Pick aisles <strong>${aisle} m</strong>. Staging <strong>${STAGING_D} m</strong> · WC + doors clear.<br/>` +
    `Rack height ${H_RACK} m · pitch ~${PITCH} m · light-duty / longspan.`;
}

function setOption(opt) {
  option = opt;
  if (rackGroup) {
    unit.remove(rackGroup);
    rackGroup.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
        else o.material.dispose();
      }
    });
  }
  rackGroup = new THREE.Group();
  rackGroup.name = 'racks';
  if (opt === 'A') buildOptionA(rackGroup);
  else buildOptionB(rackGroup);
  unit.add(rackGroup);

  document.getElementById('btnA').classList.toggle('active', opt === 'A');
  document.getElementById('btnB').classList.toggle('active', opt === 'B');
  const c = CAP[opt];
  document.getElementById('capacity').innerHTML = `<div class="title">${c.title}</div>${c.html}`;
  document.getElementById('hud').textContent = opt === 'A' ? 'Option A — Long-aisle' : 'Option B — Cross-bay';
}

document.getElementById('btnA').onclick = () => setOption('A');
document.getElementById('btnB').onclick = () => setOption('B');
document.getElementById('btnTop').onclick = () => {
  camera.position.set(W / 2, 18, D / 2 + 0.01);
  controls.target.set(W / 2, 0, D / 2);
  controls.update();
};
document.getElementById('btnIso').onclick = () => {
  camera.position.set(12, 9, 9);
  controls.target.set(W / 2, 0.6, D / 2);
  controls.update();
};
document.getElementById('btnReset').onclick = () => {
  camera.position.set(11, 9, 8);
  controls.target.set(W / 2, 0.6, D / 2);
  controls.update();
};

setOption('A');

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

function tick() {
  requestAnimationFrame(tick);
  controls.update();
  renderer.render(scene, camera);
}
tick();
