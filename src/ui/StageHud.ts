import type { GameCore } from "../core/GameCore";
import type { EventBus } from "../core/events/EventBus";
import { el } from "./dom";

/**
 * Stage objective HUD: the skull kill counter, the boss DPS-check timer, an
 * "Entering Stage N" banner, plus the Auto-Progress toggle and Retry Boss
 * button. Purely reactive to core events; never mutates game state directly.
 */
export class StageHud {
  private readonly objective = el("div", "stage-objective");
  private readonly killText = el("span", "stage-count");
  private readonly timer = el("div", "stage-timer");
  private readonly timerText = el("span", "stage-timer-text");
  private readonly banner = el("div", "stage-banner");
  private readonly autoBtn = el("button", "stage-btn") as HTMLButtonElement;
  private readonly retryBtn = el("button", "stage-btn stage-btn-retry") as HTMLButtonElement;

  private bannerTimeout = 0;

  constructor(parent: HTMLElement, core: GameCore, bus: EventBus) {
    // Objective + timer sit just under the target name.
    const top = el("div", "stage-hud");
    const skull = el("span", "stage-glyph");
    skull.textContent = "\u{1F480}"; // skull
    this.objective.append(skull, this.killText);

    const clock = el("span", "stage-glyph");
    clock.textContent = "\u{1F552}"; // clock
    this.timer.append(clock, this.timerText);
    top.append(this.objective, this.timer);
    parent.append(top, this.banner);

    // Controls live above the bottom nav so they don't cover the target.
    const controls = el("div", "stage-controls");
    this.autoBtn.addEventListener("click", () => {
      core.setAutoProgress(!core.getState().autoProgress);
    });
    this.retryBtn.textContent = "Retry Boss";
    this.retryBtn.addEventListener("click", () => {
      if (core.retryBoss()) this.setRetryVisible(false);
    });
    controls.append(this.autoBtn, this.retryBtn);
    parent.append(controls);

    const snap = core.getSnapshot();
    this.setObjective(snap.stageKills, snap.stageRequired);
    this.setTimerVisible(snap.isBossStage);
    if (snap.isBossStage) this.setTimer(snap.bossTimer);
    this.setAuto(snap.autoProgress);
    this.setRetryVisible(snap.failedBossStage != null);

    bus.on("stageProgress", ({ kills, required, isBoss }) => {
      this.setObjective(kills, required);
      this.setTimerVisible(isBoss);
    });
    bus.on("bossTick", ({ remaining }) => this.setTimer(remaining));
    bus.on("stageEntered", ({ stage, worldName, isBoss }) => {
      this.showBanner(
        isBoss
          ? "Boss Stage! Defeat it before time runs out!"
          : `Entering ${worldName} - Stage ${stage}`,
        isBoss
      );
    });
    bus.on("bossFailed", () => {
      this.showBanner("Boss Failed!", true);
      this.setRetryVisible(true);
    });
    bus.on("bossDefeated", () => this.setRetryVisible(false));
    bus.on("autoProgressChanged", ({ on }) => this.setAuto(on));
  }

  private setObjective(kills: number, required: number): void {
    this.killText.textContent = `${kills} / ${required}`;
  }

  private setTimer(remaining: number): void {
    this.timerText.textContent = `${Math.max(0, remaining).toFixed(1)} sec`;
  }

  private setTimerVisible(visible: boolean): void {
    this.timer.style.display = visible ? "inline-flex" : "none";
  }

  private setAuto(on: boolean): void {
    this.autoBtn.textContent = on ? "Auto: ON" : "Auto: OFF";
    this.autoBtn.classList.toggle("on", on);
  }

  private setRetryVisible(visible: boolean): void {
    this.retryBtn.style.display = visible ? "inline-flex" : "none";
  }

  private showBanner(text: string, boss: boolean): void {
    this.banner.textContent = text;
    this.banner.classList.toggle("boss", boss);
    this.banner.classList.add("show");
    if (this.bannerTimeout) window.clearTimeout(this.bannerTimeout);
    this.bannerTimeout = window.setTimeout(() => {
      this.banner.classList.remove("show");
    }, 1800);
  }
}
