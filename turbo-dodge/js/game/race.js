'use strict';

// =====================================================================
// CICLO DE CORRIDA
// =====================================================================
function camRig() { return current.type === 'bike' ? { y: 2.25, z: 5.4, ly: 1.0 } : { y: 2.95, z: 7.6, ly: 1.05 }; }

function updateCountdown(dt) {
  countdownT += dt;
  const n = 3 - Math.floor(countdownT / 0.85);
  if (n !== lastCount) {
    lastCount = n;
    const el = $('countdown');
    if (n > 0) { el.innerHTML = `<span>${n}</span>`; sounds.playBeep(false); }
    else if (n === 0) { el.innerHTML = '<span class="go">JÁ!</span>'; sounds.playBeep(true); }
  }
  // Câmara de apresentação: dá a volta ao veículo e fica atrás dele
  const t = clamp(countdownT / 2.55, 0, 1), e = 1 - Math.pow(1 - t, 3), rig = camRig();
  const ang = lerp(2.3, 0, e), r = lerp(current.def.cam.radius * .85, rig.z, e);
  camera.position.set(Math.sin(ang) * r, lerp(1.2, rig.y, e), Math.cos(ang) * r);
  camera.lookAt(0, lerp(.7, rig.ly, e), lerp(0, -8, e));
  // Acelerar parado faz subir as rotações
  const p = ENGINE_PROFILES[current.def.sound];
  revIdle = damp(revIdle, keys.accelerate ? .85 : .05, keys.accelerate ? 5 : 3, dt);
  sounds.update(revIdle, 0, false);
  updateEnvironment(dt);
  updateHUD(0, { gear: -1, rpmNorm: revIdle });
  if (countdownT >= 2.55) { gameState = 'PLAYING'; currentSpeed = 4; setTimeout(() => { if ($('countdown').textContent === 'JÁ!') $('countdown').innerHTML = ''; }, 600); setTimeout(() => $('controls-tip').style.opacity = 0, 3500); }
}
let revIdle = .05;

function updateEnvironment(dt) {
  sunLight.position.set(playerX + 16, 34, 14);
  sunLight.target.position.set(playerX, 0, -6);
}

function moveWorld(speed, dt, obstacleExtra) {
  if (groundTex) groundTex.offset.y += speed * dt / 5;
  const total = ROAD.tileLen * ROAD.tiles;
  roadTiles.forEach(t => {
    t.position.z += speed * dt;
    // Só recicla quando o troço já está completamente atrás da câmara (sem buracos visíveis)
    if (t.position.z - ROAD.tileLen / 2 > camera.position.z + 4) t.position.z -= total;
  });
  pickups.forEach(p => { p.userData.prevZ = p.position.z; p.position.z += speed * dt; });
  obstacles.forEach(o => { o.userData.prevZ = o.position.z; o.position.z += (speed + obstacleExtra) * dt; });
}

function spawnRow(d) {
  const v = current, pick = () => {
    const r = Math.random();
    return r < .3 ? 'barrier' : r < .55 ? 'cones' : r < .8 ? 'rock' : 'oil';
  };
  const count = Math.random() < d.doubleChance ? 2 : 1, placed = [], z = -170;
  for (let i = 0; i < count; i++) {
    const kind = pick(), o = makeObstacle(kind), hw = o.userData.hw;
    const lim = ROAD.edge - hw - .1;
    let x = 0, ok = false;
    for (let tries = 0; tries < 8 && !ok; tries++) {
      // 40% das vezes aponta para onde o jogador está (inclusive em cima das linhas/berma)
      x = (i === 0 && Math.random() < .4) ? clamp(playerX + (Math.random() - .5) * 1.2, -lim, lim) : (Math.random() * 2 - 1) * lim;
      ok = placed.every(p => Math.abs(p.x - x) - p.hw - hw > v.dims.hw * 2 + 1.2);
    }
    if (!ok) continue;
    o.position.set(x, 0, z - i * (Math.random() * 6)); o.userData.prevZ = o.position.z;
    if (kind === 'barrier' || kind === 'cones') o.rotation.y = (Math.random() - .5) * .15;
    rScene.add(o); obstacles.push(o); placed.push({ x, hw });
  }
  if (Math.random() < .2) {
    const p = makeObstacle('nitro'), lim = ROAD.edge - 1;
    let x = (Math.random() * 2 - 1) * lim;
    if (placed.some(q => Math.abs(q.x - x) < q.hw + 1.5)) x = -x;
    p.position.set(x, 0, z - 25); rScene.add(p); pickups.push(p);
  }
}

