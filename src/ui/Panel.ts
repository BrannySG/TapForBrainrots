import { el } from "./dom";

/** Generic bottom-sheet panel with a title, close button, and a body slot. */
export class Panel {
  private readonly backdrop = el("div", "panel-backdrop");
  private readonly titleEl = el("div", "panel-title");
  readonly body = el("div", "panel-body");

  constructor(parent: HTMLElement, title: string) {
    const panel = el("div", "panel");
    const header = el("div", "panel-header");
    this.titleEl.textContent = title;

    const close = el("button", "panel-close", "\u00d7");
    close.addEventListener("click", () => this.close());

    header.append(this.titleEl, close);
    panel.append(header, this.body);
    this.backdrop.append(panel);

    // Click outside the panel closes it.
    this.backdrop.addEventListener("click", (e) => {
      if (e.target === this.backdrop) this.close();
    });

    parent.append(this.backdrop);
  }

  setTitle(title: string): void {
    this.titleEl.textContent = title;
  }

  open(): void {
    this.backdrop.classList.add("open");
  }

  close(): void {
    this.backdrop.classList.remove("open");
  }

  get isOpen(): boolean {
    return this.backdrop.classList.contains("open");
  }
}
