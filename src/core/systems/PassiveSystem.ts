import { Balance } from "../config/balance";

/**
 * Converts passive DPS (from brainrots + upgrades) into discrete damage that
 * lands in clear pulses. Damage and elapsed time are accumulated; once a tick
 * interval elapses we flush the whole accumulated amount as a single hit. This
 * keeps damage frame-rate independent (and total DPS unchanged) while avoiding
 * the per-frame "vibrating" feedback of applying damage every frame.
 */
export class PassiveSystem {
  private damageAccumulator = 0;
  private timeAccumulator = 0;

  update(
    dt: number,
    passiveDps: number,
    applyDamage: (amount: number, isTap: boolean) => void
  ): void {
    if (passiveDps <= 0) return;

    this.damageAccumulator += passiveDps * dt;
    this.timeAccumulator += dt;

    const interval = Balance.passive.tickInterval;
    while (this.timeAccumulator >= interval) {
      this.timeAccumulator -= interval;
      const whole = Math.floor(this.damageAccumulator);
      if (whole >= 1) {
        this.damageAccumulator -= whole;
        applyDamage(whole, false);
      }
    }
  }

  reset(): void {
    this.damageAccumulator = 0;
    this.timeAccumulator = 0;
  }
}
