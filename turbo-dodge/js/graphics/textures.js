'use strict';

// =====================================================================
// TEXTURAS GERADAS POR CÓDIGO
// =====================================================================
const TEX = {};
function makeCanvas(w, h, draw) { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; }
function canvasTex(c, srgb) { const t = new THREE.CanvasTexture(c); if (srgb !== false) t.encoding = THREE.sRGBEncoding; t.anisotropy = 8; return t; }

function initTextures() {
  // Fibra de carbono (sarja)
  TEX.carbon = canvasTex(makeCanvas(64, 64, (g, w, h) => {
    g.fillStyle = '#0f1114'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const odd = (x + y) % 2;
      const gr = g.createLinearGradient(x * 8, y * 8, x * 8 + (odd ? 8 : 0), y * 8 + (odd ? 0 : 8));
      gr.addColorStop(0, '#16191d'); gr.addColorStop(.5, '#2b3036'); gr.addColorStop(1, '#121417');
      g.fillStyle = gr; g.fillRect(x * 8 + .5, y * 8 + .5, 7, 7);
    }
  }));
  TEX.carbon.wrapS = TEX.carbon.wrapT = THREE.RepeatWrapping; TEX.carbon.repeat.set(3, 3);

  // Grelha em favo de mel
  TEX.mesh = canvasTex(makeCanvas(128, 128, (g, w, h) => {
    g.fillStyle = '#030405'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#2a2f36'; g.lineWidth = 2.2;
    const r = 8;
    for (let row = 0, y = 0; y < h + r * 2; row++, y += r * 1.5) {
      for (let x = (row % 2) * r * .866; x < w + r * 2; x += r * 1.732) {
        g.beginPath();
        for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
        g.closePath(); g.stroke();
      }
    }
  }));
  TEX.mesh.wrapS = TEX.mesh.wrapT = THREE.RepeatWrapping; TEX.mesh.repeat.set(5, 2);

  // Matrícula portuguesa
  const plate = (w, h, twoLines) => canvasTex(makeCanvas(w, h, (g) => {
    g.fillStyle = '#f4f4ef'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#103b9b'; g.fillRect(0, 0, w * .1, h);
    g.fillStyle = '#f2c500'; g.fillRect(w * .9, 0, w * .1, h);
    g.fillStyle = '#fff'; g.font = `700 ${h * .26}px Inter, Arial`; g.textAlign = 'center'; g.fillText('P', w * .05, h * .86);
    g.strokeStyle = '#222'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, w - 3, h - 3);
    g.fillStyle = '#111'; g.textBaseline = 'middle';
    if (twoLines) { g.font = `700 ${h * .36}px Arial`; g.fillText('TD-26', w * .5, h * .3); g.fillText('PA', w * .5, h * .72); }
    else { g.font = `700 ${h * .68}px Arial`; g.fillText('TD·26·PA', w * .5, h * .54); }
  }));
  TEX.plate = plate(520, 110, false);
  TEX.plateBike = plate(200, 140, true);

  // Emblema vermelho "H"
  TEX.badgeH = canvasTex(makeCanvas(64, 48, (g, w, h) => {
    g.fillStyle = '#c40f1c'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#fff'; g.font = '700 38px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('H', w / 2, h / 2 + 2);
  }));

  // Decalque "MT-07"
  TEX.mtDecal = canvasTex(makeCanvas(256, 96, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#ffffff'; g.font = 'italic 800 64px "Barlow Condensed", Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('MT-07', w / 2, h / 2 + 4);
  }));

  // Sombra suave de contacto
  TEX.blob = canvasTex(makeCanvas(128, 128, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, 'rgba(0,0,0,0.85)'); gr.addColorStop(.55, 'rgba(0,0,0,0.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }), false);

  // Faísca / brilho
  TEX.spark = canvasTex(makeCanvas(64, 64, (g, w, h) => {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.25, 'rgba(255,220,160,.9)'); gr.addColorStop(1, 'rgba(255,120,40,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }), false);

  TEX.smoke = canvasTex(makeCanvas(64, 64, (g) => {
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,.7)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  }), false);

  // Riscas vermelhas/brancas refletoras
  TEX.chevron = canvasTex(makeCanvas(256, 32, (g, w, h) => {
    g.fillStyle = '#f2f2f2'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#d3121e';
    for (let x = -h; x < w + h; x += 32) { g.beginPath(); g.moveTo(x, h); g.lineTo(x + 16, h); g.lineTo(x + 16 + h, 0); g.lineTo(x + h, 0); g.closePath(); g.fill(); }
  }));
}