function crash(reason) {
  if (gameState !== 'PLAYING') return;
  gameState = 'CRASH'; crashT = 0; crashReason = reason;
  spinVel = (Math.random() < .5 ? -1 : 1) * (2.5 + currentSpeed * .04);
  sounds.setRumble(0); sounds.stopEngineSound(); sounds.playCrash();
  const f = $('flash'); f.style.opacity = '.8'; setTimeout(() => f.style.opacity = '0', 140);
  shake = 1.1;
  for (let i = 0; i < 34; i++) emit(playerX + (Math.random() - .5) * current.dims.hw * 2, .5 + Math.random() * .6, -current.dims.hl + Math.random(), {
    life: .5 + Math.random() * .5, vx: (Math.random() - .5) * 9, vy: 2 + Math.random() * 5, vz: -(Math.random() * 6), size: .25 + Math.random() * .2, grav: 14, color: Math.random() < .5 ? 0xffb347 : 0xfff1c9, world: .3
  });
  $('h-warning').classList.remove('show');
}
let crashReason = '';

function updateCrash(dt) {
  crashT += dt;
  currentSpeed = damp(currentSpeed, 0, 2.2, dt);
  moveWorld(currentSpeed, dt, 0);
  yaw += spinVel * dt; spinVel *= Math.exp(-2.2 * dt);
  playerRoot.rotation.y = yaw;
  if (current.type === 'bike') { crashLean = damp(crashLean, spinVel > 0 ? -1.35 : 1.35, 5, dt); current.chassis.rotation.z = crashLean; }
  updateFX(dt, currentSpeed);
  chaseCamera(dt, false);
  updateEnvironment(dt);
  if (crashT > 1.3) showGameOver();
}

function showGameOver() {
  gameState = 'GAMEOVER';
  const isRecord = score > highScore;
  if (isRecord) { highScore = Math.floor(score); store.set('turbo_dodge_3d_highscore', highScore); }
  $('go-reason').textContent = crashReason;
  $('go-score').textContent = Math.floor(score).toLocaleString('pt-PT');
  $('go-dist').textContent = Math.floor(distance).toLocaleString('pt-PT') + ' m';
  $('go-top').textContent = Math.round(topKmh) + ' km/h';
  $('go-near').textContent = nearMisses;
  $('go-veh').textContent = current.def.short;
  $('go-record').classList.toggle('hidden', !isRecord);
  $('gameover').classList.remove('hidden');
}

function chaseCamera(dt, live) {
  const rig = camRig();
  const fovT = boosting && live ? 74 : 62;
  camera.fov = damp(camera.fov, fovT, 4, dt); camera.updateProjectionMatrix();
  camera.position.x = damp(camera.position.x, playerX * .55, 6, dt);
  camera.position.y = rig.y; camera.position.z = rig.z + (boosting && live ? .5 : 0);
  camera.lookAt(playerX * .4, rig.ly, -8);
  if (shake > 0) {
    camera.position.x += (Math.random() - .5) * shake * .6; camera.position.y += (Math.random() - .5) * shake * .6;
    shake = Math.max(0, shake - dt * 2.5);
  }
}

