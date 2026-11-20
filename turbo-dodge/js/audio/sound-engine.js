'use strict';

// =====================================================================
// SOM DO MOTOR (síntese Web Audio)
// =====================================================================
const ENGINE_PROFILES = {
  // BMW M4: 6 cilindros em linha biturbo, encorpado e rouco
  m4:    { mode: 'piston', cyl: 6, idle: 850, max: 7200, gears: 8, vol: .17, harm: [1, .75, .6, .4, .32, .22, .16, .12, .09, .06], sub: .25, rough: .35, noise: .10, noiseF: 1800, lp: 900, lpMax: 4800, drive: 1.6, pops: true },
  // Civic Type R: 4 cilindros turbo, rasgado e agudo
  civic: { mode: 'piston', cyl: 4, idle: 900, max: 7000, gears: 6, vol: .16, harm: [1, .55, .75, .4, .38, .3, .22, .17, .12, .1], sub: .12, rough: .3, noise: .20, noiseF: 2600, lp: 1200, lpMax: 6000, drive: 1.2, pops: true },
  // MT-07: bicilíndrica crossplane (270°), irregular e grave
  mt07:  { mode: 'piston', cyl: 2, idle: 1300, max: 10000, gears: 6, vol: .16, harm: [1, .9, .72, .55, .5, .38, .3, .22, .16, .12], sub: .18, rough: .5, noise: .18, noiseF: 2300, lp: 1300, lpMax: 6500, drive: 2.2, pops: true }
};

// Caixa de velocidades simulada: devolve mudança e rotação normalizada
function drivetrain(p, ratio, boosting) {
  const n = clamp(ratio, 0, 1.25);
  const w = 1.25 / p.gears;
  const g = Math.min(p.gears - 1, Math.floor(n / w));
  const frac = Math.min(1, (n - g * w) / w);
  let r = 0.38 + 0.62 * Math.pow(frac, 0.85);
  if (n < 0.02) r = 0.05;
  if (boosting) r = Math.min(1, r + 0.05);
  return { gear: g, rpmNorm: r };
}

