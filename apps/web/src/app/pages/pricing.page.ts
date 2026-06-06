import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { PRICING_FAQ, PRICING_TIERS } from "../../data/marketing-data";
import { PageHeroAccentComponent, PageHeroComponent } from "../shared/page-hero.component";
import { MarketingIconComponent } from "../shared/marketing-icon.component";
import { PricingCompareSectionComponent } from "../sections/pricing-compare-section.component";

@Component({
  selector: "termsh-pricing-page",
  standalone: true,
  imports: [
    RouterLink,
    PageHeroComponent,
    PageHeroAccentComponent,
    MarketingIconComponent,
    PricingCompareSectionComponent,
  ],
  template: `
    <main class="pricing-page">
      <termsh-page-hero
        eyebrow="Pricing"
        titleId="pricing-title"
        lead="Start free on desktop today. Pro and Team unlock sync and collaboration when we ship them — no surprise charges in Phase 1."
      >
        <span hero-title>Simple plans for <termsh-page-hero-accent>every stage</termsh-page-hero-accent></span>
      </termsh-page-hero>

      <ul class="pricing__tiers">
        @for (tier of tiers; track tier.name) {
          <li class="pricing-tier" [class.is-featured]="tier.featured" [class.is-soon]="tier.soon">
            <span class="pricing-tier__line" aria-hidden></span>
            @if (tier.badge) {
              <span class="pricing-tier__badge">{{ tier.badge }}</span>
            }
            <h2 class="pricing-tier__name">{{ tier.name }}</h2>
            <p class="pricing-tier__price">
              {{ tier.price }}
              <span class="pricing-tier__period"> / {{ tier.period }}</span>
            </p>
            <p class="pricing-tier__desc">{{ tier.description }}</p>
            <ul class="pricing-tier__features">
              @for (f of tier.features; track f) {
                <li>
                  <termsh-marketing-icon name="check" [size]="15" />
                  {{ f }}
                </li>
              }
            </ul>
            @if (tier.ctaDisabled) {
              <span class="pricing-tier__cta pricing-tier__cta--disabled">{{ tier.cta }}</span>
            } @else {
              <a
                [routerLink]="tier.ctaHref?.startsWith('/#') ? '/' : (tier.ctaHref ?? '/')"
                [fragment]="tier.ctaHref?.includes('#download') ? 'download' : undefined"
                class="pricing-tier__cta"
              >
                {{ tier.cta }}
              </a>
            }
          </li>
        }
      </ul>

      <termsh-pricing-compare-section />

      <section class="pricing-faq" aria-labelledby="pricing-faq-title">
        <h2 id="pricing-faq-title" class="pricing-faq__title">FAQ</h2>
        <dl class="pricing-faq__list">
          @for (item of faq; track item.q) {
            <div class="pricing-faq__item">
              <dt>{{ item.q }}</dt>
              <dd>{{ item.a }}</dd>
            </div>
          }
        </dl>
      </section>
    </main>
  `,
})
export class PricingPage {
  readonly tiers = PRICING_TIERS;
  readonly faq = PRICING_FAQ;
}