function updateGame(dt) {
  const d = DIFFICULTIES[difficulty], v = current, g = v.def.game;
  const pHW = v.dims.hw * .9, pHL = v.dims.hl * .92;

  // Nitro
  boosting = keys.boost && nitro > 0;
  nitro = boosting ? Math.max(0, nitro - dt * 34) : Math.min(100 * g.nitroMult, nitro + dt * 10);

  // Velocidade (progressão: fica mais rápido com a distância)
  const progress = 1 + Math.min(.3, distance / 25000);
  let ctrl = 1; if (keys.accelerate) ctrl += .2; if (keys.brake) ctrl -= .4;
  const offroad = Math.abs(playerX) + pHW > ROAD.edge + .05;
  let target = d.speed * g.speedMult * progress * (boosting ? 1.45 : 1) * ctrl * (offroad ? .82 : 1);
  currentSpeed = damp(currentSpeed, target, keys.brake ? 2.6 : 1.6, dt);
  const kmh = speedKmh(currentSpeed, g); topKmh = Math.max(topKmh, kmh);

  distance += currentSpeed * dt;
  score += currentSpeed * dt * d.mult * (boosting ? 1.5 : 1);

  // Direção com inércia independente da taxa de frames
  const accelX = 45 * sensitivity * g.handlingMult;
  if (keys.left) playerVX -= accelX * dt;
  if (keys.right) playerVX += accelX * dt;
  playerVX *= Math.exp(-12 * dt);
  playerX += playerVX * dt;

  // Colisão com o rail: agora o carro bate mesmo
  if (Math.abs(playerX) + pHW >= ROAD.railInner) {
    playerX = Math.sign(playerX) * (ROAD.railInner - pHW);
    crash('Bateu no rail de proteção'); return;
  }

  // Inclinação, rotação e arfagem
  if (v.type === 'bike') { roll = damp(roll, clamp(-playerVX * .07, -.65, .65), 8, dt); v.chassis.rotation.z = roll; }
  else { roll = damp(roll, clamp(playerVX * .006, -.05, .05), 8, dt); v.chassis.rotation.z = roll; }
  pitch = damp(pitch, (keys.brake ? .025 : 0) + (keys.accelerate || boosting ? -.018 : 0), 6, dt);
  v.chassis.rotation.x = pitch;
  yaw = damp(yaw, -playerVX * .018, 10, dt);
  playerRoot.position.x = playerX; playerRoot.rotation.y = yaw;
  v.wheels.forEach(w => {
    w.spin.rotation.x -= Math.min(currentSpeed / w.R, 70) * dt;
    if (w.front && v.type === 'car') w.steer.rotation.y = clamp(-playerVX * .03, -.4, .4);
  });
  v.flames.forEach(f => { f.visible = boosting; if (boosting) f.scale.set(1, 1, .7 + Math.random() * .6); });
  setCol(v.tailMat.color, keys.brake ? 0xff2436 : 0xc80f1a);

  // Berma / fora de pista: vibração, poeira e aviso
  if (offroad) {
    offroadT += dt; shake = Math.max(shake, .12);
    sounds.setRumble(1);
    if (Math.random() < .7) emit(playerX + Math.sign(playerX) * pHW, .15, pHL * .8, { life: .35, vx: Math.sign(playerX) * 2, vy: 1.2, vz: 0, size: .9, color: 0xbfa98e, smoke: true, world: .15 });
  } else { offroadT = 0; sounds.setRumble(0); }
  $('h-warning').classList.toggle('show', offroad);

  // Mundo a andar
  moveWorld(currentSpeed, dt, d.obstacleSpeed);

  // Colisão com obstáculos (AABB com varrimento: não atravessa a alta velocidade)
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i], u = o.userData;
    const zMin = u.prevZ - u.hl, zMax = o.position.z + u.hl;
    const overlapZ = zMax > -pHL && zMin < pHL;
    const gapX = Math.abs(playerX - o.position.x) - (pHW + u.hw);
    if (overlapZ && gapX < 0) {
      if (u.type === 'oil') {
        playerVX += (Math.random() < .5 ? -1 : 1) * 22; sounds.playSlick(); shake = .4;
        rScene.remove(o); obstacles.splice(i, 1); continue;
      }
      crash(u.type === 'rock' ? 'Embateu numa rocha' : u.type === 'cones' ? 'Atropelou os cones' : 'Embateu na barreira');
      return;
    }
    if (!u.passed && o.position.z - u.hl > pHL) {
      u.passed = true;
      if (u.type !== 'oil' && gapX < .7) { nearMisses++; score += 100; sounds.playNear(); showToast('QUASE! +100'); }
    }
    if (o.position.z > 16) { rScene.remove(o); obstacles.splice(i, 1); }
  }
  for (let i = pickups.length - 1; i >= 0; i--) {
    const p = pickups[i], u = p.userData;
    u.spin.rotation.y += dt * 3; u.ring.rotation.z += dt * 2; p.position.y = Math.sin(performance.now() * .004) * .08;
    if ((u.prevZ - u.hl) < pHL && (p.position.z + u.hl) > -pHL && Math.abs(playerX - p.position.x) < pHW + u.hw) {
      nitro = Math.min(100 * g.nitroMult, nitro + 40); score += 150; sounds.playPickup(); showToast('NITRO +40%');
      for (let k = 0; k < 14; k++) emit(p.position.x, .7, p.position.z, { life: .4, vx: (Math.random() - .5) * 6, vy: Math.random() * 4, vz: (Math.random() - .5) * 4, size: .3, color: 0x3cc8ff, world: .2 });
      rScene.remove(p); pickups.splice(i, 1); continue;
    }
    if (p.position.z > 16) { rScene.remove(p); pickups.splice(i, 1); }
  }

  // Novos obstáculos
  spawnTimer += dt;
  const interval = d.spawn / Math.sqrt(progress);
  if (spawnTimer >= interval) { spawnTimer = 0; spawnRow(d); }

  // Tempestade (relâmpagos)
  if (d.storm) {
    lightningT += dt;
    if (lightningT > 3 + Math.random() * 4) { lightningT = 0; ambLight.intensity = 2.6; setTimeout(() => ambLight.intensity = .45, 90); }
  }

  updateFX(dt, currentSpeed);
  updateEnvironment(dt);
  chaseCamera(dt, true);

  // Som e HUD
  const dtv = drivetrain(ENGINE_PROFILES[v.def.sound], kmh / g.topKmh, boosting);
  sounds.update(dtv.rpmNorm, dtv.gear, boosting);
  updateHUD(kmh, dtv);
  if (toastT > 0) { toastT -= dt; if (toastT <= 0) $('h-toast').classList.remove('show'); }
  $('vignette').classList.toggle('boost', boosting);
}

