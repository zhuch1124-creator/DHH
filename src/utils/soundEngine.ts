/**
 * Dunhuang Audio Synthesizer & BGM Channel Engine
 * Manages BGM (HGNNNN - Meiyo to Songen), cave subterranean acoustic resonance,
 * and singing bowl chimes with multi-channel toggle and volume controls.
 */

type SoundStateListener = () => void;

class DunhuangSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;

  // Master volume and mute
  private isMuted: boolean = false;
  private masterVolume: number = 0.8;

  // Channel 1: BGM (HGNNNN - Meiyo to Songen)
  private bgmAudio: HTMLAudioElement | null = null;
  private bgmEnabled: boolean = true;
  private bgmVolume: number = 0.65;
  private isBgmPlaying: boolean = false;

  // Channel 2: Subterranean Ambient Resonance
  private ambientEnabled: boolean = true;
  private ambientVolume: number = 0.35;
  private isAmbientRunning: boolean = false;
  private oscillators: OscillatorNode[] = [];
  private noiseNode: AudioNode | null = null;

  // Channel 3: Temple Chimes & Singing Bowl
  private chimesEnabled: boolean = true;
  private chimesVolume: number = 0.5;

  private listeners: Set<SoundStateListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initBgmAudio();
    }
  }

  public subscribe(fn: SoundStateListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch {}
    });
  }

  private initBgmAudio() {
    if (!this.bgmAudio && typeof Audio !== 'undefined') {
      this.bgmAudio = new Audio('/assets/audio/bgm_meiyo_to_songen.mp3');
      this.bgmAudio.loop = true;
      this.bgmAudio.volume = this.isMuted || !this.bgmEnabled ? 0 : this.masterVolume * this.bgmVolume;
      this.bgmAudio.preload = 'auto';

      this.bgmAudio.addEventListener('play', () => {
        this.isBgmPlaying = true;
        this.notify();
      });
      this.bgmAudio.addEventListener('pause', () => {
        this.isBgmPlaying = false;
        this.notify();
      });
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /* ---------------- Channel 1: BGM Controls ---------------- */

  public startBgm() {
    this.initBgmAudio();
    if (!this.bgmAudio || !this.bgmEnabled) return;
    this.updateBgmVolume();
    this.bgmAudio.play().catch(() => {});
  }

  public pauseBgm() {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
    }
  }

  public toggleBgm(): boolean {
    this.bgmEnabled = !this.bgmEnabled;
    if (!this.bgmEnabled) {
      this.pauseBgm();
    } else {
      this.updateBgmVolume();
      this.startBgm();
    }
    this.notify();
    return this.bgmEnabled;
  }

  public setBgmEnabled(enabled: boolean) {
    if (this.bgmEnabled === enabled) return;
    this.bgmEnabled = enabled;
    if (!enabled) {
      this.pauseBgm();
    } else {
      this.updateBgmVolume();
      this.startBgm();
    }
    this.notify();
  }

  public getBgmEnabled(): boolean {
    return this.bgmEnabled;
  }

  public getIsBgmPlaying(): boolean {
    return this.isBgmPlaying;
  }

  public setBgmVolume(val: number) {
    this.bgmVolume = Math.max(0, Math.min(1, val));
    this.updateBgmVolume();
    this.notify();
  }

  public getBgmVolume(): number {
    return this.bgmVolume;
  }

  private updateBgmVolume() {
    if (this.bgmAudio) {
      const target = this.isMuted || !this.bgmEnabled ? 0 : this.masterVolume * this.bgmVolume;
      this.bgmAudio.volume = Math.max(0, Math.min(1, target));
    }
  }

  public seekBgm(timeInSeconds: number) {
    if (this.bgmAudio && !isNaN(timeInSeconds)) {
      this.bgmAudio.currentTime = Math.max(0, timeInSeconds % (this.bgmAudio.duration || 179));
    }
  }

  /* ---------------- Master & Channel 2 & 3 Controls ---------------- */

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }
    this.updateBgmVolume();
    this.notify();
    return this.isMuted;
  }

  public setMasterVolume(val: number) {
    this.masterVolume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.05);
    }
    this.updateBgmVolume();
    this.notify();
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public toggleAmbient(): boolean {
    this.ambientEnabled = !this.ambientEnabled;
    if (!this.ambientEnabled) {
      this.stopAmbient();
    } else {
      this.startAmbient();
    }
    this.notify();
    return this.ambientEnabled;
  }

  public setAmbientEnabled(enabled: boolean) {
    if (this.ambientEnabled === enabled) return;
    this.ambientEnabled = enabled;
    if (!enabled) {
      this.stopAmbient();
    } else {
      this.startAmbient();
    }
    this.notify();
  }

  public getAmbientEnabled(): boolean {
    return this.ambientEnabled;
  }

  public setAmbientVolume(val: number) {
    this.ambientVolume = Math.max(0, Math.min(1, val));
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setTargetAtTime(this.ambientVolume * 0.35, this.ctx.currentTime, 0.05);
    }
    this.notify();
  }

  public getAmbientVolume(): number {
    return this.ambientVolume;
  }

  public toggleChimes(): boolean {
    this.chimesEnabled = !this.chimesEnabled;
    this.notify();
    return this.chimesEnabled;
  }

  public getChimesEnabled(): boolean {
    return this.chimesEnabled;
  }

  public setChimesEnabled(enabled: boolean) {
    this.chimesEnabled = enabled;
    this.notify();
  }

  /* ---------------- Cave Sub-Drone Generator ---------------- */

  public startAmbient() {
    if (!this.ambientEnabled || this.isAmbientRunning) return;
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.ambientGain.gain.exponentialRampToValueAtTime(
      Math.max(0.001, this.ambientVolume * 0.35),
      this.ctx.currentTime + 2.5
    );
    this.ambientGain.connect(this.masterGain);

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(54.8, this.ctx.currentTime);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(82.2, this.ctx.currentTime);

    const osc3 = this.ctx.createOscillator();
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(109.6, this.ctx.currentTime);

    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.08, this.ctx.currentTime);

    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(30, this.ctx.currentTime);

    const biquadFilter = this.ctx.createBiquadFilter();
    biquadFilter.type = 'lowpass';
    biquadFilter.frequency.setValueAtTime(180, this.ctx.currentTime);
    lfo.connect(biquadFilter.frequency);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.4, this.ctx.currentTime);

    osc1.connect(subGain);
    osc2.connect(subGain);
    osc3.connect(subGain);
    subGain.connect(biquadFilter);
    biquadFilter.connect(this.ambientGain);

    // Desert whisper wind
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99 * b0 + white * 0.05;
      b1 = 0.95 * b1 + white * 0.08;
      b2 = 0.85 * b2 + white * 0.12;
      output[i] = (b0 + b1 + b2) * 0.15;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.setValueAtTime(280, this.ctx.currentTime);
    windFilter.Q.setValueAtTime(3.0, this.ctx.currentTime);

    const windGain = this.ctx.createGain();
    windGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

    whiteNoise.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.ambientGain);

    osc1.start();
    osc2.start();
    osc3.start();
    lfo.start();
    whiteNoise.start();

    this.oscillators = [osc1, osc2, osc3, lfo];
    this.noiseNode = whiteNoise;
    this.isAmbientRunning = true;
  }

  public stopAmbient() {
    if (!this.isAmbientRunning || !this.ctx || !this.ambientGain) return;
    this.ambientGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.4);
    setTimeout(() => {
      this.oscillators.forEach((osc) => {
        try {
          osc.stop();
        } catch {}
      });
      if (this.noiseNode && 'stop' in this.noiseNode) {
        try {
          (this.noiseNode as AudioScheduledSourceNode).stop();
        } catch {}
      }
      this.oscillators = [];
      this.noiseNode = null;
      this.isAmbientRunning = false;
    }, 450);
  }

  public playBowlChime(pitch: number = 392) {
    if (!this.chimesEnabled) return;
    this.initContext();
    if (!this.ctx || !this.masterGain || this.isMuted) return;

    const now = this.ctx.currentTime;
    const chimeGain = this.ctx.createGain();
    chimeGain.gain.setValueAtTime(0.3 * this.chimesVolume, now);
    chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);
    chimeGain.connect(this.masterGain);

    const partials = [
      { ratio: 1.0, gain: 0.6 },
      { ratio: 2.76, gain: 0.35 },
      { ratio: 4.82, gain: 0.18 },
      { ratio: 7.21, gain: 0.08 },
    ];

    partials.forEach(({ ratio, gain }) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const pGain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(pitch * ratio, now);

      pGain.gain.setValueAtTime(gain, now);
      pGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8 / ratio);

      osc.connect(pGain);
      pGain.connect(chimeGain);

      osc.start(now);
      osc.stop(now + 4.5);
    });
  }
}

export const soundEngine = new DunhuangSoundEngine();
