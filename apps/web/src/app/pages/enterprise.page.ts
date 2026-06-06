import { Component, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import {
  ENTERPRISE_CAPABILITIES,
  ENTERPRISE_FAQ,
  ENTERPRISE_PLATFORMS,
  ENTERPRISE_SPLITS,
  type PlatformId,
} from "../../data/marketing-data";
import { COUNTRIES, getCountryByCode } from "../../data/countries";
import { PageHeroAccentComponent, PageHeroComponent } from "../shared/page-hero.component";
import { MarketingIconComponent } from "../shared/marketing-icon.component";
import { PlatformIconComponent } from "../shared/platform-icon.component";

@Component({
  selector: "termsh-enterprise-page",
  standalone: true,
  imports: [
    RouterLink,
    FormsModule,
    PageHeroComponent,
    PageHeroAccentComponent,
    MarketingIconComponent,
    PlatformIconComponent,
  ],
  template: `
    <main class="enterprise-page">
      <termsh-page-hero
        eyebrow="Enterprise"
        titleId="enterprise-title"
        lead="Keep operators in a fast native terminal while platform and security leads get shared vaults, SSO, and audit trails — without another bloated dev portal."
        [hasActions]="true"
      >
        <span hero-title>Modern SSH client built for <termsh-page-hero-accent>enterprise teams</termsh-page-hero-accent></span>
        <ng-container hero-actions>
          <a href="#enterprise-contact" class="btn-solid">Talk to sales</a>
          <a routerLink="/pricing" class="btn-ghost">View pricing</a>
        </ng-container>
      </termsh-page-hero>

      @for (split of splits; track split.title) {
        <section class="enterprise-split" [class.enterprise-split--reverse]="split.reverse">
          <div class="enterprise-split__copy">
            <p class="section-eyebrow">{{ split.eyebrow }}</p>
            <h2 class="enterprise-split__title">{{ split.title }}</h2>
            <p class="enterprise-split__desc">{{ split.description }}</p>
          </div>
          <figure class="enterprise-split__figure">
            <img [src]="split.image" [alt]="split.imageAlt" loading="lazy" />
          </figure>
        </section>
      }

      <section class="enterprise-split enterprise-platforms" aria-labelledby="enterprise-platforms-title">
        <div class="enterprise-split__copy">
          <p class="section-eyebrow">Cross-platform</p>
          <h2 id="enterprise-platforms-title" class="enterprise-split__title">One client across desktop and mobile</h2>
          <p class="enterprise-split__desc">
            termsh ships as native desktop and mobile apps — same vault, hosts, and terminal experience whether your
            team is at a desk or on call.
          </p>
        </div>
        <div class="enterprise-platforms__stage">
          <div class="enterprise-platforms__rail" role="list" (mouseleave)="activePlatform.set('macos')">
            @for (p of platforms; track p.id) {
              <button
                type="button"
                class="enterprise-platforms__chip"
                [class.is-active]="activePlatform() === p.id"
                (mouseenter)="activePlatform.set(p.id)"
                (focus)="activePlatform.set(p.id)"
              >
                <termsh-platform-icon [id]="p.id" />
                <span>{{ p.label }}</span>
                <span class="enterprise-platforms__phase">{{ p.phase === 'beta' ? 'Beta' : 'Roadmap' }}</span>
              </button>
            }
          </div>
          <p class="enterprise-platforms__caption">
            {{ activePlatformLabel() }} — {{ activePlatformPhase() }}
          </p>
        </div>
      </section>

      <section class="enterprise-capabilities" aria-labelledby="enterprise-capabilities-title">
        <header class="enterprise-capabilities__head">
          <p class="section-eyebrow">Capabilities</p>
          <h2 id="enterprise-capabilities-title" class="enterprise-capabilities__title">Built for platform teams</h2>
        </header>
        <ul class="enterprise-capabilities__grid">
          @for (cap of capabilities; track cap.title) {
            <li class="enterprise-capabilities__cell">
              <termsh-marketing-icon [name]="cap.icon" />
              <h3>{{ cap.title }}</h3>
              <p>{{ cap.description }}</p>
            </li>
          }
        </ul>
      </section>

      <section class="enterprise-faq" aria-labelledby="enterprise-faq-title">
        <header class="enterprise-faq__head">
          <p class="section-eyebrow">FAQ</p>
          <h2 id="enterprise-faq-title" class="enterprise-faq__title">Common questions</h2>
        </header>
        <div class="enterprise-faq__items">
          @for (item of faq; track item.q) {
            <details class="enterprise-faq__item">
              <summary class="enterprise-faq__summary">
                <span class="enterprise-faq__question">{{ item.q }}</span>
                <span class="enterprise-faq__chevron" aria-hidden></span>
              </summary>
              <div class="enterprise-faq__answer"><p>{{ item.a }}</p></div>
            </details>
          }
        </div>
      </section>

      <section id="enterprise-contact" class="enterprise-contact" aria-labelledby="enterprise-contact-title">
        <div class="enterprise-contact__glow" aria-hidden></div>
        <div class="enterprise-contact__inner">
          <h2 id="enterprise-contact-title" class="enterprise-contact__title">Talk to our enterprise team</h2>
          <p class="enterprise-contact__lead">
            Our team will be on hand to answer your questions and show you how termsh can empower your teams.
          </p>
          <form class="enterprise-form" (ngSubmit)="onSubmit($event)" novalidate>
            <div class="enterprise-form__row">
              <label class="enterprise-form__field">
                <span class="enterprise-form__label">First name *</span>
                <input class="enterprise-form__input" name="first_name" type="text" autocomplete="given-name" required />
              </label>
              <label class="enterprise-form__field">
                <span class="enterprise-form__label">Last name *</span>
                <input class="enterprise-form__input" name="last_name" type="text" autocomplete="family-name" required />
              </label>
            </div>
            <label class="enterprise-form__field">
              <span class="enterprise-form__label">Work email *</span>
              <input class="enterprise-form__input" name="email" type="email" autocomplete="email" placeholder="you@company.com" required />
            </label>
            <label class="enterprise-form__field">
              <span class="enterprise-form__label">Company name *</span>
              <input class="enterprise-form__input" name="company" type="text" autocomplete="organization" required />
            </label>
            <label class="enterprise-form__field">
              <span class="enterprise-form__label">Country / region *</span>
              <select class="enterprise-form__input enterprise-form__select" name="country" [(ngModel)]="countryCode" required>
                <option value="" disabled>Please select</option>
                @for (c of countries; track c.code) {
                  <option [value]="c.code">{{ c.flag }} {{ c.name }} ({{ c.dialCode }})</option>
                }
              </select>
            </label>
            <label class="enterprise-form__field">
              <span class="enterprise-form__label">Phone number *</span>
              <div class="enterprise-form__phone" [class.enterprise-form__phone--disabled]="!country()">
                <span class="enterprise-form__dial-display" aria-hidden>{{ country()?.dialCode ?? '+—' }}</span>
                <input
                  class="enterprise-form__input enterprise-form__input--inline"
                  name="phone"
                  type="tel"
                  autocomplete="tel-national"
                  [placeholder]="country() ? 'Phone number' : 'Select a country first'"
                  [disabled]="!country()"
                  [required]="!!country()"
                />
              </div>
            </label>
            <label class="enterprise-form__field">
              <span class="enterprise-form__label">Tell us a bit about your team</span>
              <textarea class="enterprise-form__input enterprise-form__input--area" name="message" rows="5" placeholder="Team size, compliance needs, how you manage SSH today…"></textarea>
            </label>
            <button type="submit" class="btn-solid btn-solid--block enterprise-form__submit">Contact sales</button>
          </form>
        </div>
      </section>
    </main>
  `,
})
export class EnterprisePage {
  readonly splits = ENTERPRISE_SPLITS;
  readonly platforms = ENTERPRISE_PLATFORMS;
  readonly capabilities = ENTERPRISE_CAPABILITIES;
  readonly faq = ENTERPRISE_FAQ;
  readonly countries = COUNTRIES;
  readonly activePlatform = signal<PlatformId>("macos");
  countryCode = "";

  country() {
    return getCountryByCode(this.countryCode);
  }

  activePlatformLabel() {
    return this.platforms.find((p) => p.id === this.activePlatform())?.label ?? "macOS";
  }

  activePlatformPhase() {
    const p = this.platforms.find((x) => x.id === this.activePlatform());
    return p?.phase === "beta" ? "Available in beta today" : "On the public roadmap";
  }

  onSubmit(e: Event) {
    e.preventDefault();
  }
}
