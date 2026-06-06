import { Component, Input } from "@angular/core";
import { PRICING_COMPARE_GROUPS, type CompareCellValue } from "../../data/marketing-data";
import { MarketingIconComponent } from "../shared/marketing-icon.component";

const TIERS = [
  { key: "desktop" as const, label: "Desktop", current: true },
  { key: "pro" as const, label: "Pro" },
  { key: "team" as const, label: "Team" },
];

@Component({
  selector: "termsh-compare-cell",
  standalone: true,
  imports: [MarketingIconComponent],
  template: `
    @if (value === true) {
      <span class="pricing-compare__mark pricing-compare__mark--yes" [attr.aria-label]="label">
        <termsh-marketing-icon name="check" [size]="14" />
      </span>
    } @else if (value === false) {
      <span class="pricing-compare__mark pricing-compare__mark--no" [attr.aria-label]="label"><span aria-hidden>—</span></span>
    } @else if (value === 'soon') {
      <span class="pricing-compare__mark pricing-compare__mark--soon" [attr.aria-label]="label">Soon</span>
    } @else {
      <span class="pricing-compare__mark pricing-compare__mark--label" [attr.aria-label]="label">{{ value }}</span>
    }
  `,
})
export class CompareCellComponent {
  @Input({ required: true }) value!: CompareCellValue;

  get label(): string {
    if (this.value === true) return "Included";
    if (this.value === false) return "Not included";
    if (this.value === "soon") return "Coming soon";
    return String(this.value);
  }
}

@Component({
  selector: "termsh-pricing-compare-section",
  standalone: true,
  imports: [MarketingIconComponent, CompareCellComponent],
  template: `
    <section class="pricing-compare" aria-labelledby="pricing-compare-title">
      <header class="pricing-compare__head">
        <p class="section-eyebrow">Compare</p>
        <h2 id="pricing-compare-title" class="pricing-compare__title">Feature comparison</h2>
        <p class="pricing-compare__lead">Desktop, Pro, and Team — what you get today and what's on the roadmap.</p>
      </header>

      <p class="pricing-compare__key" aria-hidden>
        <span class="pricing-compare__key-item">
          <termsh-marketing-icon name="check" [size]="12" /> Included
        </span>
        <span class="pricing-compare__key-item"><span class="pricing-compare__key-dash" aria-hidden>—</span> Not included</span>
        <span class="pricing-compare__key-item"><span class="pricing-compare__key-soon" aria-hidden>Soon</span> Roadmap</span>
        <span class="pricing-compare__key-item"><span class="pricing-compare__key-label" aria-hidden>Beta</span> Early access</span>
      </p>

      <div class="pricing-compare__matrix">
        <table class="pricing-compare__table">
          <thead>
            <tr class="pricing-compare__head-row">
              <th scope="col" class="pricing-compare__col-feature"><span class="sr-only">Feature</span></th>
              @for (tier of tiers; track tier.key) {
                <th scope="col" class="pricing-compare__col-tier" [class.is-current]="tier.current">
                  <span class="pricing-compare__tier-label">{{ tier.label }}</span>
                  @if (tier.current) {
                    <span class="pricing-compare__tier-tag">Now</span>
                  }
                </th>
              }
            </tr>
          </thead>
          <tbody>
            @for (group of groups; track group.label; let gi = $index) {
              <tr class="pricing-compare__group-row" [class.has-rule]="gi > 0">
                <th scope="colgroup" colspan="4">{{ group.label }}</th>
              </tr>
              @for (row of group.rows; track row.feature) {
                <tr class="pricing-compare__data-row">
                  <th scope="row" class="pricing-compare__col-feature">{{ row.feature }}</th>
                  <td class="pricing-compare__col-tier is-current">
                    <termsh-compare-cell [value]="row.desktop" />
                  </td>
                  <td class="pricing-compare__col-tier">
                    <termsh-compare-cell [value]="row.pro" />
                  </td>
                  <td class="pricing-compare__col-tier">
                    <termsh-compare-cell [value]="row.team" />
                  </td>
                </tr>
              }
            }
          </tbody>
        </table>
      </div>
    </section>
  `,
})
export class PricingCompareSectionComponent {
  readonly groups = PRICING_COMPARE_GROUPS;
  readonly tiers = TIERS;
}