function showToast(t) { const el = $('h-toast'); el.textContent = t; el.classList.add('show'); toastT = 1.1; }

// ---------- HUD ----------
const hudCache = {};
function setText(id, val) { if (hudCache[id] !== val) { hudCache[id] = val; $(id).textContent = val; } }
function buildRpm() { $('h-rpm').innerHTML = Array.from({ length: 24 }, (_, i) => `<i class="${i >= 20 ? 'r' : ''}"></i>`).join(''); }
let rpmSegs = null, lastLit = -1, lastShift = null;
function updateHUD(kmh, dtv) {
  setText('h-speed', String(Math.round(kmh)));
  setText('h-gear', dtv.gear < 0 ? 'N' : String(dtv.gear + 1));
  setText('h-score', Math.floor(score).toLocaleString('pt-PT'));
  setText('h-dist', Math.floor(distance).toLocaleString('pt-PT') + ' m');
  const max = 100 * current.def.game.nitroMult, pct = Math.round(nitro / max * 100);
  if (hudCache.nitro !== pct) { hudCache.nitro = pct; $('h-nitro').style.width = pct + '%'; $('h-nitro-txt').textContent = pct + '%'; }
  if (!rpmSegs) rpmSegs = [...$('h-rpm').children];
  const lit = Math.round(dtv.rpmNorm * 24);
  if (lit !== lastLit) { lastLit = lit; rpmSegs.forEach((s, i) => s.classList.toggle('on', i < lit)); }
  const sh = dtv.rpmNorm > .93;
  if (sh !== lastShift) { lastShift = sh; $('h-rpm').classList.toggle('shift', sh); }
}
