// Original, procedurally synthesised audio (WebAudio). No recorded or third-party music is used.
// Music: short looping patterns per place. Ambience: filtered noise beds. SFX: tiny synth cues.

const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12); // MIDI → Hz

// Each track: tempo, chord progression (MIDI roots), voice, and a melody pattern over scale degrees.
const TRACKS = {
  city: { bpm: 112, voice: 'pluck', chords: [[60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67]], arp: [0, 1, 2, 1, 0, 2, 1, 2], bass: true, shaker: true },
  home: { bpm: 76, voice: 'keys', chords: [[57, 60, 64], [53, 57, 60], [60, 64, 67], [55, 59, 62]], arp: [0, 2, 1, 2], bass: true },
  indoor: { bpm: 90, voice: 'keys', chords: [[62, 65, 69], [60, 64, 67], [58, 62, 65], [60, 64, 67]], arp: [0, 1, 2, 1], bass: true },
  work: { bpm: 100, voice: 'pluck', chords: [[57, 60, 64], [62, 65, 69], [64, 68, 71], [57, 60, 64]], arp: [0, 2, 1, 2, 0, 2, 1, 2], bass: true },
  study: { bpm: 70, voice: 'keys', chords: [[60, 64, 67, 71], [57, 60, 64, 67], [62, 65, 69, 72], [55, 59, 62, 65]], arp: [0, 2, 3, 1], bass: false },
  church: { bpm: 60, voice: 'organ', chords: [[55, 59, 62], [60, 64, 67], [62, 66, 69], [55, 59, 62]], arp: null, bass: true },
  event: { bpm: 122, voice: 'pluck', chords: [[62, 66, 69], [67, 71, 74], [69, 73, 76], [62, 66, 69]], arp: [0, 1, 2, 1, 2, 1, 0, 1], bass: true, shaker: true },
  village: { bpm: 96, voice: 'kalimba', chords: [[60, 62, 64, 67, 69], [57, 60, 62, 64, 67]], arp: [0, 2, 4, 3, 1, 3, 2, 4], bass: false },
  ancient: { bpm: 72, voice: 'lyre', chords: [[62, 65, 69, 72], [60, 64, 67, 71], [62, 65, 69, 72], [57, 60, 64, 67]], arp: [0, 2, 1, 3], bass: true },
  prayer: { bpm: 54, voice: 'pad', chords: [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]], arp: null, bass: false },
  menu: { bpm: 84, voice: 'kalimba', chords: [[60, 64, 67, 69], [65, 69, 72, 74], [62, 65, 69, 72], [67, 71, 74, 76]], arp: [0, 2, 1, 3, 2, 1], bass: true },
  tension: { bpm: 66, voice: 'pad', chords: [[57, 60, 64], [58, 62, 65], [57, 60, 64], [56, 59, 64]], arp: null, bass: true },
};

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.settings = { musicVolume: 0.5, sfxVolume: 0.7, muted: false };
    this.track = null;
    this.ambience = null;
    this.timer = null;
    this.step = 0;
    this.duck = 1;
  }

  /** Must be called from a user gesture (browser autoplay rules). */
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.music = this.ctx.createGain();
    this.amb = this.ctx.createGain();
    this.sfx = this.ctx.createGain();
    this.music.connect(this.master);
    this.amb.connect(this.master);
    this.sfx.connect(this.master);
    this.master.connect(this.ctx.destination);
    this.apply();
    if (this.pendingTrack) this.play(this.pendingTrack, this.pendingAmbience);
  }

  setSettings(s) {
    this.settings = { ...this.settings, ...s };
    this.apply();
  }

  apply() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const m = this.settings.muted ? 0 : 1;
    this.master.gain.setTargetAtTime(m, t, 0.05);
    this.music.gain.setTargetAtTime(this.settings.musicVolume * 0.32 * this.duck, t, 0.2);
    this.amb.gain.setTargetAtTime(this.settings.musicVolume * 0.18 * this.duck, t, 0.3);
    this.sfx.gain.setTargetAtTime(this.settings.sfxVolume * 0.6, t, 0.05);
  }

  /** Quiet the music during conversations and serious scenes. */
  setDuck(on) {
    this.duck = on ? 0.35 : 1;
    this.apply();
  }

  play(trackId, ambienceId) {
    this.pendingTrack = trackId;
    this.pendingAmbience = ambienceId;
    if (!this.ctx) return;
    if (this.track !== trackId) {
      this.track = trackId;
      this.step = 0;
      clearInterval(this.timer);
      const def = TRACKS[trackId];
      if (def) {
        const stepMs = (60 / def.bpm / 2) * 1000; // eighth notes
        this.timer = setInterval(() => this.tick(def), stepMs);
      }
    }
    if (this.ambienceId !== ambienceId) this.startAmbience(ambienceId);
  }

  stopMusic() {
    clearInterval(this.timer);
    this.timer = null;
    this.track = null;
  }

  stopAll() {
    this.stopMusic();
    this.startAmbience(null);
  }

  tick(def) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime + 0.05;
    const bar = Math.floor(this.step / 8) % def.chords.length;
    const chord = def.chords[bar];
    const pos = this.step % 8;
    const beat = 60 / def.bpm;
    if (def.arp) {
      const deg = def.arp[pos % def.arp.length];
      const n = chord[deg % chord.length] + (deg >= chord.length ? 12 : 0);
      this.voice(def.voice, NOTE(n), t, beat * 0.9, 0.22);
    } else if (pos === 0) {
      for (const n of chord) this.voice(def.voice, NOTE(n), t, beat * 4, 0.12);
    }
    if (def.bass && (pos === 0 || pos === 4)) this.voice('bass', NOTE(chord[0] - 24), t, beat * 1.6, 0.3);
    if (def.shaker && pos % 2 === 1) this.noiseHit(t, 0.03, 0.05, 6000);
    this.step++;
  }

  voice(kind, freq, t, dur, vol) {
    const c = this.ctx;
    const g = c.createGain();
    const o = c.createOscillator();
    let out = g;
    switch (kind) {
      case 'pluck':
        o.type = 'triangle';
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + Math.min(dur, 0.5));
        break;
      case 'kalimba': {
        o.type = 'sine';
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
        const o2 = c.createOscillator();
        o2.type = 'sine';
        o2.frequency.value = freq * 3.01;
        const g2 = c.createGain();
        g2.gain.setValueAtTime(vol * 0.18, t);
        g2.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        o2.connect(g2).connect(this.music);
        o2.start(t);
        o2.stop(t + 0.3);
        break;
      }
      case 'lyre':
        o.type = 'triangle';
        g.gain.setValueAtTime(vol * 0.9, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 1.1);
        break;
      case 'keys':
        o.type = 'sine';
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur * 1.6);
        break;
      case 'organ':
      case 'pad': {
        o.type = kind === 'organ' ? 'square' : 'sawtooth';
        const f = c.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.value = kind === 'organ' ? 1100 : 700;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(vol * 0.6, t + 0.8);
        g.gain.linearRampToValueAtTime(0, t + dur);
        o.connect(f);
        f.connect(g);
        g.connect(this.music);
        o.frequency.value = freq;
        o.start(t);
        o.stop(t + dur + 0.1);
        return;
      }
      case 'bass':
        o.type = 'sine';
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        break;
      default:
        o.type = 'sine';
        g.gain.setValueAtTime(vol, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    }
    o.frequency.value = freq;
    o.connect(g);
    out.connect(this.music);
    o.start(t);
    o.stop(t + dur * 1.7 + 0.1);
  }

  noiseBuffer() {
    if (this._noise) return this._noise;
    const len = this.ctx.sampleRate * 2;
    const b = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this._noise = b;
    return b;
  }

  noiseHit(t, dur, vol, freq, dest = this.music) {
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer();
    const f = this.ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f).connect(g).connect(dest);
    src.start(t);
    src.stop(t + dur + 0.05);
  }

  startAmbience(id) {
    this.ambienceId = id;
    if (!this.ctx) return;
    if (this.ambience) {
      for (const n of this.ambience.nodes) try { n.stop?.(); n.disconnect(); } catch { /* already stopped */ }
      clearInterval(this.ambience.timer);
      this.ambience = null;
    }
    if (!id) return;
    const c = this.ctx;
    const src = c.createBufferSource();
    src.buffer = this.noiseBuffer();
    src.loop = true;
    const f = c.createBiquadFilter();
    const g = c.createGain();
    const settings = { city: [500, 0.5], indoor: [300, 0.18], church: [250, 0.12], village: [1800, 0.08], ancient: [900, 0.1] }[id] || [400, 0.15];
    f.type = id === 'village' ? 'bandpass' : 'lowpass';
    f.frequency.value = settings[0];
    g.gain.value = settings[1];
    src.connect(f).connect(g).connect(this.amb);
    src.start();
    let timer = null;
    // occasional details: car horns in the city, birds in the village
    if (id === 'city' || id === 'village') {
      timer = setInterval(() => {
        if (Math.random() < 0.35) id === 'city' ? this.horn() : this.bird();
      }, 4000);
    }
    this.ambience = { nodes: [src, f, g], timer };
  }

  horn() {
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'square';
    o.frequency.value = 380 + Math.random() * 60;
    g.gain.setValueAtTime(0.05, t);
    g.gain.setValueAtTime(0, t + 0.18);
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 900;
    o.connect(f).connect(g).connect(this.amb);
    o.start(t);
    o.stop(t + 0.2);
  }

  bird() {
    const t = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.frequency.setValueAtTime(2600, t + i * 0.12);
      o.frequency.exponentialRampToValueAtTime(3800, t + i * 0.12 + 0.08);
      g.gain.setValueAtTime(0.06, t + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.1);
      o.connect(g).connect(this.amb);
      o.start(t + i * 0.12);
      o.stop(t + i * 0.12 + 0.12);
    }
  }

  sfxTone(freqs, { type = 'triangle', dur = 0.12, gap = 0.07, vol = 0.3 } = {}) {
    if (!this.ctx) return;
    const t0 = this.ctx.currentTime;
    freqs.forEach((f, i) => {
      const t = t0 + i * gap;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type;
      o.frequency.value = f;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(this.sfx);
      o.start(t);
      o.stop(t + dur + 0.02);
    });
  }

  sfxPlay(name) {
    switch (name) {
      case 'click': return this.sfxTone([880], { dur: 0.05, vol: 0.15 });
      case 'open': return this.sfxTone([523, 784], { dur: 0.08, gap: 0.05, vol: 0.15 });
      case 'close': return this.sfxTone([784, 523], { dur: 0.08, gap: 0.05, vol: 0.12 });
      case 'coin': return this.sfxTone([988, 1319], { type: 'square', dur: 0.09, gap: 0.07, vol: 0.08 });
      case 'success': return this.sfxTone([523, 659, 784, 1047], { dur: 0.18, gap: 0.09, vol: 0.18 });
      case 'achievement': return this.sfxTone([659, 784, 988, 1319, 1568], { type: 'sine', dur: 0.3, gap: 0.1, vol: 0.2 });
      case 'error': return this.sfxTone([220, 196], { type: 'square', dur: 0.12, gap: 0.1, vol: 0.06 });
      case 'blip': return this.sfxTone([660 + Math.random() * 120], { type: 'sine', dur: 0.04, vol: 0.06 });
      case 'door': return this.ctx && this.noiseHit(this.ctx.currentTime, 0.15, 0.25, 300, this.sfx);
      case 'step': return this.ctx && this.noiseHit(this.ctx.currentTime, 0.03, 0.05, 1500, this.sfx);
      case 'decision': return this.sfxTone([392, 466, 587], { type: 'sine', dur: 0.4, gap: 0.12, vol: 0.15 });
      default: return undefined;
    }
  }

  /** The final trumpet: a slow, swelling brass call (synthesised). Returns its duration in ms. */
  trumpet() {
    this.stopAll();
    if (!this.ctx) return 4000;
    const c = this.ctx;
    const t0 = c.currentTime + 0.2;
    const call = [[58, 0, 0.9], [65, 1.0, 0.5], [65, 1.55, 0.5], [70, 2.1, 2.6]];
    for (const [n, start, dur] of call) {
      for (const detune of [-6, 0, 7]) {
        const o = c.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = NOTE(n);
        o.detune.value = detune;
        const vib = c.createOscillator();
        const vibG = c.createGain();
        vib.frequency.value = 5.2;
        vibG.gain.value = 4;
        vib.connect(vibG).connect(o.frequency);
        const f = c.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.setValueAtTime(400, t0 + start);
        f.frequency.linearRampToValueAtTime(2600, t0 + start + 0.25);
        const g = c.createGain();
        g.gain.setValueAtTime(0, t0 + start);
        g.gain.linearRampToValueAtTime(0.09, t0 + start + 0.12);
        g.gain.setValueAtTime(0.09, t0 + start + dur - 0.2);
        g.gain.linearRampToValueAtTime(0, t0 + start + dur);
        o.connect(f).connect(g).connect(this.sfx);
        o.start(t0 + start);
        vib.start(t0 + start);
        o.stop(t0 + start + dur + 0.05);
        vib.stop(t0 + start + dur + 0.05);
      }
    }
    return 5000;
  }
}

export const audio = new AudioEngine();
