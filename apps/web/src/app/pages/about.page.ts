import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { ABOUT_PHASES, ABOUT_VALUES, CONTACT_EMAIL } from "../../data/marketing-data";
import { PageHeroAccentComponent, PageHeroComponent } from "../shared/page-hero.component";
import { MarketingIconComponent } from "../shared/marketing-icon.component";

@Component({
  selector: "termsh-about-page",
  standalone: true,
  imports: [RouterLink, PageHeroComponent, PageHeroAccentComponent, MarketingIconComponent],
  template: `
    <main class="about-page">
      <termsh-page-hero
        eyebrow="Company"
        titleId="about-title"
        lead="termsh is a lightweight cross-platform SSH client from Monolit Digital — for people who spend their day in the command line and want fewer context switches."
        [hasActions]="true"
      >
        <span hero-title>SSH terminal, built by <termsh-page-hero-accent>engineers</termsh-page-hero-accent></span>
        <ng-container hero-actions>
          <a routerLink="/" fragment="download" class="btn-solid">Download desktop</a>
          <a [href]="'mailto:' + contactEmail" class="btn-ghost">Get in touch</a>
        </ng-container>
      </termsh-page-hero>

      <section class="about-story" aria-labelledby="about-story-title">
        <div class="about-story__copy">
          <p class="section-eyebrow">Our story</p>
          <h2 id="about-story-title" class="about-story__title">
            Termius showed what a modern SSH client could feel like. We wanted that speed — without the bloat.
          </h2>
          <p class="about-story__body">
            termsh started as an internal tool: one native app for local shells, saved hosts, and credentials that stay
            encrypted on disk. We are shipping it openly so operators, freelancers, and platform teams can replace a
            patchwork of Terminal tabs, .env files, and ad-hoc SSH configs.
          </p>
          <p class="about-story__body">
            We are a small studio. That means direct feedback loops, fast iteration on the desktop client, and no
            enterprise theatre before the product earns it.
          </p>
        </div>
        <figure class="about-story__figure">
          <img src="/screenshots/host-grid.webp" alt="termsh host grid and session launcher" width="720" height="480" loading="lazy" />
        </figure>
      </section>

      <section class="about-values" aria-labelledby="about-values-title">
        <header class="about-section-head about-section-head--center">
          <p class="section-eyebrow">Principles</p>
          <h2 id="about-values-title" class="about-section-title">How we build</h2>
        </header>
        <ul class="about-values__grid">
          @for (value of values; track value.title) {
            <li class="about-values__item">
              <termsh-marketing-icon [name]="value.icon" className="about-values__icon" />
              <h3 class="about-values__name">{{ value.title }}</h3>
              <p class="about-values__desc">{{ value.description }}</p>
            </li>
          }
        </ul>
      </section>

      <section class="about-phases" aria-labelledby="about-phases-title">
        <header class="about-section-head">
          <p class="section-eyebrow">Roadmap</p>
          <h2 id="about-phases-title" class="about-section-title">Where we are headed</h2>
          <p class="about-section-lead">
            Phase 1 is the full focus. Later tiers are designed, not vaporware — timelines shift with beta feedback.
          </p>
        </header>
        <ol class="about-phases__list">
          @for (phase of phases; track phase.label) {
            <li class="about-phases__item">
              <span class="about-phases__tag about-phases__tag--{{ phase.status }}">{{ phaseStatus(phase.status) }}</span>
              <h3 class="about-phases__name">{{ phase.label }}</h3>
              <p class="about-phases__summary">{{ phase.summary }}</p>
            </li>
          }
        </ol>
      </section>

      <section class="about-studio" aria-labelledby="about-studio-title">
        <div class="about-studio__card">
          <p class="section-eyebrow">Studio</p>
          <h2 id="about-studio-title" class="about-studio__title">Made by Monolit Digital</h2>
          <p class="about-studio__body">
            termsh is designed and developed by
            <a href="https://monolitdigital.com" class="about-studio__link" target="_blank" rel="noopener noreferrer">Monolit Digital</a>,
            a product studio focused on developer tools that respect your time and your data.
          </p>
          <p class="about-studio__body">
            Questions, partnerships, or press —
            <a [href]="'mailto:' + contactEmail" class="about-studio__link">{{ contactEmail }}</a>.
          </p>
        </div>
      </section>

      <section class="about-cta" aria-label="Next steps">
        <div class="about-cta__inner">
          <h2 class="about-cta__title">Try termsh on your machine</h2>
          <p class="about-cta__lead">Free during Phase 1 beta. No account required — your vault stays local.</p>
          <div class="about-cta__actions">
            <a routerLink="/" fragment="download" class="btn-solid">Download for desktop</a>
            <a routerLink="/pricing" class="btn-ghost">View pricing</a>
          </div>
        </div>
      </section>
    </main>
  `,
})
export class AboutPage {
  readonly values = ABOUT_VALUES;
  readonly phases = ABOUT_PHASES;
  readonly contactEmail = CONTACT_EMAIL;

  phaseStatus(status: "now" | "beta" | "next" | "later") {
    if (status === "now") return "Now";
    if (status === "beta") return "Beta";
    if (status === "next") return "Next";
    return "Later";
  }
}
