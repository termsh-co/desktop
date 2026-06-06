import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { SECURITY_PILLARS } from "../../lib/security-content";
import { SITE_LINKS } from "../../lib/site-links";
import { MarketingIconComponent } from "../shared/marketing-icon.component";

@Component({
  selector: "termsh-security-section",
  standalone: true,
  imports: [RouterLink, MarketingIconComponent],
  template: `
    <section id="security" class="security" aria-labelledby="home-security-title">
      <header class="security__header">
        <p class="security__eyebrow">Security</p>
        <h2 id="home-security-title" class="security__title">
          Enterprise-grade habits,
          <span class="security__title-accent">indie speed</span>
        </h2>
        <p class="security__lead">
          We design for operators who rotate keys and hate credential sprawl — without selling features we
          have not built.
          <a [routerLink]="siteLinks.trust.security" class="security__more">Read the security overview</a>
        </p>
      </header>

      <ul class="security__points">
        @for (pillar of pillars; track pillar.title) {
          <li class="security__point">
            <div class="security__point-icon" aria-hidden>
              <termsh-marketing-icon [name]="pillar.icon" />
            </div>
            <h3 class="security__point-title">{{ pillar.title }}</h3>
            <p class="security__point-desc">{{ pillar.description }}</p>
          </li>
        }
      </ul>
    </section>
  `,
})
export class SecuritySectionComponent {
  readonly pillars = SECURITY_PILLARS;
  readonly siteLinks = SITE_LINKS;
}
