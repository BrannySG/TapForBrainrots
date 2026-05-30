import type { EventBus } from "../core/events/EventBus";
import type { Rarity, TargetKind } from "../core/types";
import { RARITY_ORDER } from "../core/types";

interface ToneOptions {
  freq: number;
  /** Target frequency for a pitch glide; defaults to `freq` (no glide). */
  endFreq?: number;
  type?: OscillatorType;
  /** Seconds. */
  duration?: number;
  /** Peak gain (0..1). */
  gain?: number;
  /** Seconds before the tone starts (for layering). */
  delay?: number;
}

interface NoiseOptions {
  duration?: number;
  gain?: number;
  /** Low-pass cutoff in Hz to shape the burst. */
  cutoff?: number;
  delay?: number;
}

/**
 * Procedural sound effects via the Web Audio API - no asset files. A pure
 * presentation-layer subscriber: it listens to core events and synthesizes
 * short tones / noise bursts. Toggling `enabled` off (or never unlocking the
 * context) changes nothing about game logic or the HUD.
 *
 * `Math.random` is used here only for noise shaping; this layer is outside
 * `src/core`, so it does not affect deterministic game logic.
 */
export class AudioSystem {
  enabled = true;

  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;

  constructor(bus: EventBus) {
    bus.on("targetDamaged", (e) => {
      if (e.isTap) this.playTap();
    });
    bus.on("killReward", () => this.playGold());
    bus.on("upgradePurchased", () => this.playBuy());
    bus.on("targetBroken", (e) => this.playBreak(e.kind));
    bus.on("luckyReveal", () => this.playSummon());
  }

  /**
   * Create (once) and resume the AudioContext. Must be called from a user
   * gesture to satisfy browser autoplay policies.
   */
  unlock(): void {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  // ---- Sound profiles -----------------------------------------------------

  private playTap(): void {
    this.tone({ freq: 210, endFreq: 150, type: "triangle", duration: 0.06, gain: 0.16 });
  }

  private playGold(): void {
    // Bright two-note "ching".
    this.tone({ freq: 988, type: "triangle", duration: 0.07, gain: 0.12 });
    this.tone({ freq: 1319, type: "triangle", duration: 0.1, gain: 0.12, delay: 0.05 });
  }

  private playBuy(): void {
    // Rising confirmation chime.
    this.tone({ freq: 523, endFreq: 784, type: "sine", duration: 0.14, gain: 0.16 });
  }

  private playBreak(kind: TargetKind): void {
    if (kind === "lucky") {
      this.noise({ duration: 0.32, gain: 0.3, cutoff: 1500 });
      this.tone({ freq: 90, endFreq: 45, type: "sine", duration: 0.34, gain: 0.28 });
      this.tone({ freq: 660, endFreq: 990, type: "triangle", duration: 0.22, gain: 0.1, delay: 0.04 });
    } else {
      this.noise({ duration: 0.18, gain: 0.24, cutoff: 2200 });
      this.tone({ freq: 130, endFreq: 70, type: "sine", duration: 0.2, gain: 0.2 });
    }
  }

  private playSummon(): void {
    // Magical rising sweep with a shimmer tail.
    this.tone({ freq: 330, endFreq: 1180, type: "sine", duration: 0.5, gain: 0.18 });
    this.tone({ freq: 880, endFreq: 1320, type: "triangle", duration: 0.3, gain: 0.1, delay: 0.18 });
  }

  /**
   * One carousel "tick" per cycle of the summon reveal. `progress` (0..1) is how
   * far through the spin we are, raising the pitch to build tension as it slows.
   */
  playTick(progress = 0): void {
    const base = 300 + Math.max(0, Math.min(1, progress)) * 520;
    this.tone({ freq: base, endFreq: base * 1.5, type: "square", duration: 0.05, gain: 0.1 });
  }

  /**
   * The final summon reveal stinger - a boom plus a rising chord. Grander for
   * higher rarities (deeper boom + more chord notes).
   */
  playReveal(rarity: Rarity): void {
    const tier = Math.max(0, RARITY_ORDER.indexOf(rarity)); // 0..4
    this.noise({ duration: 0.4, gain: 0.28 + tier * 0.04, cutoff: 1100 + tier * 450 });
    this.tone({ freq: 120, endFreq: 55, type: "sine", duration: 0.5, gain: 0.3 });
    const chord = [523, 659, 784, 988, 1319];
    for (let i = 0; i <= tier; i++) {
      this.tone({
        freq: chord[i],
        type: "triangle",
        duration: 0.5 - i * 0.03,
        gain: 0.12,
        delay: 0.05 * i,
      });
    }
  }

  // ---- Synth primitives ---------------------------------------------------

  private tone(opts: ToneOptions): void {
    if (!this.enabled || !this.ctx || !this.master) return;
    const {
      freq,
      endFreq = freq,
      type = "sine",
      duration = 0.12,
      gain = 0.2,
      delay = 0,
    } = opts;

    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), t0 + duration);
    }

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(gain, t0 + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    osc.connect(env).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  private noise(opts: NoiseOptions): void {
    if (!this.enabled || !this.ctx || !this.master) return;
    const { duration = 0.18, gain = 0.25, cutoff = 2000, delay = 0 } = opts;

    const t0 = this.ctx.currentTime + delay;
    const frames = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, frames, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = cutoff;

    const env = this.ctx.createGain();
    env.gain.setValueAtTime(gain, t0);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    src.connect(filter).connect(env).connect(this.master);
    src.start(t0);
    src.stop(t0 + duration);
  }
}
