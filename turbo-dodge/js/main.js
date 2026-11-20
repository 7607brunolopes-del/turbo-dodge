'use strict';

// =====================================================================
// CICLO PRINCIPAL
// =====================================================================
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  if (gameState === 'MENU') updateGarage(dt);
  else if (gameState === 'COUNTDOWN') updateCountdown(dt);
  else if (gameState === 'PLAYING') updateGame(dt);
  else if (gameState === 'CRASH') updateCrash(dt);
  else if (gameState === 'GAMEOVER') { updateFX(dt, 0); }
  renderer.render(activeScene, camera);
}

const wait = ms => new Promise(r => setTimeout(r, ms));
function setLoader(p, t) { $('loader-fill').style.width = (p * 100) + '%'; $('loader-text').textContent = t; }

window.addEventListener('load', async () => {
  if (typeof THREE === 'undefined') { setLoader(0, 'Não foi possível carregar o Three.js. Verifica a ligação à internet.'); return; }
  try {
    setLoader(.08, 'A iniciar o motor gráfico…'); await wait(30);
    initRenderer(); initTextures();
    setLoader(.25, 'A montar a garagem…'); await wait(30);
    buildGarage();
    setLoader(.45, 'A construir a pista…'); await wait(30);
    buildRace();
    setLoader(.65, 'A construir os veículos…'); await wait(30);
    const prefs = store.get('td3d_prefs', {});
    paintIdx = prefs.paints || {};
    VEHICLE_ORDER.forEach(id => {
      const d = VEHICLES[id], p = d.paints[paintIdx[id] || 0] || d.paints[0];
      vehicles[id] = BUILDERS[id](d, p.c, p.a);
    });
    current = vehicles.m4;
    setLoader(.85, 'A fotografar os veículos…'); await wait(30);
    if (document.fonts && document.fonts.ready) { try { await Promise.race([document.fonts.ready, wait(1500)]); } catch (e) {} }
    renderThumbs();
    buildVehicleCards(); buildRpm();
    setupGarageControls(); setupInput(); updateSoundButtons();
    setDifficulty(prefs.diff && DIFFICULTIES[prefs.diff] ? prefs.diff : 'medio');
    setSensitivity(prefs.sens || 2.5);
    selectVehicle(VEHICLES[prefs.veh] ? prefs.veh : 'm4', true);
    orbit.radius = current.def.cam.radius + 3; orbit.theta = -1.6;
    enterGarage();
    setLoader(1, 'Pronto'); await wait(250);
    $('loader').classList.add('done');
    animate();
  } catch (e) {
    console.error(e);
    setLoader(0, 'Erro ao iniciar: ' + e.message);
  }
});
