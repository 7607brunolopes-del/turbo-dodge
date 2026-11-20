'use strict';

// ---------------------------------------------------------------------
// GARAGEM (estúdio escuro, chão espelhado, plataforma giratória)
// ---------------------------------------------------------------------
let turntable, ttSeat;
const orbit = { theta: -2.35, phi: .2, radius: 7.4, tTheta: -2.35, tPhi: .2, tRadius: 7.4, ty: .62, minR: 3, maxR: 13 };
const tt = { yaw: 0, auto: true, hold: 0 };

function makeStudioEnv() {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.BoxGeometry(30, 14, 30), new THREE.MeshBasicMaterial({ color: 0x0d0f13, side: THREE.BackSide })));
  const panel = (w, h, x, y, z, rx, ry, k, col) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col || 0xffffff).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0); s.add(m);
  };
  panel(16, 2.4, 0, 6.8, 0, Math.PI / 2, 0, 3.6);
  panel(16, 1.4, 0, 6.8, -4.5, Math.PI / 2, 0, 2.2);
  panel(16, 1.4, 0, 6.8, 4.5, Math.PI / 2, 0, 2.2);
  panel(8, 5, -14.8, 3, 0, 0, Math.PI / 2, 1.4);
  panel(8, 5, 14.8, 3, 0, 0, -Math.PI / 2, 1.6);
  panel(12, 1, 0, .6, -14.8, 0, 0, .9, 0x9bb8ff);
  panel(12, 1, 0, .6, 14.8, 0, 0, .5, 0xffc9a8);
  const pm = new THREE.PMREMGenerator(renderer);
  const tex = pm.fromScene(s, 0.035).texture; pm.dispose();
  return tex;
}

