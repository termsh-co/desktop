import { Component, ElementRef, HostListener, inject, signal } from "@angular/core";
import { FEATURES } from "../../data/marketing-data";

@Component({
  selector: "termsh-features-section",
  standalone: true,
  template: `
    <section id="features" class="product-scroll" #section>
      <div class="product-scroll__layout">
        <aside class="product-scroll__aside">
          <p class="product-scroll__eyebrow">Product</p>
          <h2 class="product-scroll__title">
            Infrastructure work,
            <span class="product-scroll__title-accent"> simplified</span>
          </h2>
          <p class="product-scroll__lead">
            Everything you need to manage servers from a native desktop app — without leaving the terminal
            metaphor.
          </p>
          <div class="product-scroll__progress" aria-hidden>
            <div class="product-scroll__progress-bar" [style.transform]="'scaleX(' + progress() + ')'"></div>
          </div>
          <p class="product-scroll__hint">Scroll to explore</p>
        </aside>

        <div class="product-scroll__track">
          @for (feature of features; track feature.title; let i = $index) {
            <article class="product-item">
              <div class="product-item__content">
                <span class="product-item__step">{{ stepLabel(i) }}</span>
                <h3 class="product-item__title">{{ feature.title }}</h3>
                <p class="product-item__desc">{{ feature.description }}</p>
              </div>
              <figure class="product-item__figure">
                <img [src]="feature.image" [alt]="feature.imageAlt" loading="lazy" decoding="async" />
              </figure>
            </article>
          }
        </div>
      </div>
    </section>
  `,
})
export class FeaturesSectionComponent {
  private readonly el = inject(ElementRef<HTMLElement>);
  readonly features = FEATURES;
  readonly progress = signal(0);

  stepLabel(i: number) {
    return String(i + 1).padStart(2, "0");
  }

  @HostListener("window:scroll")
  onScroll() {
    const node = this.el.nativeElement;
    const rect = node.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = node.offsetHeight - vh;
    if (total <= 0) return;
    const scrolled = Math.min(Math.max(-rect.top, 0), total);
    this.progress.set(scrolled / total);
  }
}
