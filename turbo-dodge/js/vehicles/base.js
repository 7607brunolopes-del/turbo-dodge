'use strict';

// =====================================================================
// VEÍCULO BASE
// =====================================================================
function newVehicle(def) {
  const v = { def, type: def.type, root: new THREE.Group(), chassis: new THREE.Group(), wheels: [], exhausts: [], flames: [], rider: null, mats: null, dims: { hw: 1, hl: 2 } };
  v.root.add(v.chassis);
  const blob = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: TEX.blob, transparent: true, depthWrite: false, toneMapped: false, opacity: .9 }));
  blob.rotation.x = -Math.PI / 2; blob.position.y = 0.02; blob.renderOrder = 1;
  v.root.add(blob); v.blob = blob;
  return v;
}
function finishVehicle(v) {
  v.blob.scale.set(v.dims.hw * 2.5, v.dims.hl * 2.25, 1);
  // Chamas do nitro (presas ao escape, nunca ficam para trás na estrada)
  const outer = new THREE.MeshBasicMaterial({ color: 0x3aa8ff, transparent: true, opacity: .75, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const inner = new THREE.MeshBasicMaterial({ color: 0xdff4ff, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  v.exhausts.forEach(p => {
    const g = new THREE.Group(); g.position.copy(p);
    const og = new THREE.ConeGeometry(0.075, 0.6, 12, 1, true); og.translate(0, -0.3, 0); og.rotateX(-Math.PI / 2);
    const ig = new THREE.ConeGeometry(0.04, 0.32, 10, 1, true); ig.translate(0, -0.16, 0); ig.rotateX(-Math.PI / 2);
    g.add(new THREE.Mesh(og, outer)); g.add(new THREE.Mesh(ig, inner));
    g.visible = false; v.chassis.add(g); v.flames.push(g);
  });
  v.root.traverse(o => {
    if (!o.isMesh || o === v.blob) return;
    if (o.material && (o.material.blending === THREE.AdditiveBlending || o.material.transparent)) return;
    o.castShadow = true; o.receiveShadow = true;
  });
}

function carMaterials(paint, rim, caliper) {
  return {
    paint: physical(paint, { metalness: .55, roughness: .32, clearcoatRoughness: .05 }),
    glass: physical(0x070a0e, { metalness: .2, roughness: .04, clearcoatRoughness: .02, envMapIntensity: 1.6 }),
    black: standard(0x0a0b0d, { roughness: .6, metalness: .2 }),
    gloss: physical(0x0b0c0e, { metalness: .4, roughness: .18 }),
    carbon: physical(0xffffff, { map: TEX.carbon, metalness: .35, roughness: .38, clearcoatRoughness: .08 }),
    chrome: standard(0xdfe5ec, { metalness: 1, roughness: .12 }),
    exhaust: standard(0x6b7078, { metalness: 1, roughness: .28 }),
    mesh: standard(0xffffff, { map: TEX.mesh, metalness: .3, roughness: .7 }),
    rim: standard(rim, { metalness: .85, roughness: .28 }),
    rimInner: standard(0x1d2024, { metalness: .6, roughness: .5, side: THREE.DoubleSide }),
    tire: standard(0x121315, { metalness: 0, roughness: .9, side: THREE.DoubleSide }),
    disc: standard(0x9399a1, { metalness: .9, roughness: .32 }),
    caliper: standard(caliper, { metalness: .3, roughness: .35 }),
    arch: standard(0x040405, { roughness: .95, metalness: 0, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    housing: physical(0x0e1013, { metalness: .5, roughness: .15 }),
    head: glow(0xf4f8ff), drl: glow(0xffe7a3), tail: glow(0xc80f1a), tailDim: standard(0x3a0508, { roughness: .2, metalness: .2 }),
    amber: glow(0xff8a1a), reflector: standard(0x8a0a10, { roughness: .3, emissive: 0x2a0003 }),
    plate: new THREE.MeshStandardMaterial({ map: TEX.plate, roughness: .5 }),
    redTrim: standard(0xd0101c, { roughness: .35, emissive: 0x200003 })
  };
}

// Carroçaria + vidros + tejadilho a partir das estações
function carBody(v, M, bodyKeys, glassKeys, roofZ, roofMat) {
  const S = sampleKeys(bodyKeys, 52), G = sampleKeys(glassKeys, 34);
  mk(loftGeometry(S, 40), M.paint, v.chassis);
  mk(loftGeometry(G, 32), M.glass, v.chassis);
  const [z0, z1] = roofZ;
  const RS = G.filter(s => s.z >= z0 && s.z <= z1).map(s => {
    const f = Math.pow(Math.sin(Math.PI * clamp((s.z - z0) / (z1 - z0), 0, 1)), 0.22);
    return { z: s.z, w: Math.max(0.03, s.w * (1 - s.tp) * .96 * f), yb: s.yt - 0.035 * f - 0.002, ym: s.yt - 0.01 * f, yt: s.yt + 0.014 * f, n: 5, tp: .06 };
  });
  if (RS.length > 3) mk(loftGeometry(RS, 28), roofMat, v.chassis);
  return { S, G, top: z => stationAt(S, z).yt, wAt: z => stationAt(S, z).w };
}

function carWheels(v, M, B, o) {
  [[-1, o.fz, true], [1, o.fz, true], [-1, o.rz, false], [1, o.rz, false]].forEach(([s, z, front]) => {
    const bw = B.wAt(z);
    const w = buildWheel({ R: o.R, W: o.W, rimR: o.rimR, spokes: o.spokes, twin: o.twin, rimMat: M.rim, innerMat: M.rimInner, tireMat: M.tire, discMat: M.disc, caliperMat: M.caliper, capMat: M.black });
    w.root.position.set(s * (bw + 0.03 - o.W / 2), o.R, z);
    if (s < 0) { w.vis.scale.x = -1; w.fixed.scale.x = -1; }
    w.front = front; w.side = s;
    v.root.add(w.root); v.wheels.push(w);
    // Cava da roda (sombra escura) + arco do guarda-lamas
    const ag = new THREE.CircleGeometry(o.R + 0.065, 32, -0.25, Math.PI + 0.5); ag.rotateY(s > 0 ? Math.PI / 2 : -Math.PI / 2);
    mk(ag, M.arch, v.chassis, s * (bw + 0.004), o.R, z);
    const fg = new THREE.TorusGeometry(o.R + 0.085, 0.03, 8, 36, Math.PI + 0.5); fg.rotateZ(-0.25); fg.rotateY(Math.PI / 2);
    mk(fg, M.paint, v.chassis, s * (bw - 0.008), o.R, z);
  });
}