function buildGarage() {
  gScene = new THREE.Scene();
  gScene.background = new THREE.Color(0x07090c);
  gScene.fog = new THREE.Fog(col(0x07090c), 14, 34);
  gScene.environment = makeStudioEnv();

  // Chão espelhado (reflexo real) + camada brilhante por cima
  if (THREE.Reflector) {
    const refl = new THREE.Reflector(new THREE.CircleGeometry(40, 64), {
      clipBias: 0.003, color: 0x8a8f96,
      textureWidth: Math.min(2048, window.innerWidth * renderer.getPixelRatio() * .6),
      textureHeight: Math.min(2048, window.innerHeight * renderer.getPixelRatio() * .6)
    });
    refl.rotation.x = -Math.PI / 2; refl.position.y = -0.002;
    gScene.add(refl);
  }
  const floorTex = canvasTex(makeCanvas(1024, 1024, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, 'rgba(26,30,36,0.72)'); gr.addColorStop(.35, 'rgba(14,17,21,0.82)'); gr.addColorStop(1, 'rgba(7,9,12,1)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(255,255,255,0.035)'; g.lineWidth = 1.5;
    for (let i = 0; i <= w; i += 64) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); }
  }));
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ map: floorTex, transparent: true, roughness: .35, metalness: .3 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  gScene.add(floor);

  // Plataforma giratória
  turntable = new THREE.Group(); gScene.add(turntable);
  const discTex = canvasTex(makeCanvas(512, 512, (g, w, h) => {
    g.fillStyle = '#121519'; g.fillRect(0, 0, w, h);
    for (let r = 20; r < 256; r += 7) { g.strokeStyle = `rgba(255,255,255,${0.015 + (r % 21 === 0 ? 0.02 : 0)})`; g.beginPath(); g.arc(256, 256, r, 0, Math.PI * 2); g.stroke(); }
  }));
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.36, .07, 96), [
    new THREE.MeshStandardMaterial({ color: 0x0e1014, metalness: .85, roughness: .35 }),
    new THREE.MeshStandardMaterial({ map: discTex, metalness: .6, roughness: .32 }),
    new THREE.MeshStandardMaterial({ color: 0x0e1014 })
  ]);
  disc.position.y = .035; disc.receiveShadow = true; turntable.add(disc);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.37, .012, 8, 160), glow(0xffffff));
  ring.rotation.x = Math.PI / 2; ring.position.y = .06; turntable.add(ring);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.6, .006, 6, 160), glow(0xff3b2f));
  ring2.rotation.x = Math.PI / 2; ring2.position.y = .004; gScene.add(ring2);
  ttSeat = new THREE.Group(); ttSeat.position.y = .07; turntable.add(ttSeat);

  // Parede de fundo e faixas de luz
  const wallTex = canvasTex(makeCanvas(32, 512, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, '#040507'); gr.addColorStop(.6, '#0b0e12'); gr.addColorStop(1, '#07090c');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }));
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(20, 20, 14, 64, 1, true), new THREE.MeshBasicMaterial({ map: wallTex, side: THREE.BackSide, fog: false }));
  wall.position.y = 7; gScene.add(wall);
  for (let i = 0; i < 16; i++) {
    const a = i / 16 * Math.PI * 2;
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(.08, 6), new THREE.MeshBasicMaterial({ color: 0x2a3340, fog: false, toneMapped: false }));
    strip.position.set(Math.sin(a) * 19.8, 4.2, Math.cos(a) * 19.8); strip.lookAt(0, 4.2, 0); gScene.add(strip);
  }
  const halo = new THREE.Mesh(new THREE.TorusGeometry(5.5, .05, 8, 120), glow(0xdfe8ff));
  halo.rotation.x = Math.PI / 2; halo.position.y = 7.5; gScene.add(halo);

  // Luzes
  gScene.add(new THREE.HemisphereLight(0xc4d4ff, 0x0b0d10, 0.45));
  const key = new THREE.SpotLight(0xffffff, 2.4, 0, 0.55, 0.75, 1);
  key.position.set(3.5, 9, 4.5); key.target.position.set(0, 0, 0);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
  key.shadow.camera.near = 4; key.shadow.camera.far = 20;
  gScene.add(key, key.target);
  const rim = new THREE.SpotLight(0x9fc2ff, 1.6, 0, 0.6, 0.8, 1);
  rim.position.set(-5, 6, -6); rim.target.position.set(0, .5, 0); gScene.add(rim, rim.target);
  const fill = new THREE.DirectionalLight(0xffe2cc, 0.45); fill.position.set(-6, 3, 6); gScene.add(fill);
}

function showOnTurntable(v) {
  while (ttSeat.children.length) ttSeat.remove(ttSeat.children[0]);
  v.root.position.set(0, 0, 0); v.root.rotation.set(0, 0, 0);
  v.chassis.rotation.set(0, 0, 0); v.chassis.position.set(0, 0, 0);
  v.flames.forEach(f => f.visible = false);
  if (v.rider) v.rider.visible = false;
  v.wheels.forEach(w => { w.spin.rotation.x = 0; w.steer.rotation.y = (v.type === 'car' && w.front) ? 0.26 : 0; });
  setCol(v.tailMat.color, 0xc80f1a);
  ttSeat.add(v.root);
}

const VIEWS = {
  front: { off: Math.PI, phi: .12 }, rear: { off: 0, phi: .12 }, left: { off: -Math.PI / 2, phi: .08 },
  right: { off: Math.PI / 2, phi: .08 }, three: { off: -Math.PI * .75, phi: .2 }, top: { off: -Math.PI * .75, phi: 1.32 }
};
function setView(name) {
  const vw = VIEWS[name]; if (!vw) return;
  orbit.tTheta = orbit.theta + wrapPi(tt.yaw + vw.off - orbit.theta);
  orbit.tPhi = vw.phi;
  orbit.tRadius = current.def.cam.radius * (name === 'top' ? 1.1 : 1);
  setAutoRotate(false);
  document.querySelectorAll('[data-view]').forEach(b => b.classList.toggle('active', b.dataset.view === name));
}
function setAutoRotate(on) { tt.auto = on; $('auto-rot').classList.toggle('active', on); }

