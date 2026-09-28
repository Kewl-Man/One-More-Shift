// Web Audio API procedural sound synthesizer for "ONE MORE SHIFT"

class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private ambientOsc1: OscillatorNode | null = null;
  private ambientOsc2: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;
  private humGain: GainNode | null = null;
  private isAmbientPlaying = false;
  private isMuted = false;

  private conveyorOsc: OscillatorNode | null = null;
  private conveyorGain: GainNode | null = null;
  private isConveyorPlaying = false;

  private settings = {
    masterVolume: 0.8,
    sfxVolume: 0.9,
    musicVolume: 0.7,
  };

  constructor() {
    // Lazy initialize on first user interaction
  }

  public init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.settings.masterVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.settings.sfxVolume, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.settings.musicVolume, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);
    } catch (e) {
      console.warn("Web Audio API not supported or blocked:", e);
    }
  }

  public setVolume(master: number, sfx: number, music: number) {
    this.settings.masterVolume = master;
    this.settings.sfxVolume = sfx;
    this.settings.musicVolume = music;

    if (this.ctx && this.masterGain && this.sfxGain && this.musicGain) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.setTargetAtTime(master, t, 0.05);
      this.sfxGain.gain.setTargetAtTime(sfx, t, 0.05);
      this.musicGain.gain.setTargetAtTime(music, t, 0.05);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Atmospheric ambient drone (Fluorescent hum + deep store drone)
  public startAmbient() {
    this.init();
    if (!this.ctx || !this.masterGain || !this.musicGain || this.isAmbientPlaying) return;
    this.resume();

    try {
      // 1. Store Drone
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const droneGain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(55, this.ctx.currentTime); // Low A

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(58.27, this.ctx.currentTime); // Slight dissonance Bb

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, this.ctx.currentTime);

      droneGain.gain.setValueAtTime(0.08, this.ctx.currentTime);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(droneGain);
      droneGain.connect(this.musicGain);

      osc1.start();
      osc2.start();

      this.ambientOsc1 = osc1;
      this.ambientOsc2 = osc2;
      this.ambientGain = droneGain;

      // 2. Fluorescent 60Hz Buzz
      const humOsc = this.ctx.createOscillator();
      const humGain = this.ctx.createGain();
      const humFilter = this.ctx.createBiquadFilter();

      humOsc.type = 'triangle';
      humOsc.frequency.setValueAtTime(120, this.ctx.currentTime); // 120Hz ballast hum

      humFilter.type = 'bandpass';
      humFilter.frequency.setValueAtTime(120, this.ctx.currentTime);
      humFilter.Q.setValueAtTime(4, this.ctx.currentTime);

      humGain.gain.setValueAtTime(0.02, this.ctx.currentTime);

      humOsc.connect(humFilter);
      humFilter.connect(humGain);
      humGain.connect(this.sfxGain!);
      humOsc.start();

      this.humGain = humGain;
      this.isAmbientPlaying = true;
    } catch (e) {
      console.warn("Could not start ambient audio:", e);
    }
  }

  public stopAmbient() {
    if (this.ambientOsc1) {
      try { this.ambientOsc1.stop(); } catch (_) {}
      this.ambientOsc1 = null;
    }
    if (this.ambientOsc2) {
      try { this.ambientOsc2.stop(); } catch (_) {}
      this.ambientOsc2 = null;
    }
    this.isAmbientPlaying = false;
  }

  // Footsteps
  public playFootstep(isSprinting = false) {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80 + Math.random() * 30, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.08);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, t);

    const vol = isSprinting ? 0.12 : 0.07;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  // Barcode Scanner Beep
  public playScannerBeep() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1850, t);
    osc.frequency.setValueAtTime(1900, t + 0.03);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.085);
  }

  // Cash Register Till Open / Bell
  public playRegisterDrawer() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Metallic latch click
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(440, t);
    clickOsc.frequency.exponentialRampToValueAtTime(120, t + 0.05);
    clickGain.gain.setValueAtTime(0.12, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    clickOsc.connect(clickGain);
    clickGain.connect(this.sfxGain);
    clickOsc.start(t);
    clickOsc.stop(t + 0.06);

    // Bell chime "Ka-ching"
    const bellOsc = this.ctx.createOscillator();
    const bellGain = this.ctx.createGain();
    bellOsc.type = 'sine';
    bellOsc.frequency.setValueAtTime(1567.98, t + 0.04); // G6
    bellGain.gain.setValueAtTime(0.16, t + 0.04);
    bellGain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    bellOsc.connect(bellGain);
    bellGain.connect(this.sfxGain);
    bellOsc.start(t + 0.04);
    bellOsc.stop(t + 0.5);
  }

  // Convenience Store Door Chime "Ding Dong"
  public playDoorChime() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // High ding
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, t); // A5
    gain1.gain.setValueAtTime(0.15, t);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    osc1.connect(gain1);
    gain1.connect(this.sfxGain);
    osc1.start(t);
    osc1.stop(t + 0.4);

    // Lower dong
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, t + 0.25); // E5
    gain2.gain.setValueAtTime(0.18, t + 0.25);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    osc2.connect(gain2);
    gain2.connect(this.sfxGain);
    osc2.start(t + 0.25);
    osc2.stop(t + 0.75);
  }

  // Counter Service Bell
  public playServiceBell() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2093, t); // C7
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.5);
  }

  public playBarcodeBeep() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(2400, t);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  // Flashlight click
  public playFlashlightClick() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.02);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.03);
  }

  // Item pickup / placement / restock sound
  public playItemRestock() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(280, t + 0.08);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.13);
  }

  // Mop squelch / cleaning sound
  public playMopSound() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Filtered noise squelch
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, t);
    filter.Q.setValueAtTime(2, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
  }

  // Typewriter key click (for dialogue)
  public playTypewriterKey(voiceType: 'normal' | 'deep' | 'glitched' | 'whisper' | 'radio' | 'corporate' = 'normal') {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    if (voiceType === 'deep') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(90 + Math.random() * 20, t);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    } else if (voiceType === 'glitched') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(300 + Math.random() * 600, t);
      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    } else if (voiceType === 'corporate' || voiceType === 'radio') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450 + (Math.random() - 0.5) * 40, t);
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320 + Math.random() * 80, t);
      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    }

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  // CCTV switch camera static
  public playCctvSwitch() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.8;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
  }

  // Breaker switch flip
  public playBreakerSwitch() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.06);
    gain.gain.setValueAtTime(0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  // Power Blackout BANG!
  public playBlackout() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 0.6);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.75);
  }

  // Horror Entity Stinger / Dissonant chord
  public playHorrorStinger() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Dissonant tritone chord
    const freqs = [110, 155.56, 220, 311.13, 622.25]; // A2 + Eb3 + A3 + Eb4 + Eb5
    freqs.forEach((f) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, t);
      osc.frequency.linearRampToValueAtTime(f * 0.98, t + 1.2);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 1.6);
    });
  }

  // Continuous Phone Ringing Loop
  private phoneRingInterval: number | null = null;

  public startPhoneRinging() {
    this.init();
    if (this.phoneRingInterval) return;
    this.playPhoneRing();
    this.phoneRingInterval = window.setInterval(() => {
      this.playPhoneRing();
    }, 3800);
  }

  public stopPhoneRinging() {
    if (this.phoneRingInterval) {
      clearInterval(this.phoneRingInterval);
      this.phoneRingInterval = null;
    }
  }

  // Phone Ringing Single Burst
  public playPhoneRing() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(440, t);
    osc2.frequency.setValueAtTime(480, t);

    // Burst pattern: 0.6s on, 0.4s off, 0.6s on
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.setValueAtTime(0.18, t + 0.6);
    gain.gain.setValueAtTime(0.001, t + 0.61);
    gain.gain.setValueAtTime(0.18, t + 0.9);
    gain.gain.setValueAtTime(0.18, t + 1.5);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 1.9);
    osc2.stop(t + 1.9);
  }

  // UI Button Click
  public playUiClick() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.04);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.055);
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.ctx && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : this.settings.masterVolume, this.ctx.currentTime, 0.05);
    }
  }

  public playAmbientHum() {
    this.startAmbient();
  }

  // Morning dawn chime when shift completes (peaceful ascending major chord)
  public playMorningChime() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.0, 523.25]; // C4 - E4 - G4 - C5
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const startT = t + idx * 0.22;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startT);
      gain.gain.setValueAtTime(0.12, startT);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + 1.8);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(startT);
      osc.stop(startT + 2.0);
    });
  }

  // Eerie knocking against the front glass windows
  public playWindowKnock() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    [0, 0.18, 0.36].forEach((delay) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const knockT = t + delay;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, knockT);
      osc.frequency.exponentialRampToValueAtTime(40, knockT + 0.08);
      gain.gain.setValueAtTime(0.2, knockT);
      gain.gain.exponentialRampToValueAtTime(0.001, knockT + 0.09);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(knockT);
      osc.stop(knockT + 0.1);
    });
  }

  // Heavy mechanical breaker snap / spark
  public playBreakerTrip() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 0.15);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  // Clean chime when an objective or task is finished
  public playTaskComplete() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25]; // A major arpeggio
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const startT = t + idx * 0.1;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startT);
      gain.gain.setValueAtTime(0.12, startT);
      gain.gain.exponentialRampToValueAtTime(0.001, startT + 0.5);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(startT);
      osc.stop(startT + 0.55);
    });
  }

  // Cardboard / plastic stocking sound
  public playRestock() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.12);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  // Telephone receiver unhook / pickup click and line open
  public playPhonePickup() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    // Heavy plastic mechanical release
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.05);
    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.07);

    // Faint telephone line hum
    const lineOsc = this.ctx.createOscillator();
    const lineFilter = this.ctx.createBiquadFilter();
    const lineGain = this.ctx.createGain();
    lineOsc.type = 'sawtooth';
    lineOsc.frequency.setValueAtTime(350, t + 0.04);
    lineFilter.type = 'bandpass';
    lineFilter.frequency.setValueAtTime(400, t + 0.04);
    lineGain.gain.setValueAtTime(0.03, t + 0.04);
    lineGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    lineOsc.connect(lineFilter);
    lineFilter.connect(lineGain);
    lineGain.connect(this.sfxGain);
    lineOsc.start(t + 0.04);
    lineOsc.stop(t + 0.4);
  }

  // Telephone hangup cradle slam
  public playPhoneHangup() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(250, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.08);
    gain.gain.setValueAtTime(0.24, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  // Procedural telephone voice chatter (makes speech audible as realistic filtered voice packets)
  public playPhoneVoiceChatter(syllables = 4) {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    for (let i = 0; i < syllables; i++) {
      const sylT = t + i * 0.09;
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      // Formants in human vocal telephone spectrum (300Hz - 2200Hz)
      const baseFreq = 160 + (i % 2 === 0 ? 30 : -20) + Math.random() * 40;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(baseFreq, sylT);
      osc.frequency.linearRampToValueAtTime(baseFreq * (0.95 + Math.random() * 0.1), sylT + 0.07);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(850 + Math.random() * 400, sylT);
      filter.Q.setValueAtTime(3.5, sylT);

      gain.gain.setValueAtTime(0.07, sylT);
      gain.gain.exponentialRampToValueAtTime(0.001, sylT + 0.08);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(sylT);
      osc.stop(sylT + 0.085);
    }
  }

  // Sickening neck bone snap
  public playNeckSnap() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    [0, 0.03, 0.07].forEach((delay, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const snapT = t + delay;
      osc.type = 'square';
      osc.frequency.setValueAtTime(800 - idx * 200, snapT);
      osc.frequency.exponentialRampToValueAtTime(140, snapT + 0.04);
      gain.gain.setValueAtTime(0.25 - idx * 0.05, snapT);
      gain.gain.exponentialRampToValueAtTime(0.001, snapT + 0.05);
      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(snapT);
      osc.stop(snapT + 0.055);
    });
  }

  // Distant thud from dark aisles
  public playDistantThud() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(95, t);
    osc.frequency.exponentialRampToValueAtTime(28, t + 0.35);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, t);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.45);
  }

  // Static burst for CCTV / Entity interference
  public playStaticBurst(duration = 0.25) {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    noise.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);
  }

  // Eerie whisper frequency
  public playWhisper() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.linearRampToValueAtTime(220, t + 0.4);
    osc.frequency.linearRampToValueAtTime(270, t + 0.8);
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.95);
  }

  // Heavy metal door deadbolt latching
  public playDoorLock() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.07);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  // Electrical error / misconnect buzz
  public playBuzzSound() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, t);
    osc.frequency.linearRampToValueAtTime(110, t + 0.18);
    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.22);
  }

  // Checkout conveyor belt continuous motorized running hum
  public startConveyorBelt() {
    this.init();
    if (!this.ctx || !this.sfxGain || this.isConveyorPlaying) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(84, this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(280, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.065, this.ctx.currentTime + 0.12);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxGain);

      osc.start();
      this.conveyorOsc = osc;
      this.conveyorGain = gain;
      this.isConveyorPlaying = true;
    } catch {
      // AudioContext safe catch
    }
  }

  public stopConveyorBelt() {
    if (!this.isConveyorPlaying || !this.ctx || !this.conveyorGain) return;
    try {
      const t = this.ctx.currentTime;
      this.conveyorGain.gain.linearRampToValueAtTime(0.001, t + 0.1);
      setTimeout(() => {
        try {
          this.conveyorOsc?.stop();
          this.conveyorOsc?.disconnect();
          this.conveyorGain?.disconnect();
        } catch {}
        this.conveyorOsc = null;
        this.conveyorGain = null;
        this.isConveyorPlaying = false;
      }, 110);
    } catch {
      this.isConveyorPlaying = false;
    }
  }

  // Checkout conveyor belt motorized single pulse hum
  public playConveyorBeltSound() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80, t);
    osc.frequency.linearRampToValueAtTime(95, t + 0.25);
    osc.frequency.linearRampToValueAtTime(70, t + 0.6);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.7);
  }

  // Car door open / shut heavy thud
  public playCarDoor() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.12);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  // Car turn signal indicator click
  public playBlinkerClick() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(820, t);
    gain.gain.setValueAtTime(0.04, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.03);
  }

  // High-voltage electrical spark burst
  public playElectricalSparks() {
    this.init();
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    // White noise / crackle burst
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1400, t);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    noise.start(t);
  }
}

export const sound = new SoundManager();
