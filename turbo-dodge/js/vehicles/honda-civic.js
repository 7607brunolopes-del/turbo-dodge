'use strict';

// =====================================================================
// HONDA CIVIC TYPE R (FL5)
// =====================================================================
const CIVIC_BODY = [
  { z: -2.30, w: .78, yb: .24, ym: .48, yt: .70, n: 3.2, tp: .2 },
  { z: -2.22, w: .88, yb: .17, ym: .50, yt: .77, n: 3.8, tp: .15 },
  { z: -1.95, w: .935, yb: .15, ym: .56, yt: .83, n: 4.4, tp: .1 },
  { z: -1.35, w: .962, yb: .2, ym: .63, yt: .90, n: 5.2, tp: .07 },
  { z: -0.80, w: .935, yb: .2, ym: .655, yt: .955, n: 5.6, tp: .06 },
  { z: 0.0, w: .925, yb: .2, ym: .665, yt: .985, n: 5.6, tp: .06 },
  { z: 0.8, w: .935, yb: .2, ym: .675, yt: 1.005, n: 5.6, tp: .06 },
  { z: 1.39, w: .962, yb: .21, ym: .68, yt: 1.025, n: 5.4, tp: .07 },
  { z: 1.95, w: .935, yb: .22, ym: .67, yt: 1.045, n: 5, tp: .08 },
  { z: 2.22, w: .88, yb: .25, ym: .65, yt: 1.04, n: 4.4, tp: .1 },
  { z: 2.31, w: .80, yb: .30, ym: .63, yt: .99, n: 3.6, tp: .13 }
];
const CIVIC_GLASS = [
  { z: -0.92, w: .80, yb: .84, ym: .9, yt: .91, n: 6, tp: .26 },
  { z: -0.46, w: .80, yb: .85, ym: .91, yt: 1.19, n: 6, tp: .28 },
  { z: -0.02, w: .78, yb: .86, ym: .92, yt: 1.37, n: 6, tp: .3 },
  { z: 0.45, w: .77, yb: .87, ym: .93, yt: 1.405, n: 6, tp: .3 },
  { z: 0.95, w: .76, yb: .88, ym: .94, yt: 1.36, n: 6, tp: .3 },
  { z: 1.55, w: .74, yb: .9, ym: .96, yt: 1.21, n: 6, tp: .3 },
  { z: 2.16, w: .71, yb: .93, ym: .99, yt: 1.02, n: 6, tp: .3 }
];

