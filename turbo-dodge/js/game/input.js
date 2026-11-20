'use strict';

// =====================================================================
// ENTRADAS (teclado e toque)
// =====================================================================
function setupInput() {
  const map = { a: 'left', arrowleft: 'left', d: 'right', arrowright: 'right', w: 'accelerate', arrowup: 'accelerate', s: 'brake', arrowdown: 'brake', ' ': 'boost' };
  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (map[k] && (gameState === 'PLAYING' || gameState === 'COUNTDOWN')) { keys[map[k]] = true; e.preventDefault(); }
    if (e.repeat) return;
    if (k === 'f') toggleFullscreen();
    if (k === 'm') toggleAudio();
    if (k === 'p' || k === 'escape') togglePause();
    if (gameState === 'MENU') {
      if (k === 'enter') startRace();
      if (k === 'q') { setAutoRotate(false); tt.hold = -1; }
      if (k === 'e') { setAutoRotate(false); tt.hold = 1; }
      const views = ['front', 'rear', 'left', 'right', 'three', 'top'];
      if (k >= '1' && k <= '6') setView(views[+k - 1]);
    } else if (gameState === 'GAMEOVER' && k === 'enter') restartRace();
  });
  window.addEventListener('keyup', e => {
    const k = e.key.toLowerCase();
    if (map[k]) keys[map[k]] = false;
    if (k === 'q' || k === 'e') tt.hold = 0;
  });
  window.addEventListener('blur', () => { Object.keys(keys).forEach(k => keys[k] = false); tt.hold = 0; });
  const touch = (id, key) => {
    const el = $(id);
    el.addEventListener('pointerdown', e => { e.preventDefault(); keys[key] = true; });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => el.addEventListener(ev, () => keys[key] = false));
  };
  touch('t-left', 'left'); touch('t-right', 'right'); touch('t-boost', 'boost'); touch('t-brake', 'brake');
  document.querySelectorAll('.sound-btn').forEach(b => b.addEventListener('click', toggleAudio));
  document.querySelectorAll('#diff-seg button').forEach(b => b.addEventListener('click', () => { sounds.init(); setDifficulty(b.dataset.d); sounds.playClick(); }));
  ['sens-slider', 'p-sens-slider'].forEach(id => $(id).addEventListener('input', e => setSensitivity(e.target.value)));
  $('rev-btn').addEventListener('click', () => sounds.preview(current.def.sound));
}
