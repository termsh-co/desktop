import { Component } from "@angular/core";
import { RouterLink, RouterOutlet } from "@angular/router";
import { LandingLogoComponent } from "../shared/landing-logo.component";

@Component({
  selector: "termsh-auth-layout",
  standalone: true,
  imports: [RouterOutlet, RouterLink, LandingLogoComponent],
  template: `
    <div class="auth-layout">
      <div class="auth-layout__glow" aria-hidden></div>
      <header class="auth-layout__header">
        <a routerLink="/" class="auth-layout__logo" aria-label="termsh home">
          <termsh-landing-logo />
        </a>
      </header>
      <div class="auth-layout__main auth-layout__main--animate">
        <router-outlet />
      </div>
      <footer class="auth-layout__footer">
        <a routerLink="/" class="auth-layout__back">← Back to site</a>
      </footer>
    </div>
  `,
})
export class AuthLayoutComponent {}
