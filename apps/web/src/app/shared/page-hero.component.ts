import { Component, Input } from "@angular/core";

@Component({
  selector: "termsh-page-hero",
  standalone: true,
  template: `
    <section class="page-hero" [attr.aria-labelledby]="titleId">
      <div class="page-hero__grid" aria-hidden></div>
      <div class="page-hero__glow" aria-hidden></div>
      <div class="page-hero__inner page-hero__inner--animate">
        <p class="page-hero__eyebrow">{{ eyebrow }}</p>
        <h1 [id]="titleId" class="page-hero__title">
          <ng-content select="[hero-title]"></ng-content>
        </h1>
        <p class="page-hero__lead">{{ lead }}</p>
        <div class="page-hero__actions">
          <ng-content select="[hero-actions]"></ng-content>
        </div>
        <ng-content></ng-content>
      </div>
    </section>
  `,
})
export class PageHeroComponent {
  @Input({ required: true }) eyebrow!: string;
  @Input({ required: true }) titleId!: string;
  @Input({ required: true }) lead!: string;
  @Input() hasActions = false;
}

@Component({
  selector: "termsh-page-hero-accent",
  standalone: true,
  template: `<span class="page-hero__title-accent"><ng-content></ng-content></span>`,
})
export class PageHeroAccentComponent {}
