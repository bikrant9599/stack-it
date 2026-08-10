/**
 * Web Audio API procedural ASMR sound engine for Stack It.
 * Synthesizes photorealistic physical impacts, materials, air swooshes,
 * and satisfying musical confirmations with zero audio files.
 */

export type MaterialType = 'WOOD' | 'CONCRETE' | 'METAL' | 'CERAMIC';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  // Continuous motion air hum nodes
  private motionOsc: OscillatorNode | null = null;
  private motionFilter: BiquadFilterNode | null = null;
  private motionGain: GainNode | null = null;
  private isMotionActive: boolean = false;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.motionGain && this.ctx) {
      this.motionGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Continuous air swoosh/movement hum during block motion.
   */
  public updateMotionHum(normalizedPos: number, isMoving: boolean) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    if (!isMoving) {
      if (this.isMotionActive && this.motionGain) {
        this.motionGain.gain.setTargetAtTime(0, now, 0.05);
        this.isMotionActive = false;
      }
      return;
    }

    if (!this.motionOsc) {
      // Create subtle low-pass air hum
      this.motionOsc = this.ctx.createOscillator();
      this.motionFilter = this.ctx.createBiquadFilter();
      this.motionGain = this.ctx.createGain();

      this.motionOsc.type = 'sine';
      this.motionOsc.frequency.setValueAtTime(120, now);

      this.motionFilter.type = 'lowpass';
      this.motionFilter.frequency.setValueAtTime(300, now);

      this.motionGain.gain.setValueAtTime(0, now);

      this.motionOsc.connect(this.motionFilter);
      this.motionFilter.connect(this.motionGain);
      this.motionGain.connect(this.ctx.destination);

      this.motionOsc.start();
    }

    this.isMotionActive = true;
    // Modulate pitch slightly as block glides back and forth
    const pitch = 110 + Math.abs(normalizedPos) * 60;
    const gainVal = 0.035 + (1 - Math.abs(normalizedPos)) * 0.025; // quieter at edges

    this.motionOsc.frequency.setTargetAtTime(pitch, now, 0.03);
    this.motionFilter?.frequency.setTargetAtTime(pitch * 2, now, 0.03);
    this.motionGain.gain.setTargetAtTime(gainVal, now, 0.03);
  }

  /**
   * Sound played on successful block drop with material physics & ASMR thunk
   */
  public playDropSound(comboCount: number = 0, material: MaterialType = 'WOOD') {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. Deep Sub Thunk (Physical mass impact)
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(110, now);
    subOsc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

    subGain.gain.setValueAtTime(0.45, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);

    subOsc.start(now);
    subOsc.stop(now + 0.14);

    // 2. Material Characteristic Resonance
    const matOsc = this.ctx.createOscillator();
    const matGain = this.ctx.createGain();

    let matFreq = 320;
    let decayTime = 0.15;
    let waveType: OscillatorType = 'triangle';

    switch (material) {
      case 'CONCRETE':
        matFreq = 180;
        decayTime = 0.12;
        waveType = 'sine';
        break;
      case 'METAL':
        matFreq = 880;
        decayTime = 0.28;
        waveType = 'sine';
        break;
      case 'CERAMIC':
        matFreq = 1200;
        decayTime = 0.18;
        waveType = 'triangle';
        break;
      case 'WOOD':
      default:
        matFreq = 380;
        decayTime = 0.14;
        waveType = 'triangle';
        break;
    }

    matOsc.type = waveType;
    matOsc.frequency.setValueAtTime(matFreq, now);
    matOsc.frequency.exponentialRampToValueAtTime(matFreq * 0.7, now + decayTime);

    matGain.gain.setValueAtTime(0.3, now);
    matGain.gain.exponentialRampToValueAtTime(0.001, now + decayTime);

    matOsc.connect(matGain);
    matGain.connect(this.ctx.destination);

    matOsc.start(now);
    matOsc.stop(now + decayTime);
  }

  /**
   * Slice / Overhang Scraping Friction Sound
   */
  public playSliceSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Filtered noise slice for realistic stone/wood scraping
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.09);
    filter.Q.setValueAtTime(3, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + 0.09);
  }

  /**
   * Sound played on PERFECT alignment with musical harmonic confirmation
   */
  public playPerfectSound(comboCount: number = 1) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Pentatonic scale harmonics (A major pentatonic)
    const baseFreqs = [440, 554.37, 659.25, 830.61, 987.77, 1108.73];
    const baseIndex = (comboCount - 1) % baseFreqs.length;
    const targetFreq = baseFreqs[baseIndex] * (1 + Math.floor((comboCount - 1) / baseFreqs.length) * 0.5);

    // Warm pure harmonic bell
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(targetFreq, now);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);

    // Sub harmonic resonance
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(targetFreq / 2, now);

    subGain.gain.setValueAtTime(0.18, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);

    subOsc.start(now);
    subOsc.stop(now + 0.35);
  }

  /**
   * Subtle creak / friction sound when tower wobbles or flexes
   */
  public playCreakSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140 + Math.random() * 40, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.06);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  /**
   * Game Over / Tower Crash sound sequence with layered impacts & sub rumble
   */
  public playGameOverSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Heavy low-frequency rumble
    const rumbleOsc = this.ctx.createOscillator();
    const rumbleGain = this.ctx.createGain();

    rumbleOsc.type = 'sawtooth';
    rumbleOsc.frequency.setValueAtTime(140, now);
    rumbleOsc.frequency.exponentialRampToValueAtTime(25, now + 0.7);

    rumbleGain.gain.setValueAtTime(0.45, now);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    rumbleOsc.connect(rumbleGain);
    rumbleGain.connect(this.ctx.destination);

    rumbleOsc.start(now);
    rumbleOsc.stop(now + 0.7);

    // Staggered debris impact clicks
    for (let i = 0; i < 4; i++) {
      const delay = 0.08 + i * 0.07;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220 - i * 35, now + delay);
      osc.frequency.exponentialRampToValueAtTime(60, now + delay + 0.08);

      gain.gain.setValueAtTime(0.25 - i * 0.04, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + delay);
      osc.stop(now + delay + 0.08);
    }
  }

  /**
   * Rewarding High Score shimmer sequence
   */
  public playHighScoreSound() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    const freqs = [523.25, 659.25, 783.99, 1046.5, 1318.51]; // C major triad swell
    freqs.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.06);

      gain.gain.setValueAtTime(0.18, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.35);
    });
  }

  /**
   * Cinematic loading screen audio sequence
   */
  public playIntroSoundSequence() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. Very soft low cinematic atmosphere rumble
    const rumbleOsc = this.ctx.createOscillator();
    const rumbleGain = this.ctx.createGain();
    const rumbleFilter = this.ctx.createBiquadFilter();

    rumbleOsc.type = 'sine';
    rumbleOsc.frequency.setValueAtTime(50, now);
    rumbleOsc.frequency.exponentialRampToValueAtTime(28, now + 4.5);

    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.setValueAtTime(110, now);

    rumbleGain.gain.setValueAtTime(0.001, now);
    rumbleGain.gain.linearRampToValueAtTime(0.18, now + 1.5);
    rumbleGain.gain.exponentialRampToValueAtTime(0.001, now + 5.5);

    rumbleOsc.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(this.ctx.destination);

    rumbleOsc.start(now);
    rumbleOsc.stop(now + 5.5);

    // 2. 5 Gentle, deep block settling thunks - progressively calmer & quieter
    const thunkDelays = [0.9, 1.6, 2.3, 3.0, 3.7];
    thunkDelays.forEach((delay, idx) => {
      if (!this.ctx) return;
      const thunkTime = now + delay;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Deep satisfying thunk
      osc.type = 'triangle';
      const startFreq = 160 - idx * 18;
      osc.frequency.setValueAtTime(startFreq, thunkTime);
      osc.frequency.exponentialRampToValueAtTime(40, thunkTime + 0.14);

      // Volume decreases progressively to create a calmer feeling toward the end
      const startGain = 0.22 - idx * 0.035;
      gain.gain.setValueAtTime(Math.max(0.06, startGain), thunkTime);
      gain.gain.exponentialRampToValueAtTime(0.001, thunkTime + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(thunkTime);
      osc.stop(thunkTime + 0.14);
    });

    // 3. Polished warm chord swell when STACK IT logo reveals (at ~4.2s)
    const revealTime = now + 4.2;
    const freqs = [329.63, 440.0, 554.37, 659.25]; // E major chord swell
    freqs.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, revealTime + i * 0.09);

      gain.gain.setValueAtTime(0.12, revealTime + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, revealTime + i * 0.09 + 0.7);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(revealTime + i * 0.09);
      osc.stop(revealTime + i * 0.09 + 0.7);
    });
  }

  /**
   * UI Click Sound
   */
  public playButtonClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.exponentialRampToValueAtTime(360, now + 0.04);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }
}

export const soundEngine = new SoundEngine();
