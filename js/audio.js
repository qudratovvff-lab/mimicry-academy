// Синтезатор звуков интерфейса на основе Web Audio API

class AudioManager {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('mimicry_muted', this.muted);
    return this.muted;
  }

  isMuted() {
    const saved = localStorage.getItem('mimicry_muted');
    if (saved !== null) {
      this.muted = saved === 'true';
    }
    return this.muted;
  }

  playTone(frequency, type, duration, volume = 0.1) {
    if (this.isMuted()) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio playback failed", e);
    }
  }

  playClick() {
    this.playTone(600, 'sine', 0.08, 0.1);
  }

  playCorrect() {
    // Двойной восходящий звук
    this.playTone(523.25, 'sine', 0.15, 0.15); // C5
    setTimeout(() => {
      this.playTone(659.25, 'sine', 0.25, 0.15); // E5
    }, 100);
  }

  playIncorrect() {
    // Низкий жужжащий нисходящий звук
    this.init();
    if (this.isMuted() || !this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.3);
    } catch (e) {
      console.warn(e);
    }
  }

  playFlash() {
    // Вспышка: "шум" или свип
    this.init();
    if (this.isMuted() || !this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.4);

      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {}
  }

  playLevelUp() {
    // Мажорный аккорд-последовательность
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, index) => {
      setTimeout(() => {
        this.playTone(freq, 'sine', 0.3, 0.15);
      }, index * 120);
    });
  }
}

export const audio = new AudioManager();
export default audio;
