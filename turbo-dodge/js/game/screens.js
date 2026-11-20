'use strict';

// =====================================================================
// TRANSIÇÕES DE ECRÃ
// =====================================================================
function showScreen(name) {
  $('garage').classList.toggle('hidden', name !== 'garage');
  $('hud').classList.toggle('hidden', name !== 'hud');
  $('pause').classList.add('hidden');
  $('gameover').classList.add('hidden');
}

function enterGarage() {
  gameState = 'MENU';
  sounds.cancelPreview(); sounds.stopEngineSound();
  clearRaceObjects(); clearFX();
  activeScene = gScene;
  camera.near = .1; camera.far = 120; camera.fov = 40; camera.updateProjectionMatrix();
  showOnTurntable(current);
  $('vignette').classList.remove('boost');
  $('stage').classList.add('grab');
  $('g-record').textContent = Math.floor(highScore).toLocaleString('pt-PT');
  showScreen('garage');
}

function clearRaceObjects() {
  obstacles.forEach(o => rScene.remove(o)); pickups.forEach(p => rScene.remove(p));
  obstacles = []; pickups = [];
}

function startRace() {
  if (gameState !== 'MENU' && gameState !== 'GAMEOVER' && gameState !== 'PAUSED') return;
  sounds.init(); sounds.cancelPreview(); sounds.stopEngineSound();
  clearRaceObjects(); clearFX();
  const d = DIFFICULTIES[difficulty], v = current;
  // Veículo passa para a pista
  v.root.position.set(0, 0, 0); v.root.rotation.set(0, 0, 0); v.chassis.rotation.set(0, 0, 0);
  v.wheels.forEach(w => w.steer.rotation.y = 0);
  if (v.rider) v.rider.visible = true;
  playerRoot.add(v.root); playerRoot.position.set(0, 0, 0); playerRoot.rotation.set(0, 0, 0);
  activeScene = rScene;
  camera.clearViewOffset();
  camera.near = .1; camera.far = 600; camera.fov = 62; camera.updateProjectionMatrix();
  $('stage').classList.remove('grab', 'grabbing');

  // Ambiente (tempestade no extremo)
  if (d.storm) {
    setCol(rScene.fog.color, 0x1a2338); rScene.fog.density = .026; rScene.background.setHex(0x1a2338);
    ambLight.color.setHex(0x6d8fd0); ambLight.intensity = .45; sunLight.intensity = .5;
    skyMesh.material.color.setHex(0x3a4560); groundMat.color.setHex(0x4a5a52);
  } else {
    setCol(rScene.fog.color, 0xd98a72); rScene.fog.density = .0065; rScene.background.setHex(0xe28570);
    ambLight.color.setHex(0xffc9a8); ambLight.intensity = .75; sunLight.intensity = 1.6;
    skyMesh.material.color.setHex(0xffffff); groundMat.color.setHex(0xffffff);
  }
  roadTiles.forEach((t, i) => t.position.z = -i * ROAD.tileLen);

  score = 0; distance = 0; currentSpeed = 0; topKmh = 0; nearMisses = 0;
  playerX = 0; playerVX = 0; yaw = 0; roll = 0; pitch = 0; spawnTimer = -1.2; shake = 0; offroadT = 0; crashLean = 0;
  nitro = 100 * v.def.game.nitroMult; boosting = false;
  Object.keys(keys).forEach(k => keys[k] = false);

  $('h-veh').textContent = v.def.short;
  $('h-diff').textContent = d.name;
  $('h-mult').textContent = 'x' + d.mult.toFixed(1);
  $('controls-tip').style.opacity = 1;
  showScreen('hud');

  sounds.profileId = v.def.sound; sounds.startEngineSound();
  countdownT = 0; lastCount = -1;
  gameState = 'COUNTDOWN';
  updateHUD(0, { gear: -1, rpmNorm: .05 });
}
function restartRace() { if (gameState === 'PAUSED' || gameState === 'GAMEOVER') { gameState = 'GAMEOVER'; startRace(); } }

function togglePause() {
  if (gameState === 'PLAYING' || gameState === 'COUNTDOWN') {
    pausedFrom = gameState; gameState = 'PAUSED';
    sounds.stopEngineSound(); Object.keys(keys).forEach(k => keys[k] = false);
    $('pause').classList.remove('hidden');
  } else if (gameState === 'PAUSED') {
    gameState = pausedFrom; sounds.profileId = current.def.sound; sounds.startEngineSound();
    $('pause').classList.add('hidden');
  }
}
let pausedFrom = 'PLAYING', lastCount = -1;
