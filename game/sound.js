// sound.js — all sound is WebAudio oscillators, no audio files. A tiny
// synth: coin blips, a dial tick while cracking, a rising alarm sting
// when spotted, and a short arpeggio when the getaway lands.

export class Sound {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  tone(freq, dur, type, vol, when = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  coin() { this.tone(880, 0.12, 'sine', 0.12); this.tone(1320, 0.16, 'sine', 0.08, 0.07); }
  tick() { this.tone(1500, 0.04, 'square', 0.05); }
  noise() { this.tone(220, 0.2, 'sawtooth', 0.08); this.tone(330, 0.2, 'triangle', 0.06, 0.1); }
  loop() { this.tone(660, 0.1, 'square', 0.07); this.tone(990, 0.14, 'square', 0.07, 0.09); }
  crowbar() { this.tone(180, 0.18, 'sawtooth', 0.1); }
  spotted() { this.tone(520, 0.16, 'square', 0.1); this.tone(392, 0.22, 'square', 0.1, 0.14); }
  crack() { this.tone(1046, 0.2, 'sine', 0.12); this.tone(1568, 0.3, 'sine', 0.1, 0.12); }
  win() {
    [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.28, 'triangle', 0.12, i * 0.13));
  }
  caught() {
    [392, 311, 233].forEach((f, i) => this.tone(f, 0.3, 'sawtooth', 0.09, i * 0.18));
  }
}
