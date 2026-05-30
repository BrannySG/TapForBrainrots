/**
 * Converts passive DPS (from brainrots + upgrades) into discrete damage over
 * time. Fractional damage is accumulated so low DPS still lands eventually and
 * the result is frame-rate independent.
 */
export class PassiveSystem {
  private accumulator = 0;

  update(
    dt: number,
    passiveDps: number,
    applyDamage: (amount: number, isTap: boolean) => void
  ): void {
    if (passiveDps <= 0) return;
    this.accumulator += passiveDps * dt;
    const whole = Math.floor(this.accumulator);
    if (whole >= 1) {
      this.accumulator -= whole;
      applyDamage(whole, false);
    }
  }

  reset(): void {
    this.accumulator = 0;
  }
}
