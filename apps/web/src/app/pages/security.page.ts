import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import {
  SECURITY_DETAILS,
  SECURITY_PILLARS,
  SECURITY_PRACTICES,
} from "../../lib/security-content";
import { SITE_LINKS } from "../../lib/site-links";
import { PageHeroAccentComponent, PageHeroComponent } from "../shared/page-hero.component";

@Component({
  selector: "termsh-security-page",
  standalone: true,
  imports: [RouterLink, PageHeroComponent, PageHeroAccentComponent],
  template: `
    <main class="sec-page">
      <termsh-page-hero
        eyebrow="Trust"
        titleId="security-page-title"
        lead="Phase 1 is local-first. No cloud account, no sync — just a native vault and SSH client built for operators who rotate keys for a living."
        [hasActions]="true"
      >
        <span hero-title>Credentials stay <termsh-page-hero-accent>on your machine</termsh-page-hero-accent></span>
        <ng-container hero-actions>
          <a [href]="siteLinks.legal.disclosure" class="btn-solid">Report a vulnerability</a>
          <a [routerLink]="siteLinks.trust.trustCenter" class="btn-ghost">Trust Center</a>
        </ng-container>
      </termsh-page-hero>

      <div class="sec-scroll">
        <div class="sec-scroll__layout">
          <aside class="sec-scroll__rail" aria-label="Page sections">
            <p class="sec-scroll__rail-eyebrow">Security</p>
            <ol class="sec-scroll__rail-list">
              @for (slice of slices; track slice.id) {
                <li class="sec-scroll__rail-item">
                  <span class="sec-scroll__rail-ix">{{ slice.index }}</span>
                  <span class="sec-scroll__rail-label">{{ slice.label }}</span>
                </li>
              }
            </ol>
          </aside>

          <div class="sec-scroll__track">
            <section id="principles" class="sec-slice" aria-labelledby="principles-title" data-slice="01">
              <div class="sec-slice__marker" aria-hidden>
                <span class="sec-slice__marker-ix">01</span>
                <span class="sec-slice__marker-label">Principles</span>
              </div>
              <div class="sec-slice__inner">
                <header class="sec-slice__head">
                  <h2 id="principles-title" class="sec-slice__title">Three commitments</h2>
                  <p class="sec-slice__lead">What we optimize for before any enterprise checkbox.</p>
                </header>
                <div class="sec-slice__body">
                  <div class="sec-panels">
                    @for (pillar of pillars; track pillar.title; let i = $index) {
                      <article class="sec-panel">
                        <span class="sec-panel__ix" aria-hidden>{{ step(i) }}</span>
                        <div class="sec-panel__body">
                          <h3 class="sec-panel__title">{{ pillar.title }}</h3>
                          <div class="sec-panel__content"><p>{{ pillar.description }}</p></div>
                        </div>
                      </article>
                    }
                  </div>
                </div>
              </div>
            </section>

            <section id="phase-1" class="sec-slice" aria-labelledby="phase-1-title" data-slice="02">
              <div class="sec-slice__marker" aria-hidden>
                <span class="sec-slice__marker-ix">02</span>
                <span class="sec-slice__marker-label">Phase 1</span>
              </div>
              <div class="sec-slice__inner">
                <header class="sec-slice__head">
                  <h2 id="phase-1-title" class="sec-slice__title">Desktop technical summary</h2>
                  <p class="sec-slice__lead">Tauri on your machine. Nothing here requires termsh cloud or a login.</p>
                </header>
                <div class="sec-slice__body">
                  <ul class="sec-spec">
                    @for (row of details; track row.term) {
                      <li class="sec-spec__row">
                        <span class="sec-spec__term">{{ row.term }}</span>
                        <span class="sec-spec__detail">{{ row.detail }}</span>
                      </li>
                    }
                  </ul>
                </div>
              </div>
            </section>

            <section id="practices" class="sec-slice" aria-labelledby="practices-title" data-slice="03">
              <div class="sec-slice__marker" aria-hidden>
                <span class="sec-slice__marker-ix">03</span>
                <span class="sec-slice__marker-label">Practices</span>
              </div>
              <div class="sec-slice__inner">
                <header class="sec-slice__head">
                  <h2 id="practices-title" class="sec-slice__title">How we build and ship</h2>
                  <p class="sec-slice__lead">Security reviews should read like engineering notes — not marketing PDFs.</p>
                </header>
                <div class="sec-slice__body">
                  <div class="sec-notes">
                    @for (item of practices; track item.title) {
                      <div class="sec-note">
                        <p class="sec-note__title">{{ item.title }}</p>
                        <p class="sec-note__desc">{{ item.description }}</p>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </section>

            <section id="disclosure" class="sec-slice" aria-labelledby="disclosure-title" data-slice="04">
              <div class="sec-slice__marker" aria-hidden>
                <span class="sec-slice__marker-ix">04</span>
                <span class="sec-slice__marker-label">Disclosure</span>
              </div>
              <div class="sec-slice__inner">
                <header class="sec-slice__head">
                  <h2 id="disclosure-title" class="sec-slice__title">Found something?</h2>
                  <p class="sec-slice__lead">Coordinated reports help us fix issues before they spread. Include reproduction steps and impact.</p>
                </header>
                <div class="sec-slice__body">
                  <div class="sec-outro">
                    <div class="sec-outro__links">
                      <a [href]="siteLinks.legal.disclosure" class="sec-outro__link sec-outro__link--primary">Report a vulnerability</a>
                      <a [routerLink]="siteLinks.legal.privacy" class="sec-outro__link">Privacy Policy</a>
                      <a [routerLink]="siteLinks.trust.trustCenter" class="sec-outro__link">Trust Center</a>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  `,
})
export class SecurityPage {
  readonly siteLinks = SITE_LINKS;
  readonly pillars = SECURITY_PILLARS;
  readonly details = SECURITY_DETAILS;
  readonly practices = SECURITY_PRACTICES;
  readonly slices = [
    { id: "principles", index: "01", label: "Principles" },
    { id: "phase-1", index: "02", label: "Phase 1" },
    { id: "practices", index: "03", label: "Practices" },
    { id: "disclosure", index: "04", label: "Disclosure" },
  ];

  step(i: number) {
    return String(i + 1).padStart(2, "0");
  }
}
