'use strict';

// =====================================================================
// YAMAHA MT-07
// =====================================================================
function buildMT07(def, paint, accent) {
  const v = newVehicle(def), C = v.chassis;
  const M = {
    paint: physical(paint, { metalness: .45, roughness: .32 }),
    accent: physical(accent, { metalness: .4, roughness: .3 }),
    dark: physical(0x2a2d32, { metalness: .5, roughness: .4 }),
    black: standard(0x0c0d0f, { roughness: .6, metalness: .25 }),
    frame: physical(0x141518, { metalness: .5, roughness: .35 }),
    engine: standard(0x3b3e44, { metalness: .75, roughness: .38 }),
    engineDark: standard(0x1d1f23, { metalness: .6, roughness: .5 }),
    silver: standard(0xc3c8cf, { metalness: .95, roughness: .22 }),
    rim: standard(accent, { metalness: .55, roughness: .3 }),
    rimInner: standard(0x1d2024, { metalness: .6, roughness: .5, side: THREE.DoubleSide }),
    tire: standard(0x121315, { metalness: 0, roughness: .88, side: THREE.DoubleSide }),
    disc: standard(0xa3a9b0, { metalness: .9, roughness: .3 }),
    caliper: standard(0x1b1c1f, { metalness: .5, roughness: .4 }),
    seat: standard(0x111214, { roughness: .85 }),
    mesh: standard(0xffffff, { map: TEX.mesh, metalness: .3, roughness: .7 }),
    head: glow(0xf4f8ff), drl: glow(0xdff2ff), tail: glow(0xd0101c), amber: glow(0xff8a1a),
    plate: new THREE.MeshStandardMaterial({ map: TEX.plateBike, roughness: .5 }),
    decal: new THREE.MeshBasicMaterial({ map: TEX.mtDecal, transparent: true, depthWrite: false }),
    screen: standard(0x0b1a2a, { emissive: 0x0d3a66, roughness: .2 })
  };
  v.mats = M;
  const zF = -0.71, zR = 0.69;
  // Rodas
  const fw = buildWheel({ bike: true, R: .30, W: .12, rimR: .215, spokes: 5, twin: true, rimMat: M.rim, innerMat: M.rimInner, tireMat: M.tire, discMat: M.disc, caliperMat: M.caliper, discs: [-.075, .075], discR: .15, calipers: [{ x: -.085, a: 0.55 }, { x: .085, a: 0.55 }] });
  fw.root.position.set(0, .30, zF); fw.front = true; C.add(fw.root); v.wheels.push(fw);
  const rw = buildWheel({ bike: true, R: .315, W: .18, rimR: .215, spokes: 5, twin: true, rimMat: M.rim, innerMat: M.rimInner, tireMat: M.tire, discMat: M.disc, caliperMat: M.caliper, discs: [.1], discR: .12, calipers: [{ x: .11, a: -1.0 }], sprocket: { x: -.1, r: .11 } });
  rw.root.position.set(0, .315, zR); C.add(rw.root); v.wheels.push(rw);

  // Forquilha invertida + mesas de direção
  const top = V3(0, 1.0, -.38), axle = V3(0, .30, zF);
  [-1, 1].forEach(s => {
    const a = V3(s * .1, axle.y, axle.z), b = V3(s * .1, top.y, top.z), mid = a.clone().lerp(b, .46);
    limb(C, a, mid, .03, M.frame);
    limb(C, mid, b, .025, M.black);
    mk(new THREE.CircleGeometry(.025, 14), M.amber, C, s * .133, .48, -.62, 0, s * Math.PI / 2, 0);
  });
  mk(BOX(.3, .035, .1), M.black, C, 0, 1.0, -.38, -0.44, 0, 0);
  mk(BOX(.28, .03, .1), M.black, C, 0, .88, -.43, -0.44, 0, 0);
  // Guarda-lamas dianteiro
  const fen = new THREE.TorusGeometry(.335, .032, 8, 24, 1.25); fen.rotateZ(0.75); fen.rotateY(Math.PI / 2);
  const fm = mk(fen, M.paint, C, 0, .30, zF); fm.scale.x = 1.55;
  // Farol LED "MT" (projetor central + 2 DRL)
  const hl = new THREE.Group(); hl.position.set(0, .94, -.5); hl.rotation.x = 0.32; C.add(hl);
  mk(roundBox(.22, .17, .13, .05), M.black, hl);
  mk(new THREE.CircleGeometry(.043, 20), M.head, hl, 0, -.02, -.068, 0, Math.PI, 0);
  [-1, 1].forEach(s => {
    mk(BOX(.085, .014, .02), M.drl, hl, s * .058, .05, -.06, 0, 0, s * .35);
    mk(BOX(.04, .13, .1), M.paint, hl, s * .115, -.005, .0, 0, s * .2, 0);
  });
  // Painel TFT
  mk(BOX(.15, .09, .03), M.black, C, 0, 1.08, -.4, -0.9, 0, 0);
  mk(new THREE.PlaneGeometry(.12, .065), M.screen, C, 0, 1.093, -.39, -0.9, 0, 0);
  // Guiador, punhos, manetes e espelhos
  [-1, 1].forEach(s => {
    limb(C, V3(s * .07, 1.07, -.35), V3(s * .36, 1.12, -.27), .014, M.black);
    limb(C, V3(s * .29, 1.115, -.285), V3(s * .4, 1.125, -.265), .021, M.seat);
    mk(new THREE.SphereGeometry(.018, 10, 8), M.silver, C, s * .405, 1.125, -.264);
    limb(C, V3(s * .25, 1.11, -.3), V3(s * .36, 1.1, -.36), .007, M.silver);
    limb(C, V3(s * .25, 1.13, -.3), V3(s * .31, 1.31, -.33), .007, M.black);
    const mh = mk(new THREE.SphereGeometry(1, 14, 10), M.black, C, s * .33, 1.34, -.34);
    mh.scale.set(.075, .048, .018);
  });
  limb(C, V3(0, 1.0, -.37), V3(0, 1.07, -.35), .02, M.black);
  // Depósito e entradas de ar laterais com decalque MT-07
  mk(roundBox(.3, .16, .44, .07), M.paint, C, 0, .99, -.13, 0.1, 0, 0);
  const tc = mk(new THREE.SphereGeometry(1, 20, 14), M.paint, C, 0, 1.05, -.16); tc.scale.set(.14, .06, .2);
  [-1, 1].forEach(s => {
    const sc = new THREE.Group(); sc.position.set(s * .17, .87, -.26); sc.rotation.set(0, s * .12, -s * .12); C.add(sc);
    mk(roundBox(.05, .22, .36, .05), M.dark, sc);
    mk(BOX(.054, .018, .3), M.accent, sc, 0, .085, 0);
    mk(new THREE.PlaneGeometry(.2, .075), M.decal, sc, s * .029, -.01, .02, 0, s * Math.PI / 2, 0);
    // Cobertura do radiador
    mk(roundBox(.035, .19, .2, .05), M.paint, C, s * .185, .76, -.37, -0.25, s * .4, 0);
  });
  mk(BOX(.32, .3, .05), M.mesh, C, 0, .7, -.36, 0.25, 0, 0);
  // Quadro tubular
  [-1, 1].forEach(s => {
    limb(C, V3(0, .95, -.4), V3(s * .12, .86, -.05), .028, M.frame);
    limb(C, V3(s * .12, .86, -.05), V3(s * .12, .5, .07), .028, M.frame);
    limb(C, V3(s * .07, .9, -.38), V3(s * .12, .6, -.24), .022, M.frame);
    limb(C, V3(s * .1, .82, .02), V3(s * .075, .9, .62), .016, M.frame);
    limb(C, V3(s * .12, .55, .08), V3(s * .075, .86, .45), .014, M.frame);
  });
  // Motor bicilíndrico
  mk(roundBox(.3, .24, .38, .05), M.engine, C, 0, .42, -.05);
  const cyl = new THREE.Group(); cyl.position.set(0, .62, -.2); cyl.rotation.x = -0.55; C.add(cyl);
  mk(roundBox(.28, .22, .2, .03), M.engineDark, cyl);
  for (let i = -2; i <= 2; i++) mk(BOX(.3, .01, .21), M.engine, cyl, 0, i * .04, 0);
  mk(roundBox(.27, .07, .17, .025), M.engine, cyl, 0, .14, 0);
  const cc = new THREE.CylinderGeometry(.1, .1, .03, 24); cc.rotateZ(Math.PI / 2);
  mk(cc, M.silver, C, .165, .44, 0);
  const gc = new THREE.CylinderGeometry(.09, .09, .03, 24); gc.rotateZ(Math.PI / 2);
  mk(gc, M.engine, C, -.165, .44, -.08);
  // Escape (coletores + silenciador por baixo do motor)
  [-1, 1].forEach(s => {
    limb(C, V3(s * .06, .58, -.34), V3(s * .06, .3, -.37), .025, M.silver);
    limb(C, V3(s * .06, .3, -.37), V3(s * .02 + .03, .19, -.08), .025, M.silver);
  });
  mk(roundBox(.2, .13, .34, .05), M.engineDark, C, .03, .19, .1);
  const tip = new THREE.CylinderGeometry(.03, .03, .05, 12); tip.rotateX(Math.PI / 2);
  mk(tip, M.silver, C, .08, .2, .29);
  mk(BOX(.02, .18, .16), M.silver, C, .15, .3, -.27, 0, .3, 0);
  // Braço oscilante, corrente, amortecedor
  [-1, 1].forEach(s => limb(C, V3(s * .11, .48, .08), V3(s * .11, .315, zR), .03, M.dark));
  limb(C, V3(-.11, .45, .07), V3(-.11, .425, zR), .007, M.black);
  limb(C, V3(-.11, .39, .07), V3(-.11, .205, zR), .007, M.black);
  limb(C, V3(0, .5, .14), V3(0, .76, .3), .034, M.accent);
  limb(C, V3(0, .5, .14), V3(0, .76, .3), .018, M.silver);
  // Bancos, cauda, farolim, suporte de matrícula
  mk(roundBox(.27, .08, .36, .035), M.seat, C, 0, .86, .18, -0.06, 0, 0);
  mk(roundBox(.2, .07, .2, .03), M.seat, C, 0, .93, .46, -0.15, 0, 0);
  mk(roundBox(.2, .09, .26, .04), M.dark, C, 0, .87, .5, -0.18, 0, 0);
  [-1, 1].forEach(s => mk(roundBox(.03, .1, .38, .04), M.paint, C, s * .1, .85, .38, -0.14, 0, 0));
  mk(BOX(.11, .03, .025), M.tail, C, 0, .9, .63);
  limb(C, V3(0, .8, .55), V3(0, .62, .86), .022, M.black);
  mk(BOX(.22, .16, .02), M.black, C, 0, .6, .885, -0.25, 0, 0);
  mk(new THREE.PlaneGeometry(.2, .14), M.plate, C, 0, .6, .897, -0.25, 0, 0);
  [-1, 1].forEach(s => {
    limb(C, V3(s * .04, .67, .82), V3(s * .14, .69, .85), .007, M.black);
    mk(BOX(.04, .022, .03), M.amber, C, s * .155, .69, .855);
    limb(C, V3(s * .12, .4, .22), V3(s * .2, .4, .22), .012, M.silver);
    limb(C, V3(s * .12, .5, .48), V3(s * .19, .5, .5), .01, M.silver);
  });
  mk(BOX(.06, .03, .01), standard(0x8a0a10, { emissive: 0x2a0003 }), C, 0, .52, .88);

  // Piloto (só aparece em corrida)
  const rider = new THREE.Group();
  const suit = standard(0x16181c, { roughness: .8 }), panel = standard(0x2d3239, { roughness: .7 });
  const helmet = M.paint, visor = physical(0x05070a, { metalness: .6, roughness: .05 });
  limb(rider, V3(0, .93, .2), V3(0, 1.36, -.03), .15, suit, 14);
  mk(new THREE.SphereGeometry(.15, 14, 12), suit, rider, 0, .93, .2);
  mk(new THREE.SphereGeometry(.16, 14, 12), suit, rider, 0, 1.36, -.03).scale.set(1.15, .8, .9);
  mk(BOX(.3, .26, .05), panel, rider, 0, 1.18, .16, -0.5, 0, 0);
  limb(rider, V3(0, 1.42, -.04), V3(0, 1.5, -.07), .05, suit);
  mk(new THREE.SphereGeometry(.145, 18, 14), helmet, rider, 0, 1.6, -.08);
  mk(new THREE.SphereGeometry(.148, 18, 10, -Math.PI * .85, Math.PI * .7, Math.PI * .38, Math.PI * .26), visor, rider, 0, 1.6, -.08);
  [-1, 1].forEach(s => {
    limb(rider, V3(s * .17, 1.33, -.02), V3(s * .27, 1.17, -.16), .052, suit);
    limb(rider, V3(s * .27, 1.17, -.16), V3(s * .33, 1.12, -.27), .045, suit);
    mk(new THREE.SphereGeometry(.045, 10, 8), panel, rider, s * .34, 1.12, -.28);
    limb(rider, V3(s * .11, .93, .2), V3(s * .19, .86, -.1), .075, suit);
    limb(rider, V3(s * .19, .86, -.1), V3(s * .18, .47, .17), .058, suit);
    mk(BOX(.09, .1, .22), M.black, rider, s * .18, .43, .2);
  });
  rider.visible = false; C.add(rider); v.rider = rider;

  v.exhausts = [V3(.08, .2, .33)];
  v.dims = { hw: .42, hl: 1.05 };
  v.tailMat = M.tail;
  v.setPaint = p => { setCol(M.paint.color, p.c); setCol(M.accent.color, p.a); setCol(M.rim.color, p.a); };
  finishVehicle(v);
  v.blob.scale.set(1.25, 2.6, 1);
  return v;
}
