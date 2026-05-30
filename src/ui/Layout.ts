/**
 * Sizes the fixed 9:16 stage to fit the viewport (letterboxed) and publishes a
 * `--frame-unit` CSS variable (1% of frame width) so all UI scales with it.
 * Reports the canvas pixel size back to the caller for the renderer.
 */
export class Layout {
  private readonly aspectW = 9;
  private readonly aspectH = 16;

  constructor(
    private readonly frame: HTMLElement,
    private readonly onResize: (width: number, height: number) => void
  ) {
    window.addEventListener("resize", () => this.apply());
    window.addEventListener("orientationchange", () => this.apply());
  }

  apply(): void {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let height = vh;
    let width = (height * this.aspectW) / this.aspectH;
    if (width > vw) {
      width = vw;
      height = (width * this.aspectH) / this.aspectW;
    }

    this.frame.style.width = `${width}px`;
    this.frame.style.height = `${height}px`;
    this.frame.style.setProperty("--frame-unit", `${width / 100}px`);

    this.onResize(width, height);
  }
}
