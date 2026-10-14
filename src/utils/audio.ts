// Web Audio API ambient sounds and completion chimes

class SoundService {
  private ctx: AudioContext | null = null;
  private ambientSource: AudioNode | null = null;
  private ambientGain: GainNode | null = null;
  private isAmbientPlaying = false;

  private init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play a pleasant gentle chime bell
  playBell(volume = 0.5) {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const fundamental = 528; // 528 Hz - Solfeggio "frequency of transformation" / relaxing focus

      // Two harmonic oscillators for a rich bell sound
      const harmonics = [1, 2.76, 5.4, 8.93];
      const gains = [0.6, 0.3, 0.15, 0.05];

      harmonics.forEach((h, i) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(fundamental * h, now);

        gain.gain.setValueAtTime(gains[i] * volume, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 2.6);
      });
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Play a short pleasant click/beep for button presses or pause
  playTick(volume = 0.2) {
    try {
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);

      gain.gain.setValueAtTime(volume * 0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // ignore
    }
  }

  // Ambient sound generator (Rain / White noise / Binaural 40Hz gamma focus)
  startAmbient(type: 'rain' | 'whitenoise' | 'binaural', volume = 0.3) {
    this.stopAmbient();
    try {
      this.init();
      if (!this.ctx) return;

      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(volume * 0.5, this.ctx.currentTime);
      masterGain.connect(this.ctx.destination);
      this.ambientGain = masterGain;

      if (type === 'whitenoise' || type === 'rain') {
        // Buffer of noise
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);

        if (type === 'rain') {
          // Pink/Brownish noise filtered like rain
          let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
            b6 = white * 0.115926;
          }
        } else {
          // Soft white noise
          for (let i = 0; i < bufferSize; i++) {
            output[i] = (Math.random() * 2 - 1) * 0.15;
          }
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        // Lowpass filter for cozy muffled rain / noise
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(type === 'rain' ? 800 : 1200, this.ctx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(masterGain);
        whiteNoise.start();
        this.ambientSource = whiteNoise;
      } else if (type === 'binaural') {
        // 40Hz Gamma wave difference (Left: 200Hz, Right: 240Hz)
        const merger = this.ctx.createChannelMerger(2);

        const oscL = this.ctx.createOscillator();
        oscL.type = 'sine';
        oscL.frequency.setValueAtTime(200, this.ctx.currentTime);

        const oscR = this.ctx.createOscillator();
        oscR.type = 'sine';
        oscR.frequency.setValueAtTime(240, this.ctx.currentTime);

        oscL.connect(merger, 0, 0);
        oscR.connect(merger, 0, 1);
        merger.connect(masterGain);

        oscL.start();
        oscR.start();
        this.ambientSource = merger;
      }

      this.isAmbientPlaying = true;
    } catch (e) {
      console.warn('Ambient sound error:', e);
    }
  }

  setAmbientVolume(volume: number) {
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(volume * 0.5, this.ctx.currentTime);
    }
  }

  stopAmbient() {
    try {
      if (this.ambientSource) {
        if ('stop' in this.ambientSource && typeof this.ambientSource.stop === 'function') {
          (this.ambientSource as AudioScheduledSourceNode).stop();
        }
        this.ambientSource.disconnect();
        this.ambientSource = null;
      }
      this.isAmbientPlaying = false;
    } catch {
      // ignore
    }
  }

  isPlayingAmbient(): boolean {
    return this.isAmbientPlaying;
  }
}

export const soundManager = new SoundService();
