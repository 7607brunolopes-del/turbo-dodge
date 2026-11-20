'use strict';

// =====================================================================
// MINIATURAS DOS VEÍCULOS (renderizadas na própria garagem)
// =====================================================================
function renderThumbs() {
  const w = 480, h = 270, size = renderer.getSize(new THREE.Vector2());
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.fov = 34; camera.updateProjectionMatrix();
  turntable.rotation.y = 0;
  VEHICLE_ORDER.forEach(id => {
    const d = VEHICLES[id], v = vehicles[id];
    showOnTurntable(v);
    const r = d.cam.radius * .95, th = -2.3, ph = .14;
    camera.position.set(Math.sin(th) * Math.cos(ph) * r, d.cam.ty + Math.sin(ph) * r, Math.cos(th) * Math.cos(ph) * r);
    camera.lookAt(0, d.cam.ty * .85, 0);
    renderer.render(gScene, camera);
    d.thumb = renderer.domElement.toDataURL('image/jpeg', .86);
  });
  renderer.setSize(size.x, size.y, false);
  camera.aspect = size.x / size.y; camera.fov = 40; camera.updateProjectionMatrix();
}
