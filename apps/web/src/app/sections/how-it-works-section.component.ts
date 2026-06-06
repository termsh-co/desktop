import { Component, signal } from "@angular/core";
import { WORKFLOW_STEPS } from "../../data/marketing-data";
import { MarketingIconComponent } from "../shared/marketing-icon.component";

@Component({
  selector: "termsh-how-it-works-section",
  standalone: true,
  imports: [MarketingIconComponent],
  template: `
    <section
      id="how-it-works"
      class="workflow"
      aria-labelledby="workflow-title"
      (mouseenter)="paused.set(true)"
      (mouseleave)="paused.set(false)"
    >
      <div class="workflow__ambient" aria-hidden></div>
      <header class="workflow__header">
        <p class="workflow__eyebrow">Workflow</p>
        <h2 id="workflow-title" class="workflow__title">
          Up and running in <span class="workflow__title-accent">minutes</span>
        </h2>
        <p class="workflow__lead">No cloud signup for Phase 1. Install, unlock, connect.</p>
      </header>

      <ol class="workflow__steps" role="tablist" aria-label="Workflow steps">
        @for (step of steps; track step.id; let i = $index) {
          <li role="presentation">
            <button
              type="button"
              role="tab"
              [attr.aria-selected]="active() === i"
              class="workflow__step"
              [class.is-active]="active() === i"
              (click)="active.set(i)"
            >
              <div class="workflow__step-icon">
                <termsh-marketing-icon [name]="step.icon" />
              </div>
              <span class="workflow__step-index">{{ stepLabel(i) }}</span>
              <span class="workflow__step-title">{{ step.title }}</span>
              <p class="workflow__step-desc" [attr.aria-hidden]="active() !== i">{{ step.description }}</p>
              <span class="workflow__step-line" aria-hidden></span>
            </button>
          </li>
        }
      </ol>
    </section>
  `,
})
export class HowItWorksSectionComponent {
  readonly steps = WORKFLOW_STEPS;
  readonly active = signal(0);
  readonly paused = signal(false);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.timer = setInterval(() => {
      if (!this.paused()) {
        this.active.update((v) => (v + 1) % this.steps.length);
      }
    }, 4800);
  }

  stepLabel(i: number) {
    return String(i + 1).padStart(2, "0");
  }
}
