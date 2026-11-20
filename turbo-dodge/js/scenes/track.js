'use strict';

// ---------------------------------------------------------------------
// PISTA (pôr do sol, asfalto, zebras, rails, árvores)
// ---------------------------------------------------------------------
let roadTiles = [], playerRoot, sunLight, ambLight, skyMesh, groundMat, groundTex, raceEnv;

function roadTexture() {
  const W = 1024, H = 2048, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#1d1f23'; g.fillRect(0, 0, W, H);
  const img = g.getImageData(0, 0, W, H), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - .5) * 26, st = Math.random() < .035 ? Math.random() * 45 + 15 : 0;
    d[i] = clamp(d[i] + n + st, 0, 255); d[i + 1] = clamp(d[i + 1] + n + st, 0, 255); d[i + 2] = clamp(d[i + 2] + n + st * 1.08, 0, 255);
  }
  g.putImageData(img, 0, 0);
  const pxm = W / ROAD.width, pym = H / (ROAD.tileLen / 4); // px por metro
  // Marcas de pneus (mais escuras) em cada faixa
  const laneW = ROAD.width / 3;
  g.fillStyle = 'rgba(0,0,0,0.16)';
  for (let l = 0; l < 3; l++) { const cx = (l + .5) * laneW; [-.8, .8].forEach(o => g.fillRect((cx + o - .3) * pxm, 0, .6 * pxm, H)); }
  // Linhas laterais contínuas
  g.fillStyle = '#eef1f4';
  g.fillRect(.3 * pxm, 0, .2 * pxm, H);
  g.fillRect(W - .5 * pxm, 0, .2 * pxm, H);
  // Tracejado entre faixas (2 traços por repetição: sem costura)
  for (let l = 1; l < 3; l++) {
    const x = l * laneW * pxm - .075 * pxm;
    for (let y = 0; y < H; y += H / 2) g.fillRect(x, y, .15 * pxm, 3 * pym);
  }
  const t = canvasTex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 4); t.anisotropy = 16;
  return t;
}

function buildSky() {
  const W = 1024, H = 512, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0c0a35'); grad.addColorStop(.18, '#2a1560'); grad.addColorStop(.32, '#6b2d86');
  grad.addColorStop(.42, '#c2478a'); grad.addColorStop(.47, '#f0786f'); grad.addColorStop(.5, '#e28570');
  grad.addColorStop(.56, '#7a4a6a'); grad.addColorStop(1, '#2a1a3a');
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 260; i++) { g.globalAlpha = .25 + Math.random() * .75; g.fillStyle = '#fff'; const s = Math.random() < .1 ? 2 : 1; g.fillRect(Math.random() * W, Math.random() * H * .3, s, s); }
  g.globalAlpha = 1;
  const sx = W * .75, sy = H * .46, gl = g.createRadialGradient(sx, sy, 0, sx, sy, 190);
  gl.addColorStop(0, 'rgba(255,240,190,1)'); gl.addColorStop(.12, 'rgba(255,200,120,.95)'); gl.addColorStop(.35, 'rgba(255,130,100,.45)'); gl.addColorStop(1, 'rgba(255,100,120,0)');
  g.fillStyle = gl; g.fillRect(sx - 200, sy - 200, 400, 400);
  for (let i = 0; i < 26; i++) {
    const cx = Math.random() * W, cy = H * (.2 + Math.random() * .22), rw = 50 + Math.random() * 110, rh = 8 + Math.random() * 14;
    const cg = g.createRadialGradient(cx, cy, 0, cx, cy, rw); cg.addColorStop(0, 'rgba(255,190,170,.55)'); cg.addColorStop(1, 'rgba(255,150,170,0)');
    g.save(); g.translate(cx, cy); g.scale(1, rh / rw); g.translate(-cx, -cy); g.fillStyle = cg; g.beginPath(); g.arc(cx, cy, rw, 0, Math.PI * 2); g.fill(); g.restore();
  }
  const hz = H * .5;
  [['#4a2c63', 26, .011], ['#2f1c47', 16, .019]].forEach(([col, amp, fr], k) => {
    g.fillStyle = col; g.beginPath(); g.moveTo(0, hz + 2);
    for (let x = 0; x <= W; x += 4) g.lineTo(x, hz - amp * (.55 + .45 * Math.sin(x * fr + k * 2.1)) * (.6 + .4 * Math.sin(x * fr * 2.7 + k)));
    g.lineTo(W, hz + 2); g.closePath(); g.fill();
  });
  const tex = canvasTex(c); tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

