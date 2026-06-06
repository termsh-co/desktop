import { Component } from "@angular/core";
import { IconPipelineComponent } from "../shared/icon-pipeline.component";
import { ShaderBackgroundComponent } from "../shared/shader-background.component";

@Component({
  selector: "termsh-hero-card",
  standalone: true,
  imports: [ShaderBackgroundComponent, IconPipelineComponent],
  template: `
    <section class="hero-card" id="hero">
      <termsh-shader-background />
      <div class="grid-overlay" aria-hidden></div>
      <div class="hero-content-layer">
        <termsh-icon-pipeline />
        <div style="max-width: 620px; width: 100%">
          <h1 class="hero-heading">
            SSH terminal,
            <strong>built for speed</strong>
          </h1>
          <p class="hero-subtitle">
            termsh is a lightweight cross-platform terminal — local shell, SSH hosts, and an encrypted
            vault in one native app.
          </p>
          <a href="#download" class="btn-cta">Download for desktop</a>
        </div>
      </div>
    </section>
  `,
})
export class HeroCardComponent {}
