'use strict';

// =====================================================================
// INTERFACE DA GARAGEM
// =====================================================================
function buildVehicleCards() {
  const wrap = $('vehicle-cards'); wrap.innerHTML = '';
  VEHICLE_ORDER.forEach(id => {
    const d = VEHICLES[id], b = document.createElement('button');
    b.className = 'vcard'; b.id = 'card-' + id;
    b.innerHTML = `<img alt="${d.short}" src="${d.thumb || ''}"><div class="meta"><div><div class="mk">${d.make}</div><div class="md">${d.model}</div></div><span class="cls">${d.cls}</span></div>`;
    b.addEventListener('click', () => { sounds.init(); selectVehicle(id); });
    wrap.appendChild(b);
  });
  $('v-count').textContent = VEHICLE_ORDER.length;
}

function selectVehicle(id, silent) {
  selectedId = id;
  const d = VEHICLES[id];
  current = vehicles[id];
  current.setPaint(d.paints[paintIdx[id] || 0]);
  if (gameState === 'MENU' || gameState === 'LOADING') showOnTurntable(current);
  document.querySelectorAll('.vcard').forEach(c => c.classList.toggle('active', c.id === 'card-' + id));
  $('s-brand').textContent = d.make;
  $('s-name').textContent = d.model;
  $('s-tags').innerHTML = d.tags.map(t => `<span>${t}</span>`).join('');
  $('s-grid').innerHTML = d.specs.map(s => `<div><small>${s[0]}</small><b>${s[1]}${s[2] ? `<em>${s[2]}</em>` : ''}</b></div>`).join('');
  $('s-bars').innerHTML = Object.entries(d.stats).map(([k, v]) => `<div class="bar"><span>${k}</span><div class="track"><div class="fill" data-w="${v * 100}"></div></div><b>${Math.round(v * 100)}</b></div>`).join('');
  requestAnimationFrame(() => document.querySelectorAll('#s-bars .fill').forEach(f => f.style.width = f.dataset.w + '%'));
  renderSwatches();
  orbit.tRadius = d.cam.radius;
  if (!silent) sounds.preview(d.sound);
  savePrefs();
}

function renderSwatches() {
  const d = VEHICLES[selectedId], idx = paintIdx[selectedId] || 0, wrap = $('s-swatches');
  wrap.innerHTML = '';
  d.paints.forEach((p, i) => {
    const b = document.createElement('button'), hex = '#' + p.c.toString(16).padStart(6, '0');
    b.className = 'swatch' + (i === idx ? ' active' : ''); b.title = p.n;
    b.style.background = p.a !== undefined ? `linear-gradient(135deg, ${hex} 55%, #${p.a.toString(16).padStart(6, '0')} 55%)` : hex;
    b.addEventListener('click', () => { paintIdx[selectedId] = i; current.setPaint(p); renderSwatches(); sounds.playClick(); savePrefs(); });
    wrap.appendChild(b);
  });
  $('s-paint-name').textContent = d.paints[idx].n;
}

function setDifficulty(d) {
  difficulty = d;
  document.querySelectorAll('#diff-seg button').forEach(b => b.classList.toggle('active', b.dataset.d === d));
  savePrefs();
}
function setSensitivity(v) {
  sensitivity = parseFloat(v);
  ['sens-val', 'p-sens-val'].forEach(id => $(id).textContent = sensitivity.toFixed(1) + 'x');
  ['sens-slider', 'p-sens-slider'].forEach(id => $(id).value = sensitivity);
  savePrefs();
}
function savePrefs() { if (gameState !== 'LOADING') store.set('td3d_prefs', { veh: selectedId, paints: paintIdx, diff: difficulty, sens: sensitivity }); }

function updateSoundButtons() {
  document.querySelectorAll('.sound-btn').forEach(b => b.innerHTML = sounds.isMuted ? '<i class="fa-solid fa-volume-xmark" style="color:var(--accent)"></i>' : '<i class="fa-solid fa-volume-high"></i>');
}
function toggleAudio() {
  sounds.init();
  sounds.isMuted = !sounds.isMuted; store.set('td3d_muted', sounds.isMuted);
  updateSoundButtons();
  if (sounds.isMuted) { sounds.cancelPreview(); sounds.stopEngineSound(); }
  else if (gameState === 'PLAYING' || gameState === 'COUNTDOWN') { sounds.profileId = current.def.sound; sounds.startEngineSound(); }
}
function toggleFullscreen() {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
  else if (document.exitFullscreen) document.exitFullscreen();
}
