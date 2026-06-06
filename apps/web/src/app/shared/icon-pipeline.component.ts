import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
} from "@angular/core";
import { LandingLogoComponent } from "./landing-logo.component";
import { MarketingIconComponent } from "./marketing-icon.component";
import { createPipelineAnimator } from "./icon-pipeline.anim";

const ICON_STROKE = "rgba(255, 255, 255, 0.82)";

@Component({
  selector: "termsh-icon-pipeline",
  standalone: true,
  imports: [LandingLogoComponent, MarketingIconComponent],
  template: `
    <div class="pipeline" #root data-phase="idle">
      <svg class="pipeline-beam-svg" aria-hidden>
        <defs>
          <radialGradient id="pipeline-comet-gradient">
            <stop offset="0%" stop-color="#ffffff" />
            <stop offset="45%" stop-color="#9ecfff" />
            <stop offset="100%" stop-color="rgba(36, 142, 255, 0)" />
          </radialGradient>
          <filter id="pipeline-comet-blur" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="2.4" />
          </filter>
        </defs>
        <path #leftBeam class="pipeline-path pipeline-path--left" fill="none" />
        <path #rightBeam class="pipeline-path pipeline-path--right" fill="none" />
        <circle
          #cometTrail
          class="pipeline-comet-trail"
          r="5"
          fill="url(#pipeline-comet-gradient)"
          opacity="0"
        />
        <circle
          #comet
          class="pipeline-comet"
          r="2.2"
          fill="#ffffff"
          filter="url(#pipeline-comet-blur)"
          opacity="0"
        />
      </svg>

      <div #left class="pipeline-node pipeline-node-sm pipeline-node--emit-right">
        <span class="pipeline-node__ring" aria-hidden></span>
        <span class="pipeline-node__aura" aria-hidden></span>
        <termsh-marketing-icon name="terminal" [size]="20" [stroke]="iconStroke" />
      </div>

      <div class="pipeline-line" aria-hidden></div>

      <div class="pipeline-node-center-wrap">
        <div #center class="pipeline-node pipeline-node-lg pipeline-node-brand pipeline-node--hub">
          <span class="pipeline-node__ring" aria-hidden></span>
          <span class="pipeline-node__aura" aria-hidden></span>
          <termsh-landing-logo variant="mark" [size]="44" />
        </div>
      </div>

      <div class="pipeline-line pipeline-line-right" aria-hidden></div>

      <div #right class="pipeline-node pipeline-node-sm pipeline-node--emit-left">
        <span class="pipeline-node__ring" aria-hidden></span>
        <span class="pipeline-node__aura" aria-hidden></span>
        <termsh-marketing-icon name="server" [size]="20" [stroke]="iconStroke" />
      </div>
    </div>
  `,
})
export class IconPipelineComponent implements AfterViewInit, OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);

  @ViewChild("root") rootRef!: ElementRef<HTMLElement>;
  @ViewChild("left") leftRef!: ElementRef<HTMLElement>;
  @ViewChild("center") centerRef!: ElementRef<HTMLElement>;
  @ViewChild("right") rightRef!: ElementRef<HTMLElement>;
  @ViewChild("leftBeam") leftBeamRef!: ElementRef<SVGPathElement>;
  @ViewChild("rightBeam") rightBeamRef!: ElementRef<SVGPathElement>;
  @ViewChild("comet") cometRef!: ElementRef<SVGCircleElement>;
  @ViewChild("cometTrail") cometTrailRef!: ElementRef<SVGCircleElement>;

  readonly iconStroke = ICON_STROKE;

  private animator: ReturnType<typeof createPipelineAnimator> | null = null;
  private ro: ResizeObserver | null = null;

  ngAfterViewInit() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    this.animator = createPipelineAnimator({
      root: this.rootRef.nativeElement,
      left: this.leftRef.nativeElement,
      center: this.centerRef.nativeElement,
      right: this.rightRef.nativeElement,
      leftBeam: this.leftBeamRef.nativeElement,
      rightBeam: this.rightBeamRef.nativeElement,
      comet: this.cometRef.nativeElement,
      cometTrail: this.cometTrailRef.nativeElement,
    });

    this.ro = new ResizeObserver(() => this.animator?.onResize());
    this.ro.observe(this.host.nativeElement);
    window.addEventListener("resize", this.onResize);
  }

  private onResize = () => {
    this.animator?.onResize();
  };

  ngOnDestroy() {
    this.animator?.destroy();
    this.ro?.disconnect();
    window.removeEventListener("resize", this.onResize);
  }
}
