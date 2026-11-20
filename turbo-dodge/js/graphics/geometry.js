'use strict';

// =====================================================================
// GEOMETRIA: CARROÇARIA "LOFTED" (secções superelípticas ao longo do carro)
// =====================================================================
function sampleKeys(keys, count) {
  const out = [], n = keys.length, fields = Object.keys(keys[0]);
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1) * (n - 1), k = Math.min(n - 2, Math.floor(t)), f = t - k;
    const p0 = keys[Math.max(0, k - 1)], p1 = keys[k], p2 = keys[k + 1], p3 = keys[Math.min(n - 1, k + 2)];
    const o = {};
    fields.forEach(fl => {
      const a = p0[fl], b = p1[fl], c = p2[fl], d = p3[fl];
      o[fl] = 0.5 * ((2 * b) + (-a + c) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (-a + 3 * b - 3 * c + d) * f * f * f);
    });
    out.push(o);
  }
  return out;
}
function stationAt(S, z) {
  if (z <= S[0].z) return S[0];
  for (let i = 0; i < S.length - 1; i++) {
    if (z <= S[i + 1].z) {
      const t = clamp((z - S[i].z) / (S[i + 1].z - S[i].z), 0, 1), o = {};
      for (const k in S[i]) o[k] = lerp(S[i][k], S[i + 1][k], t);
      return o;
    }
  }
  return S[S.length - 1];
}
function ringPoints(s, seg) {
  const pts = [], e = 2 / s.n;
  for (let i = 0; i < seg; i++) {
    const t = i / seg * Math.PI * 2, c = Math.cos(t), si = Math.sin(t);
    const cx = Math.sign(c) * Math.pow(Math.abs(c), e), sy = Math.sign(si) * Math.pow(Math.abs(si), e);
    const h = si >= 0 ? (s.yt - s.ym) : (s.ym - s.yb);
    let x = s.w * cx;
    if (si > 0) x *= 1 - s.tp * si * si;
    pts.push([x, s.ym + h * sy, s.z]);
  }
  return pts;
}
function loftGeometry(stations, seg) {
  const rings = stations.map(s => ringPoints(s, seg)), pos = [], idx = [], R = rings.length;
  rings.forEach(r => r.forEach(p => pos.push(p[0], p[1], p[2])));
  for (let i = 0; i < R - 1; i++) for (let j = 0; j < seg; j++) {
    const a = i * seg + j, b = i * seg + (j + 1) % seg, c = (i + 1) * seg + j, d = (i + 1) * seg + (j + 1) % seg;
    idx.push(a, b, c, b, d, c);
  }
  [[0, -1], [R - 1, 1]].forEach(([ri, dir]) => {
    const base = pos.length / 3, r = rings[ri];
    let cx = 0, cy = 0; r.forEach(p => { cx += p[0]; cy += p[1]; });
    r.forEach(p => pos.push(p[0], p[1], p[2]));
    pos.push(cx / seg, cy / seg, r[0][2]);
    const ci = base + seg;
    for (let j = 0; j < seg; j++) { const a = base + j, b = base + (j + 1) % seg; if (dir < 0) idx.push(ci, b, a); else idx.push(ci, a, b); }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ---------- Ajudantes de construção ----------
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const BOX = (w, h, d) => new THREE.BoxGeometry(w, h, d);
function mk(geo, mat, parent, x, y, z, rx, ry, rz) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x || 0, y || 0, z || 0); m.rotation.set(rx || 0, ry || 0, rz || 0);
  parent.add(m); return m;
}
function limb(parent, a, b, r, mat, seg) {
  const dir = new THREE.Vector3().subVectors(b, a), len = dir.length();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg || 10), mat);
  m.position.copy(a).addScaledVector(dir, 0.5);
  m.quaternion.setFromUnitVectors(V3(0, 1, 0), dir.normalize());
  parent.add(m); return m;
}
function roundRectShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function frameGeo(w, h, r, t, depth) {
  const s = roundRectShape(w, h, r);
  s.holes.push(roundRectShape(w - 2 * t, h - 2 * t, Math.max(0.004, r - t)));
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 8 });
  g.translate(0, 0, -depth / 2); return g;
}
// Caixa com cantos arredondados no perfil lateral (comprimento d em z, altura h em y, largura w em x)
function roundBox(w, h, d, r) {
  const g = new THREE.ExtrudeGeometry(roundRectShape(d, h, Math.min(r, h / 2 - 0.001, d / 2 - 0.001)), {
    depth: w - 0.02, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2, curveSegments: 6
  });
  g.translate(0, 0, -(w - 0.02) / 2); g.rotateY(Math.PI / 2); g.computeVertexNormals();
  return g;
}
// Cores em hex são sRGB: convertemos para linear para ficarem iguais às amostras da interface
const col = h => new THREE.Color(h).convertSRGBToLinear();
const setCol = (c, h) => c.setHex(h).convertSRGBToLinear();
const physical = (color, o) => new THREE.MeshPhysicalMaterial(Object.assign({ color: col(color), metalness: .5, roughness: .3, clearcoat: 1, clearcoatRoughness: .06 }, o || {}));
const standard = (color, o) => new THREE.MeshStandardMaterial(Object.assign({ color: col(color), metalness: .3, roughness: .5 }, o || {}));
const glow = (color) => new THREE.MeshBasicMaterial({ color: col(color), toneMapped: false });