function updateGarage(dt) {
  if (tt.auto) tt.yaw += dt * 0.32;
  if (tt.hold) tt.yaw += tt.hold * dt * 1.6;
  turntable.rotation.y = tt.yaw;
  orbit.theta = damp(orbit.theta, orbit.tTheta, 7, dt);
  orbit.phi = damp(orbit.phi, orbit.tPhi, 7, dt);
  orbit.radius = damp(orbit.radius, orbit.tRadius, 7, dt);
  orbit.ty = damp(orbit.ty, current.def.cam.ty, 6, dt);
  // Em ecrãs ao alto (telemóvel) afasta a câmara para o veículo caber na largura
  const fit = camera.aspect < 1.25 ? Math.min(2.3, Math.pow(1.25 / camera.aspect, 0.8)) : 1;
  const r = orbit.radius * fit, cp = Math.cos(orbit.phi);
  camera.position.set(Math.sin(orbit.theta) * cp * r, orbit.ty + Math.sin(orbit.phi) * r, Math.cos(orbit.theta) * cp * r);
  camera.position.y = Math.max(.25, camera.position.y);
  camera.lookAt(0, orbit.ty, 0);
  const W = window.innerWidth, H = window.innerHeight;
  if (W <= 860) camera.setViewOffset(W, H, 0, H * 0.1, W, H); else if (camera.view && camera.view.enabled) camera.clearViewOffset();
}

function setupGarageControls() {
  const stage = $('stage'), pts = new Map();
  let mode = 'camera', pinch = 0;
  stage.addEventListener('contextmenu', e => e.preventDefault());
  stage.addEventListener('pointerdown', e => {
    sounds.init();
    if (gameState !== 'MENU') return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { stage.setPointerCapture(e.pointerId); } catch (err) {}
    mode = (e.shiftKey || e.button === 2) ? 'vehicle' : 'camera';
    if (mode === 'vehicle') setAutoRotate(false);
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); }
    stage.classList.add('grabbing');
  });
  stage.addEventListener('pointermove', e => {
    if (gameState !== 'MENU' || !pts.has(e.pointerId)) return;
    const p = pts.get(e.pointerId), dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (pts.size >= 2) {
      const [a, b] = [...pts.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch > 0) orbit.tRadius = clamp(orbit.tRadius * pinch / d, orbit.minR, orbit.maxR);
      pinch = d; return;
    }
    if (mode === 'vehicle') tt.yaw += dx * 0.01;
    else { orbit.tTheta -= dx * 0.008; orbit.tPhi = clamp(orbit.tPhi + dy * 0.005, 0.02, 1.38); }
    if (Math.abs(dx) + Math.abs(dy) > 2) document.querySelectorAll('[data-view]').forEach(b => b.classList.remove('active'));
  });
  const up = e => { pts.delete(e.pointerId); if (pts.size < 2) pinch = 0; if (!pts.size) stage.classList.remove('grabbing'); };
  stage.addEventListener('pointerup', up); stage.addEventListener('pointercancel', up);
  stage.addEventListener('wheel', e => {
    if (gameState !== 'MENU') return;
    e.preventDefault();
    orbit.tRadius = clamp(orbit.tRadius * (1 + e.deltaY * 0.0012), orbit.minR, orbit.maxR);
  }, { passive: false });

  document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => { sounds.init(); setView(b.dataset.view); }));
  $('auto-rot').addEventListener('click', () => setAutoRotate(!tt.auto));
  const hold = (id, dir) => {
    const el = $(id);
    const on = e => { e.preventDefault(); setAutoRotate(false); tt.hold = dir; };
    const off = () => { if (tt.hold === dir) tt.hold = 0; };
    el.addEventListener('pointerdown', on); el.addEventListener('pointerup', off); el.addEventListener('pointerleave', off); el.addEventListener('pointercancel', off);
  };
  hold('rot-left', -1); hold('rot-right', 1);
}
