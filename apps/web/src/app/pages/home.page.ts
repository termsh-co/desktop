import { Component } from "@angular/core";
import { CtaSectionComponent } from "../sections/cta-section.component";
import { FeaturesSectionComponent } from "../sections/features-section.component";
import { HeroCardComponent } from "../sections/hero-card.component";
import { HowItWorksSectionComponent } from "../sections/how-it-works-section.component";
import { SecuritySectionComponent } from "../sections/security-section.component";

@Component({
  selector: "termsh-home-page",
  standalone: true,
  imports: [
    HeroCardComponent,
    FeaturesSectionComponent,
    HowItWorksSectionComponent,
    SecuritySectionComponent,
    CtaSectionComponent,
  ],
  template: `
    <termsh-hero-card />
    <termsh-features-section />
    <main class="site-main">
      <termsh-how-it-works-section />
      <termsh-security-section />
      <termsh-cta-section />
    </main>
  `,
})
export class HomePage {}
