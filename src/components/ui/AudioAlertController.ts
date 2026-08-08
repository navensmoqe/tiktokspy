// Web Audio API custom synthesizer for instant zero-dependency alert sounds

class AudioAlertController {
  private audioCtx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  public playSound(type: "chime" | "radar" | "alarm" | "subtle" = "radar", volume: number = 80) {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const normalizedVol = Math.max(0, Math.min(1, volume / 100));

      if (type === "radar") {
        this.playRadar(ctx, normalizedVol);
      } else if (type === "chime") {
        this.playChime(ctx, normalizedVol);
      } else if (type === "alarm") {
        this.playAlarm(ctx, normalizedVol);
      } else {
        this.playSubtle(ctx, normalizedVol);
      }
    } catch (e) {
      console.warn("Audio playback failed (browser auto-play policy):", e);
    }
  }

  private playRadar(ctx: AudioContext, masterVol: number) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now); // A5
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15); // A6
    osc.frequency.exponentialRampToValueAtTime(2200, now + 0.3);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(masterVol * 0.4, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  }

  private playChime(ctx: AudioContext, masterVol: number) {
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, index) => {
      const startTime = ctx.currentTime + index * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.01, startTime);
      gain.gain.linearRampToValueAtTime(masterVol * 0.3, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
  }

  private playAlarm(ctx: AudioContext, masterVol: number) {
    const now = ctx.currentTime;
    for (let i = 0; i < 2; i++) {
      const burstStart = now + i * 0.22;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(1200, burstStart);
      osc.frequency.setValueAtTime(800, burstStart + 0.1);

      gain.gain.setValueAtTime(masterVol * 0.25, burstStart);
      gain.gain.exponentialRampToValueAtTime(0.001, burstStart + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(burstStart);
      osc.stop(burstStart + 0.18);
    }
  }

  private playSubtle(ctx: AudioContext, masterVol: number) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, now); // D5
    gain.gain.setValueAtTime(masterVol * 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }
}

export const audioAlert = new AudioAlertController();
export default audioAlert;