function buildCivic(def, paint) {
  const v = newVehicle(def), C = v.chassis;
  const M = carMaterials(paint, 0x16181b, 0xc8121e); v.mats = M;
  M.rim.metalness = .5; M.rim.roughness = .35;
  const B = carBody(v, M, CIVIC_BODY, CIVIC_GLASS, [-0.06, 1.12], M.paint);
  carWheels(v, M, B, { R: .33, W: .265, rimR: .24, fz: -1.347, rz: 1.388, spokes: 5, twin: true });
  const F = -2.30, RZ = 2.31;

  // Frente: grelha superior com emblema vermelho, grelha inferior larga, entradas laterais
  mk(BOX(.92, .09, .03), M.gloss, C, 0, .62, F - .004);
  const badge = mk(new THREE.PlaneGeometry(.11, .08), new THREE.MeshStandardMaterial({ map: TEX.badgeH, roughness: .3, metalness: .2 }), C, 0, .62, F - .022, 0, Math.PI, 0);
  mk(BOX(1.26, .24, .04), M.mesh, C, 0, .36, F + .01);
  mk(frameGeo(1.3, .28, .05, .025, .05), M.gloss, C, 0, .36, F - .005);
  [-1, 1].forEach(s => {
    mk(BOX(.2, .24, .06), M.mesh, C, s * .66, .38, F + .06, 0, -s * .35, 0);
    const g = new THREE.Group(); g.position.set(s * .6, .63, F + .04); g.rotation.y = -s * .3; C.add(g);
    mk(BOX(.46, .08, .08), M.housing, g);
    mk(BOX(.4, .012, .01), M.head, g, 0, .025, -.042);
    mk(BOX(.08, .035, .01), M.head, g, -s * .08, -.01, -.042);
    mk(BOX(.08, .035, .01), M.head, g, s * .04, -.01, -.042);
  });
  mk(BOX(1.76, .03, .24), M.black, C, 0, .165, F + .1);
  mk(new THREE.PlaneGeometry(.52, .11), M.plate, C, 0, .36, F - .03, 0, Math.PI, 0);
  // Entrada de ar do capot
  mk(BOX(.46, .03, .36), M.gloss, C, 0, B.top(-1.5) - .008, -1.5, -0.1, 0, 0);
  mk(BOX(.38, .01, .28), M.mesh, C, 0, B.top(-1.5) + .004, -1.5, -0.1, 0, 0);
  // Laterais
  [-1, 1].forEach(s => {
    mk(BOX(.02, .14, .2), M.gloss, C, s * (B.wAt(-.95) + .003), .72, -.92);
    mk(BOX(.07, .08, 1.9), M.black, C, s * (B.wAt(0) - .01), .24, .02);
    mk(BOX(.012, .025, .14), M.gloss, C, s * (B.wAt(-.05) + .002), .86, -.05);
    const mir = mk(new THREE.SphereGeometry(1, 16, 12), M.gloss, C, s * .99, 1.0, -.72);
    mir.scale.set(.065, .055, .12);
  });
  // Geradores de vórtice no tejadilho
  for (let i = -3; i <= 3; i++) mk(BOX(.012, .035, .09), M.gloss, C, i * .09, 1.375, 1.0, 0, 0, 0);
  // Asa traseira enorme
  mk(BOX(1.62, .035, .27), M.gloss, C, 0, 1.33, 2.06, 0.08, 0, 0);
  mk(BOX(1.62, .018, .08), M.gloss, C, 0, 1.37, 2.17, 0.25, 0, 0);
  [-1, 1].forEach(s => {
    mk(BOX(.02, .17, .34), M.gloss, C, s * .815, 1.31, 2.08);
    mk(BOX(.04, .26, .1), M.gloss, C, s * .36, 1.19, 2.1, -0.15, 0, 0);
  });
  // Traseira: farolins, difusor, 3 escapes centrais, refletores, matrícula
  [-1, 1].forEach(s => {
    const g = new THREE.Group(); g.position.set(s * .6, .98, RZ - .07); g.rotation.y = s * .3; C.add(g);
    mk(BOX(.44, .08, .07), M.housing, g);
    mk(BOX(.4, .055, .01), M.tailDim, g, 0, 0, .037);
    mk(BOX(.38, .014, .012), M.tail, g, 0, .022, .04);
    mk(BOX(.014, .05, .012), M.tail, g, s * .19, 0, .04);
    mk(BOX(.05, .14, .03), M.reflector, C, s * .74, .38, RZ - .03);
  });
  mk(BOX(1.62, .15, .12), M.black, C, 0, .28, RZ - .03);
  for (let i = 0; i < 6; i++) mk(BOX(.014, .13, .14), M.black, C, -.62 + i * .248 * (i < 3 ? 1 : 1), .26, RZ);
  [[-0.2, .05], [0, .068], [0.2, .05]].forEach(([x, r]) => {
    const eg = new THREE.CylinderGeometry(r, r, .16, 18); eg.rotateX(Math.PI / 2);
    mk(eg, M.exhaust, C, x, .32, RZ + .03);
    mk(new THREE.CircleGeometry(r * .78, 18), M.black, C, x, .32, RZ + .111);
  });
  mk(new THREE.PlaneGeometry(.52, .11), M.plate, C, 0, .56, RZ + .006);
  v.exhausts = [V3(0, .32, RZ + .12)];
  v.dims = { hw: .96, hl: 2.32 };
  v.tailMat = M.tail;
  v.setPaint = p => setCol(M.paint.color, p.c);
  finishVehicle(v);
  return v;
}
