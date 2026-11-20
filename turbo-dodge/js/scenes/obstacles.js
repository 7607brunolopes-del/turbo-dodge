'use strict';

// ---------------------------------------------------------------------
// OBSTÁCULOS E RECOLHÍVEIS
// ---------------------------------------------------------------------
const OB = {};
function initObstacleAssets() {
  const sh = new THREE.Shape();
  [[-.3, 0], [.3, 0], [.3, .08], [.12, .3], [.08, .82], [-.08, .82], [-.12, .3], [-.3, .08]].forEach((p, i) => i ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1]));
  OB.jersey = new THREE.ExtrudeGeometry(sh, { depth: 2.1, bevelEnabled: false }); OB.jersey.translate(0, 0, -1.05); OB.jersey.rotateY(Math.PI / 2);
  OB.concrete = standard(0xc9c6bd, { roughness: .9, metalness: 0 });
  OB.stripe = new THREE.MeshStandardMaterial({ map: TEX.chevron, roughness: .4, emissive: 0x220000 });
  OB.cone = new THREE.ConeGeometry(.2, .6, 16); OB.coneMat = standard(0xff6a13, { roughness: .5, metalness: 0 });
  OB.band = new THREE.CylinderGeometry(.125, .15, .1, 16); OB.white = standard(0xf5f5f5, { roughness: .4, metalness: 0, emissive: 0x222222 });
  OB.base = BOX(.42, .05, .42); OB.black = standard(0x15161a, { roughness: .8 });
  OB.rock = standard(0x5a6170, { roughness: .95, metalness: 0, flatShading: true });
  OB.oil = new THREE.MeshPhysicalMaterial({ color: 0x050608, roughness: .05, metalness: .6, clearcoat: 1, transparent: true, opacity: .9 });
  OB.can = new THREE.CylinderGeometry(.22, .22, .7, 20); OB.canMat = physical(0x0f6fd1, { metalness: .6, roughness: .25, emissive: 0x062a55 });
  OB.ringGeo = new THREE.TorusGeometry(.6, .03, 8, 40); OB.ringMat = new THREE.MeshBasicMaterial({ color: 0x3cc8ff, toneMapped: false, transparent: true, opacity: .9 });
}
function makeObstacle(kind) {
  const g = new THREE.Group();
  if (kind === 'barrier') {
    const b = new THREE.Mesh(OB.jersey, OB.concrete); b.castShadow = true; b.receiveShadow = true; g.add(b);
    const st = new THREE.Mesh(BOX(2.06, .16, .02), OB.stripe); st.position.set(0, .62, .1); st.rotation.x = -0.07; g.add(st);
    g.userData = { type: 'barrier', hw: 1.05, hl: .32 };
  } else if (kind === 'cones') {
    [-.8, 0, .8].forEach(x => {
      const c = new THREE.Mesh(OB.cone, OB.coneMat); c.position.set(x, .33, 0); c.castShadow = true; g.add(c);
      const b = new THREE.Mesh(OB.band, OB.white); b.position.set(x, .3, 0); g.add(b);
      const base = new THREE.Mesh(OB.base, OB.black); base.position.set(x, .025, 0); g.add(base);
    });
    g.userData = { type: 'cones', hw: 1.0, hl: .25 };
  } else if (kind === 'rock') {
    const s = .8 + Math.random() * .4, geo = new THREE.IcosahedronGeometry(s, 1), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const k = .78 + Math.random() * .4; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * .8, p.getZ(i) * k); }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, OB.rock); m.position.y = s * .55; m.rotation.set(Math.random() * 3, Math.random() * 3, 0); m.castShadow = true; g.add(m);
    g.userData = { type: 'rock', hw: s * .82, hl: s * .8 };
  } else if (kind === 'oil') {
    const m = new THREE.Mesh(new THREE.CircleGeometry(1.2, 20), OB.oil); m.rotation.x = -Math.PI / 2; m.position.y = .022; m.scale.set(1, .8 + Math.random() * .3, 1); g.add(m);
    g.userData = { type: 'oil', hw: .95, hl: .9 };
  } else if (kind === 'nitro') {
    const c = new THREE.Mesh(OB.can, OB.canMat); c.position.y = .7; c.castShadow = true; g.add(c);
    const r = new THREE.Mesh(OB.ringGeo, OB.ringMat); r.position.y = .7; r.rotation.x = Math.PI / 2; g.add(r);
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.spark, color: 0x3cc8ff, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false })); sp.scale.set(2.2, 2.2, 1); sp.position.y = .7; g.add(sp);
    g.userData = { type: 'nitro', hw: .75, hl: .75, spin: c, ring: r };
  }
  return g;
}
