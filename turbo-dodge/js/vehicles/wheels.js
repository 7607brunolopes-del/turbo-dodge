'use strict';

// =====================================================================
// RODAS (pneu com perfil arredondado, jante com raios em Y, disco e pinça)
// =====================================================================
function buildWheel(o) {
  const root = new THREE.Group(), steer = new THREE.Group(), spin = new THREE.Group(), vis = new THREE.Group(), fixed = new THREE.Group();
  root.add(steer); steer.add(spin); steer.add(fixed); spin.add(vis);
  const R = o.R, W = o.W, rr = o.rimR, hw = W / 2;
  const pts = [];
  if (o.bike) {
    pts.push(new THREE.Vector2(rr - 0.004, -hw * .7));
    for (let i = 0; i <= 12; i++) { const a = -Math.PI / 2 + i / 12 * Math.PI; pts.push(new THREE.Vector2(R - hw + Math.cos(a) * hw, Math.sin(a) * hw)); }
    pts.push(new THREE.Vector2(rr - 0.004, hw * .7));
  } else {
    const sh = Math.min(0.05, hw * .4);
    pts.push(new THREE.Vector2(rr - 0.008, -hw * .86));
    pts.push(new THREE.Vector2(R - sh - 0.05, -hw));
    for (let i = 0; i <= 6; i++) { const a = -Math.PI / 2 + i / 6 * Math.PI / 2; pts.push(new THREE.Vector2(R - sh + Math.cos(a) * sh, -hw + sh + Math.sin(a) * sh)); }
    for (let i = 0; i <= 6; i++) { const a = i / 6 * Math.PI / 2; pts.push(new THREE.Vector2(R - sh + Math.cos(a) * sh, hw - sh + Math.sin(a) * sh)); }
    pts.push(new THREE.Vector2(R - sh - 0.05, hw));
    pts.push(new THREE.Vector2(rr - 0.008, hw * .86));
  }
  const tg = new THREE.LatheGeometry(pts, 48); tg.rotateZ(-Math.PI / 2);
  mk(tg, o.tireMat, vis);

  // Jante: tambor interior, aro exterior e raios
  const barrel = new THREE.CylinderGeometry(rr, rr, W * .86, 40, 1, true); barrel.rotateZ(Math.PI / 2);
  mk(barrel, o.innerMat, vis);
  const face = o.bike ? 0 : W * .34;
  const lip = new THREE.TorusGeometry(rr - 0.006, o.bike ? 0.009 : 0.013, 8, 48); lip.rotateY(Math.PI / 2);
  if (o.bike) { mk(lip, o.rimMat, vis, -W * .38, 0, 0); mk(lip, o.rimMat, vis, W * .38, 0, 0); }
  else mk(lip, o.rimMat, vis, W * .42, 0, 0);
  const len = rr - 0.07, n = o.spokes || 5;
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2;
    (o.twin ? [-0.12, 0.12] : [0]).forEach(off => {
      const ang = a + off;
      const g = BOX(o.bike ? 0.022 : 0.032, len, o.bike ? 0.022 : 0.04);
      mk(g, o.rimMat, vis, face, Math.cos(ang) * (0.065 + len / 2), Math.sin(ang) * (0.065 + len / 2), ang, 0, 0);
    });
  }
  const hub = new THREE.CylinderGeometry(o.bike ? 0.05 : 0.08, o.bike ? 0.05 : 0.09, o.bike ? W * .9 : 0.05, 20); hub.rotateZ(Math.PI / 2);
  mk(hub, o.rimMat, vis, face, 0, 0);
  if (!o.bike) {
    const cap = new THREE.CylinderGeometry(0.035, 0.035, 0.02, 16); cap.rotateZ(Math.PI / 2);
    mk(cap, o.capMat, vis, face + 0.03, 0, 0);
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2, nut = new THREE.CylinderGeometry(0.012, 0.012, 0.02, 6); nut.rotateZ(Math.PI / 2);
      mk(nut, o.discMat, vis, face + 0.025, Math.cos(a) * 0.058, Math.sin(a) * 0.058);
    }
  }
  // Discos de travão (rodam) e pinças (fixas)
  const discR = o.discR || rr * .8;
  (o.discs || [W * .06]).forEach(dx => {
    const dg = new THREE.CylinderGeometry(discR, discR, 0.02, 40); dg.rotateZ(Math.PI / 2);
    mk(dg, o.discMat, vis, dx, 0, 0);
    const hat = new THREE.CylinderGeometry(discR * .45, discR * .45, 0.024, 24); hat.rotateZ(Math.PI / 2);
    mk(hat, o.innerMat, vis, dx, 0, 0);
  });
  (o.calipers || [{ x: W * .1, a: 0.75 }]).forEach(c => {
    const cr = discR - 0.03;
    mk(BOX(o.bike ? 0.045 : 0.07, o.bike ? 0.12 : 0.2, o.bike ? 0.06 : 0.09), o.caliperMat, fixed, c.x, Math.sin(c.a) * cr, Math.cos(c.a) * cr, -c.a, 0, 0);
  });
  if (o.sprocket) {
    const sg = new THREE.CylinderGeometry(o.sprocket.r, o.sprocket.r, 0.012, 30); sg.rotateZ(Math.PI / 2);
    mk(sg, o.innerMat, vis, o.sprocket.x, 0, 0);
  }
  return { root, steer, spin, vis, fixed, R, front: false, side: 1 };
}