class SoundEngine {
  constructor() {
    this.ctx = null; this.isMuted = store.get('td3d_muted', false); this.profileId = 'm4'; this.profile = null;
    this.nodes = []; this.oscList = []; this.engineGain = null; this.filter = null; this.noiseBand = null;
    this.noiseGain = null; this.jitterGain = null; this.noiseBuf = null; this.waveCache = {};
    this.lastGear = 0; this.shiftUntil = 0; this.rumbleGain = null; this._preview = null;
  }
  init() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); this.makeNoise(); }
      catch (e) { console.warn('Web Audio não suportado'); return; }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  makeNoise() {
    const len = this.ctx.sampleRate * 2, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
  }
  driveCurve(drive) {
    const n = 512, c = new Float32Array(n);
    for (let i = 0; i < n; i++) { const x = (i * 2) / n - 1; c[i] = Math.tanh(x * (1 + drive * 1.6)); }
    return c;
  }
  wave(id, p) {
    if (this.waveCache[id]) return this.waveCache[id];
    const real = new Float32Array(p.harm.length + 1), imag = new Float32Array(p.harm.length + 1);
    p.harm.forEach((a, i) => { imag[i + 1] = a; });
    return (this.waveCache[id] = this.ctx.createPeriodicWave(real, imag));
  }
  startEngineSound() {
    if (!this.ctx || this.isMuted) return;
    this.stopEngineSound();
    try {
      const ctx = this.ctx, t = ctx.currentTime, id = this.profileId, p = ENGINE_PROFILES[id];
      this.profile = p; this.lastGear = 0; this.shiftUntil = 0;
      const comp = ctx.createDynamicsCompressor();
      this.engineGain = ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.0001, t);
      this.engineGain.gain.linearRampToValueAtTime(p.vol, t + 0.25);
      this.engineGain.connect(comp); comp.connect(ctx.destination);
      const mix = ctx.createGain();
      this.filter = ctx.createBiquadFilter(); this.filter.type = 'lowpass'; this.filter.frequency.value = p.lp; this.filter.Q.value = 0.9;
      let tail = mix;
      if (p.drive > 0) { const sh = ctx.createWaveShaper(); sh.curve = this.driveCurve(p.drive); sh.oversample = '2x'; mix.connect(sh); tail = sh; this.nodes.push(sh); }
      tail.connect(this.filter); this.filter.connect(this.engineGain);
      this.nodes.push(comp, this.engineGain, mix, this.filter);
      this.oscList = [];
      const wave = this.wave(id, p);
      const addOsc = (type, mult, gain, detune) => {
        const osc = ctx.createOscillator();
        if (type === 'wave') osc.setPeriodicWave(wave); else osc.type = type;
        osc.detune.value = detune || 0;
        const g = ctx.createGain(); g.gain.value = gain;
        osc.connect(g); g.connect(mix); osc.start();
        this.oscList.push({ osc, mult }); this.nodes.push(osc, g);
      };
      addOsc('wave', 1, 1.0, 0);
      if (p.rough > 0) addOsc('wave', 1, p.rough, 18);
      if (p.sub > 0) addOsc('sine', 0.5, p.sub, 0);
      const lfo = ctx.createOscillator(); lfo.frequency.value = 4.7;
      this.jitterGain = ctx.createGain(); this.jitterGain.gain.value = 0.5;
      lfo.connect(this.jitterGain); this.oscList.forEach(o => this.jitterGain.connect(o.osc.frequency)); lfo.start();
      this.nodes.push(lfo, this.jitterGain);
      const noise = ctx.createBufferSource(); noise.buffer = this.noiseBuf; noise.loop = true;
      this.noiseBand = ctx.createBiquadFilter(); this.noiseBand.type = 'bandpass'; this.noiseBand.frequency.value = p.noiseF; this.noiseBand.Q.value = 0.8;
      this.noiseGain = ctx.createGain(); this.noiseGain.gain.value = p.noise;
      noise.connect(this.noiseBand); this.noiseBand.connect(this.noiseGain); this.noiseGain.connect(this.engineGain); noise.start();
      this.nodes.push(noise, this.noiseBand, this.noiseGain);
      // Vibração da zebra (berma)
      const rOsc = ctx.createOscillator(); rOsc.type = 'square'; rOsc.frequency.value = 32;
      const rLp = ctx.createBiquadFilter(); rLp.type = 'lowpass'; rLp.frequency.value = 220;
      this.rumbleGain = ctx.createGain(); this.rumbleGain.gain.value = 0;
      rOsc.connect(rLp); rLp.connect(this.rumbleGain); this.rumbleGain.connect(comp); rOsc.start();
      this.nodes.push(rOsc, rLp, this.rumbleGain);
      this.update(0.05, 0, false);
    } catch (e) { console.warn('Erro no som do motor', e); }
  }
  update(rpmNorm, gearIdx, boosting) {
    if (!this.ctx || !this.profile || !this.engineGain) return;
    const p = this.profile, t = this.ctx.currentTime;
    if (gearIdx > this.lastGear) { this.shiftUntil = t + 0.13; if (p.pops && Math.random() < 0.8) this.pop(); }
    this.lastGear = gearIdx;
    const rpm = p.idle + (p.max - p.idle) * rpmNorm;
    const f0 = (rpm / 60) * (p.cyl / 2);
    this.oscList.forEach(o => o.osc.frequency.setTargetAtTime(f0 * o.mult, t, 0.05));
    if (this.jitterGain) this.jitterGain.gain.setTargetAtTime(f0 * 0.01, t, 0.05);
    this.filter.frequency.setTargetAtTime(p.lp + (p.lpMax - p.lp) * rpmNorm + (boosting ? 600 : 0), t, 0.08);
    this.noiseBand.frequency.setTargetAtTime(p.noiseF * (0.5 + rpmNorm), t, 0.08);
    this.noiseGain.gain.setTargetAtTime(p.noise * (0.4 + 0.6 * rpmNorm), t, 0.08);
    const shifting = t < this.shiftUntil;
    const vol = p.vol * (0.5 + 0.5 * rpmNorm) * (boosting ? 1.2 : 1) * (shifting ? 0.2 : 1);
    this.engineGain.gain.setTargetAtTime(vol, t, shifting ? 0.01 : 0.08);
  }
  setRumble(level) { if (this.rumbleGain) this.rumbleGain.gain.setTargetAtTime(level * 0.22, this.ctx.currentTime, 0.04); }
  pop() {
    if (!this.ctx || this.isMuted) return;
    const ctx = this.ctx, t = ctx.currentTime + 0.05, src = ctx.createBufferSource(); src.buffer = this.noiseBuf;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 450 + Math.random() * 300; bp.Q.value = 1.2;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.32, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    src.connect(bp); bp.connect(g); g.connect(ctx.destination); src.start(t, Math.random() * 1.5); src.stop(t + 0.1);
  }
  stopEngineSound() {
    this.nodes.forEach(n => { try { if (n.stop) n.stop(); } catch (e) {} try { n.disconnect(); } catch (e) {} });
    this.nodes = []; this.oscList = []; this.engineGain = null; this.filter = null; this.noiseBand = null;
    this.noiseGain = null; this.jitterGain = null; this.rumbleGain = null; this.profile = null;
  }
  // Pré-visualização na garagem: arranque com mudanças
  preview(id) {
    if (this.isMuted) return;
    this.init(); if (!this.ctx) return;
    this.cancelPreview();
    this.profileId = id; this.startEngineSound();
    const p = ENGINE_PROFILES[id]; let r = 0.02;
    const timer = setInterval(() => { r += 0.04; const d = drivetrain(p, r, false); this.update(d.rpmNorm, d.gear, false); }, 45);
    const stop = setTimeout(() => { this.cancelPreview(); this.stopEngineSound(); }, 2200);
    this._preview = { timer, stop };
  }
  cancelPreview() { if (this._preview) { clearInterval(this._preview.timer); clearTimeout(this._preview.stop); this._preview = null; } }
  burst(dur, f0, f1, gain, type) {
    if (!this.ctx || this.isMuted) return;
    const ctx = this.ctx, t = ctx.currentTime, src = ctx.createBufferSource(); src.buffer = this.noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = type || 'lowpass'; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(ctx.destination); src.start(t, Math.random()); src.stop(t + dur);
  }
  tone(freq, dur, gain, type, freq2) {
    if (!this.ctx || this.isMuted) return;
    const ctx = this.ctx, t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t); if (freq2) o.frequency.exponentialRampToValueAtTime(freq2, t + dur);
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(t + dur);
  }
  playCrash() { this.burst(0.7, 1400, 40, 0.65); this.burst(0.35, 4000, 800, 0.25, 'bandpass'); }
  playPickup() { this.tone(523, 0.16, 0.18, 'sine', 1046); }
  playSlick() { this.tone(220, 0.3, 0.25, 'triangle', 110); }
  playNear() { this.tone(880, 0.12, 0.08, 'triangle', 1320); }
  playBeep(high) { this.tone(high ? 1046 : 523, high ? 0.45 : 0.18, 0.2, 'square'); }
  playClick() { this.tone(1400, 0.04, 0.05, 'square'); }
}
const sounds = new SoundEngine();
