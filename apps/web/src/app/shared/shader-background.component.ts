import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild } from "@angular/core";
import { createShader, type PresetConfig } from "shaders/js";

const HERO_SHADER_PRESET: PresetConfig = {
  components: [
    { type: "SolidColor", props: { color: "#08071a" } },
    {
      type: "SineWave",
      props: {
        amplitude: 0.36,
        blendMode: "normal-oklch",
        color: "#248eff",
        frequency: 0.2,
        position: { x: 0.65, y: 0.67 },
        softness: 0.55,
        speed: 0.3,
        thickness: 0.72,
      },
    },
    {
      type: "SineWave",
      props: {
        amplitude: 0.17,
        blendMode: "normal-oklch",
        color: "#1a6fd4",
        frequency: 0.2,
        position: { x: 0.6, y: 0.51 },
        softness: 0.54,
        speed: 0.5,
        thickness: 0.35,
      },
    },
    {
      type: "WaveDistortion",
      props: { angle: 299, frequency: 0.3, speed: 0.2, strength: 1 },
    },
    { type: "FilmGrain", props: { strength: 0.06 } },
  ],
};

@Component({
  selector: "termsh-shader-background",
  standalone: true,
  template: `<div class="shader-layer" #host><canvas #canvas></canvas></div>`,
})
export class ShaderBackgroundComponent implements AfterViewInit, OnDestroy {
  @ViewChild("host") hostRef!: ElementRef<HTMLDivElement>;
  @ViewChild("canvas") canvasRef!: ElementRef<HTMLCanvasElement>;

  private shader: Awaited<ReturnType<typeof createShader>> | null = null;
  private ro: ResizeObserver | null = null;

  ngAfterViewInit() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    void this.boot();
  }

  private async boot() {
    const canvas = this.canvasRef.nativeElement;
    const host = this.hostRef.nativeElement;
    this.syncCanvasSize(canvas, host);

    try {
      this.shader = await createShader(canvas, HERO_SHADER_PRESET, {
        observeElement: false,
      });

      this.ro = new ResizeObserver(() => {
        const { width, height } = this.syncCanvasSize(canvas, host);
        this.shader?.resize(width, height);
      });
      this.ro.observe(host);
    } catch (err) {
      console.warn("Hero shader unavailable, using CSS fallback.", err);
    }
  }

  private syncCanvasSize(canvas: HTMLCanvasElement, host: HTMLElement) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { width, height } = host.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    return { width, height };
  }

  ngOnDestroy() {
    this.ro?.disconnect();
    this.shader?.destroy();
    this.shader = null;
  }
}
