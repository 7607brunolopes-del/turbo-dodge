'use strict';

// =====================================================================
// BMW M4 COMPETITION (G82)
// =====================================================================
const M4_BODY = [
  { z: -2.40, w: .72, yb: .26, ym: .48, yt: .75, n: 3.0, tp: .2 },
  { z: -2.35, w: .83, yb: .19, ym: .50, yt: .795, n: 3.4, tp: .16 },
  { z: -2.2, w: .905, yb: .17, ym: .55, yt: .835, n: 3.9, tp: .12 },
  { z: -1.9, w: .94, yb: .19, ym: .59, yt: .87, n: 4.5, tp: .09 },
  { z: -1.55, w: .955, yb: .22, ym: .62, yt: .9, n: 5, tp: .08 },
  { z: -0.95, w: .935, yb: .21, ym: .65, yt: .975, n: 5.4, tp: .06 },
  { z: -0.20, w: .925, yb: .21, ym: .67, yt: 1.0, n: 5.6, tp: .06 },
  { z: 0.60, w: .93, yb: .21, ym: .68, yt: 1.02, n: 5.6, tp: .06 },
  { z: 1.32, w: .958, yb: .22, ym: .69, yt: 1.045, n: 5.4, tp: .07 },
  { z: 1.95, w: .935, yb: .24, ym: .68, yt: 1.06, n: 5, tp: .08 },
  { z: 2.32, w: .89, yb: .26, ym: .66, yt: 1.04, n: 4.2, tp: .11 },
  { z: 2.42, w: .83, yb: .30, ym: .64, yt: .99, n: 3.5, tp: .14 }
];
const M4_GLASS = [
  { z: -1.05, w: .80, yb: .86, ym: .92, yt: .93, n: 6, tp: .26 },
  { z: -0.58, w: .80, yb: .86, ym: .92, yt: 1.19, n: 6, tp: .28 },
  { z: -0.12, w: .78, yb: .87, ym: .93, yt: 1.355, n: 6, tp: .3 },
  { z: 0.35, w: .77, yb: .88, ym: .94, yt: 1.385, n: 6, tp: .3 },
  { z: 0.82, w: .76, yb: .89, ym: .95, yt: 1.33, n: 6, tp: .3 },
  { z: 1.32, w: .74, yb: .91, ym: .97, yt: 1.19, n: 6, tp: .3 },
  { z: 1.82, w: .71, yb: .94, ym: .99, yt: 1.03, n: 6, tp: .3 }
];

function buildM4(def, paint) {
  const v = newVehicle(def), C = v.chassis;
  const M = carMaterials(paint, 0xb3864e, 0xc8121e); v.mats = M;
  const B = carBody(v, M, M4_BODY, M4_GLASS, [-0.14, 0.95], M.carbon);
  carWheels(v, M, B, { R: .345, W: .27, rimR: .245, fz: -1.535, rz: 1.322, spokes: 5, twin: true });
  const F = -2.40, RZ = 2.42;

  // Grelha "rins" vertical (CSL) com contorno vermelho
  [-1, 1].forEach(s => {
    mk(BOX(.25, .37, .03), M.mesh, C, s * .18, .5, F - .004);
    mk(frameGeo(.31, .43, .065, .032, .05), M.gloss, C, s * .18, .5, F - .01);
    mk(frameGeo(.272, .392, .048, .008, .052), M.redTrim, C, s * .18, .5, F - .012);
  });
  // Faróis angulares com assinatura amarela
  [-1, 1].forEach(s => {
    const g = new THREE.Group(); g.position.set(s * .6, .66, F + .035); g.rotation.set(0, -s * .3, 0); C.add(g);
    mk(BOX(.46, .125, .1), M.housing, g);
    mk(BOX(.36, .02, .01), M.drl, g, 0, .036, -.052);
    mk(BOX(.02, .08, .01), M.drl, g, s * .17, 0, -.052);
    mk(new THREE.CircleGeometry(.032, 16), M.head, g, -s * .07, -.012, -.052, 0, Math.PI, 0);
    mk(new THREE.CircleGeometry(.032, 16), M.head, g, s * .04, -.012, -.052, 0, Math.PI, 0);
  });
  // Entradas de ar inferiores, splitter, matrícula
  [-1, 1].forEach(s => {
    mk(BOX(.3, .19, .06), M.mesh, C, s * .55, .37, F + .03, 0, -s * .3, 0);
    mk(BOX(.03, .2, .08), M.gloss, C, s * .79, .4, F + .1, 0, -s * .6, 0.2 * s);
  });
  mk(BOX(1.74, .03, .28), M.carbon, C, 0, .175, F + .09);
  mk(new THREE.PlaneGeometry(.52, .11), M.plate, C, 0, .3, F - .03, 0, Math.PI, 0);
  // Guelras laterais, saias, puxadores, espelhos
  [-1, 1].forEach(s => {
    mk(BOX(.02, .18, .07), M.gloss, C, s * (B.wAt(-.95) + .003), .72, -.95);
    mk(BOX(.07, .08, 1.95), M.carbon, C, s * (B.wAt(0) - .01), .25, -.1);
    mk(BOX(.012, .025, .14), M.gloss, C, s * (B.wAt(-.1) + .002), .88, -.1);
    const mir = mk(new THREE.SphereGeometry(1, 16, 12), M.paint, C, s * 1.0, 1.03, -.8);
    mir.scale.set(.07, .055, .13);
    mk(BOX(.09, .03, .07), M.carbon, C, s * .93, .99, -.8);
  });
  // Traseira: farolins em L, ducktail, difusor, 4 escapes, matrícula
  [-1, 1].forEach(s => {
    const g = new THREE.Group(); g.position.set(s * .58, .9, RZ - .06); g.rotation.y = s * .3; C.add(g);
    mk(BOX(.42, .12, .07), M.housing, g);
    mk(BOX(.38, .09, .01), M.tailDim, g, 0, 0, .037);
    mk(BOX(.34, .018, .012), M.tail, g, 0, .038, .04);
    mk(BOX(.018, .08, .012), M.tail, g, s * .17, 0, .04);
    mk(BOX(.22, .012, .012), M.tail, g, -s * .02, -.025, .04);
    mk(BOX(.12, .03, .02), M.reflector, C, s * .74, .4, RZ - .03);
  });
  mk(BOX(1.5, .035, .16), M.carbon, C, 0, B.top(2.3) + .012, 2.3, -0.12, 0, 0);
  mk(BOX(1.52, .14, .14), M.carbon, C, 0, .27, RZ - .03);
  for (let i = 0; i < 5; i++) mk(BOX(.014, .12, .16), M.carbon, C, -.2 + i * .1, .25, RZ);
  [-.52, -.38, .38, .52].forEach(x => {
    const eg = new THREE.CylinderGeometry(.047, .047, .14, 16); eg.rotateX(Math.PI / 2);
    mk(eg, M.exhaust, C, x, .31, RZ + .02);
    const ig = new THREE.CircleGeometry(.036, 16); mk(ig, M.black, C, x, .31, RZ + .091);
  });
  mk(new THREE.PlaneGeometry(.52, .11), M.plate, C, 0, .6, RZ + .006);
  v.exhausts = [V3(-.45, .31, RZ + .1), V3(.45, .31, RZ + .1)];
  v.dims = { hw: .96, hl: 2.42 };
  v.tailMat = M.tail;
  v.setPaint = p => setCol(M.paint.color, p.c);
  finishVehicle(v);
  return v;
}
