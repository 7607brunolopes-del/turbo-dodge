'use strict';

// ---------------------------------------------------------------------
// PARTÍCULAS (faíscas e poeira) – desaparecem antes de chegarem à câmara
// ---------------------------------------------------------------------
const fx = [];
function initFX() {
  for (let i = 0; i < 90; i++) {
    const m = new THREE.SpriteMaterial({ map: TEX.spark, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const s = new THREE.Sprite(m); s.visible = false; rScene.add(s);
    fx.push({ s, life: 0, max: 1, vx: 0, vy: 0, vz: 0, size: .2, grav: 0, world: 1 });
  }
}
function emit(x, y, z, o) {
  const p = fx.find(q => q.life <= 0); if (!p) return;
  p.life = p.max = o.life; p.vx = o.vx; p.vy = o.vy; p.vz = o.vz; p.size = o.size; p.grav = o.grav || 0; p.world = o.world == null ? 1 : o.world;
  p.s.material.map = o.smoke ? TEX.smoke : TEX.spark;
  p.s.material.blending = o.smoke ? THREE.NormalBlending : THREE.AdditiveBlending;
  p.s.material.color.setHex(o.color);
  p.s.position.set(x, y, z); p.s.visible = true;
}
function updateFX(dt, worldSpeed) {
  fx.forEach(p => {
    if (p.life <= 0) return;
    p.life -= dt;
    p.vy -= p.grav * dt;
    p.s.position.x += p.vx * dt; p.s.position.y = Math.max(.02, p.s.position.y + p.vy * dt);
    p.s.position.z += (p.vz + worldSpeed * p.world) * dt;
    const k = Math.max(0, p.life / p.max);
    p.s.material.opacity = k;
    const sc = p.size * (p.grav ? 1 : (1.8 - k * .8));
    p.s.scale.set(sc, sc, 1);
    if (p.life <= 0 || p.s.position.z > 5) { p.life = 0; p.s.visible = false; }
  });
}
function clearFX() { fx.forEach(p => { p.life = 0; p.s.visible = false; }); }