function buildRace() {
  rScene = new THREE.Scene();
  rScene.background = new THREE.Color(0xe28570);
  rScene.fog = new THREE.FogExp2(col(0xd98a72), 0.0065);

  const skyTex = buildSky();
  skyMesh = new THREE.Mesh(new THREE.SphereGeometry(300, 40, 20), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, depthWrite: false, toneMapped: false }));
  skyMesh.renderOrder = -1; rScene.add(skyMesh);
  const pm = new THREE.PMREMGenerator(renderer), es = new THREE.Scene();
  es.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide })));
  raceEnv = pm.fromScene(es).texture; pm.dispose();
  rScene.environment = raceEnv;

  ambLight = new THREE.HemisphereLight(0xffc9a8, 0x2e2240, 0.75); rScene.add(ambLight);
  sunLight = new THREE.DirectionalLight(0xffc89a, 1.6);
  sunLight.castShadow = true; sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.near = 1; sunLight.shadow.camera.far = 90;
  Object.assign(sunLight.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14 });
  sunLight.shadow.bias = -0.0004; sunLight.shadow.normalBias = 0.03;
  rScene.add(sunLight, sunLight.target);

  // Relva
  const gc = makeCanvas(256, 256, (g) => {
    g.fillStyle = '#2f6b3f'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 4000; i++) { const r = Math.random(); g.fillStyle = r < .5 ? 'rgba(20,70,35,.5)' : r < .85 ? 'rgba(90,150,70,.35)' : 'rgba(140,120,60,.3)'; g.fillRect(Math.random() * 256, Math.random() * 256, 2, 3); }
  });
  groundTex = canvasTex(gc); groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping; groundTex.repeat.set(60, 120);
  groundMat = new THREE.MeshStandardMaterial({ map: groundTex, roughness: 1, metalness: 0 });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 600), groundMat);
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, -.06, -250); ground.receiveShadow = true;
  rScene.add(ground);

  // Montanhas distantes (estáticas: não "saltam")
  const mg = new THREE.ConeGeometry(40, 30, 6), mm = new THREE.MeshStandardMaterial({ color: 0x4a2c63, roughness: 1, flatShading: true });
  for (let i = 0; i < 9; i++) [-1, 1].forEach(s => {
    const m = new THREE.Mesh(mg, mm); m.position.set(s * (130 + Math.random() * 60), 8, -150 - i * 32); m.scale.set(1.2 + Math.random(), .7 + Math.random() * .8, 1.2); rScene.add(m);
  });

  // Materiais partilhados da estrada
  const roadTex = roadTexture();
  const kerbTex = canvasTex(makeCanvas(32, 64, (g, w, h) => {
    g.fillStyle = '#d6202a'; g.fillRect(0, 0, w, h / 2); g.fillStyle = '#f2f2f2'; g.fillRect(0, h / 2, w, h / 2);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, 0, 3, h); g.fillRect(w - 3, 0, 3, h);
  }));
  kerbTex.wrapS = kerbTex.wrapT = THREE.RepeatWrapping; kerbTex.repeat.set(1, ROAD.tileLen / 2);
  const roadMat = new THREE.MeshStandardMaterial({ map: roadTex, roughness: .82, metalness: .05 });
  const kerbMat = new THREE.MeshStandardMaterial({ map: kerbTex, roughness: .6 });
  const railMat = standard(0xa4adb7, { metalness: .85, roughness: .3 });
  const postMat = standard(0x5b636d, { metalness: .6, roughness: .5 });
  const poleMat = standard(0x2f3640, { metalness: .7, roughness: .4 });
  const lampMat = glow(0xffe2b0);
  const glowMat = new THREE.SpriteMaterial({ map: TEX.spark, color: 0xffc888, transparent: true, opacity: .55, blending: THREE.AdditiveBlending, depthWrite: false });
  const trunkMat = standard(0x4a3322, { roughness: 1, metalness: 0 }), pineMat = standard(0x1f5a34, { roughness: .95, metalness: 0, flatShading: true });
  const bushMat = standard(0x2e6b33, { roughness: .95, metalness: 0, flatShading: true });
  const roadGeo = new THREE.PlaneGeometry(ROAD.width, ROAD.tileLen), kerbGeo = new THREE.PlaneGeometry(ROAD.kerbW, ROAD.tileLen);
  const railGeo = BOX(.1, .32, ROAD.tileLen), postGeo = BOX(.12, .7, .12);
  const trunkGeo = new THREE.CylinderGeometry(.22, .32, 2, 6), pineGeo = new THREE.ConeGeometry(1.5, 4.6, 7), bushGeo = new THREE.IcosahedronGeometry(1.4, 0);
  const railX = ROAD.railInner + .05;

  for (let i = 0; i < ROAD.tiles; i++) {
    const tile = new THREE.Group(); tile.position.z = -i * ROAD.tileLen;
    const road = new THREE.Mesh(roadGeo, roadMat); road.rotation.x = -Math.PI / 2; road.receiveShadow = true; tile.add(road);
    [-1, 1].forEach(s => {
      const k = new THREE.Mesh(kerbGeo, kerbMat); k.rotation.x = -Math.PI / 2; k.position.set(s * (ROAD.edge + ROAD.kerbW / 2), .012, 0); k.receiveShadow = true; tile.add(k);
      const shoulder = new THREE.Mesh(new THREE.PlaneGeometry(.6, ROAD.tileLen), roadMat); shoulder.rotation.x = -Math.PI / 2; shoulder.position.set(s * (ROAD.edge + ROAD.kerbW + .3), .005, 0); tile.add(shoulder);
      const rail = new THREE.Mesh(railGeo, railMat); rail.position.set(s * railX, .6, 0); rail.castShadow = true; tile.add(rail);
      const rail2 = new THREE.Mesh(railGeo, railMat); rail2.position.set(s * railX, .28, 0); rail2.scale.y = .5; tile.add(rail2);
      const posts = new THREE.InstancedMesh(postGeo, postMat, 15), dm = new THREE.Object3D();
      for (let p = 0; p < 15; p++) { dm.position.set(s * (railX + .1), .35, -ROAD.tileLen / 2 + 2 + p * 4); dm.updateMatrix(); posts.setMatrixAt(p, dm.matrix); }
      tile.add(posts);
      // Candeeiro
      const lamp = new THREE.Group(); lamp.position.set(s * (railX + 1.2), 0, s * 15);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(.08, .12, 7, 8), poleMat); pole.position.y = 3.5; lamp.add(pole);
      const arm = new THREE.Mesh(BOX(1.8, .08, .08), poleMat); arm.position.set(-s * .85, 6.95, 0); lamp.add(arm);
      const head = new THREE.Mesh(BOX(.6, .08, .24), lampMat); head.position.set(-s * 1.6, 6.88, 0); lamp.add(head);
      const sp = new THREE.Sprite(glowMat); sp.scale.set(3, 3, 1); sp.position.set(-s * 1.6, 6.7, 0); lamp.add(sp);
      tile.add(lamp);
    });
    // Árvores e arbustos instanciados
    const count = 24, trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, count), pines = new THREE.InstancedMesh(pineGeo, pineMat, count), bushes = new THREE.InstancedMesh(bushGeo, bushMat, 14);
    const dm = new THREE.Object3D();
    for (let t = 0; t < count; t++) {
      const s = t % 2 ? 1 : -1, x = s * (railX + 4 + Math.random() * 32), z = (Math.random() - .5) * ROAD.tileLen, sc = .7 + Math.random();
      dm.rotation.set(0, Math.random() * 6, 0); dm.scale.set(sc, sc, sc);
      dm.position.set(x, sc, z); dm.updateMatrix(); trunks.setMatrixAt(t, dm.matrix);
      dm.position.set(x, sc * 2 + sc * 2.1, z); dm.updateMatrix(); pines.setMatrixAt(t, dm.matrix);
    }
    for (let t = 0; t < 14; t++) {
      const s = t % 2 ? 1 : -1, sc = .4 + Math.random() * .6;
      dm.rotation.set(Math.random(), Math.random() * 6, 0); dm.scale.set(sc * 1.3, sc, sc);
      dm.position.set(s * (railX + 1.8 + Math.random() * 10), sc * .5, (Math.random() - .5) * ROAD.tileLen); dm.updateMatrix(); bushes.setMatrixAt(t, dm.matrix);
    }
    [trunks, pines, bushes].forEach(m => { m.frustumCulled = false; tile.add(m); });
    rScene.add(tile); roadTiles.push(tile);
  }

  playerRoot = new THREE.Group(); rScene.add(playerRoot);
  initObstacleAssets();
  initFX();
}
