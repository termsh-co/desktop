import { Component, inject } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import {
  CONTACT_EMAIL,
  DEFAULT_LEGAL_LEAD,
  LEGAL_STUB_CONTENT,
} from "../../data/marketing-data";
import { PageHeroComponent } from "../shared/page-hero.component";

@Component({
  selector: "termsh-legal-stub-page",
  standalone: true,
  imports: [RouterLink, PageHeroComponent],
  template: `
    <main class="legal-page">
      <termsh-page-hero
        [eyebrow]="eyebrow"
        [titleId]="titleId"
        [lead]="lead"
        [hasActions]="true"
      >
        <span hero-title>{{ title }}</span>
        <a hero-actions [href]="'mailto:' + contactEmail" class="btn-solid">Contact us</a>
      </termsh-page-hero>
      <p class="legal-page__back">
        <a routerLink="/" class="btn-ghost">Back to home</a>
      </p>
    </main>
  `,
})
export class LegalStubPage {
  private readonly route = inject(ActivatedRoute);
  readonly contactEmail = CONTACT_EMAIL;

  get title() {
    return this.route.snapshot.data["title"] as string;
  }
  get titleId() {
    return this.route.snapshot.data["titleId"] as string;
  }
  get eyebrow() {
    return (this.route.snapshot.data["eyebrow"] as string) ?? "Legal";
  }
  get lead() {
    const custom = this.route.snapshot.data["lead"] as string | undefined;
    return custom ?? LEGAL_STUB_CONTENT[this.title] ?? DEFAULT_LEGAL_LEAD;
  }
}
