import { Component, Input } from "@angular/core";

/** Marketing site logo — wordmark from brand/wordmark-mono.png → termsh-logo.png */
@Component({
  selector: "termsh-landing-logo",
  standalone: true,
  template: `
    <img
      [src]="src"
      alt="termsh"
      [attr.width]="wordmark ? null : size"
      [attr.height]="size"
      [class]="imgClass"
      draggable="false"
      decoding="async"
    />
  `,
})
export class LandingLogoComponent {
  @Input() variant: "mark" | "wordmark" | "wordmark-mono" = "wordmark";
  @Input() size = 26;
  @Input() className = "";

  get wordmark(): boolean {
    return this.variant !== "mark";
  }

  get src(): string {
    return this.variant === "mark" ? "/brand/termsh-icon.png" : "/brand/termsh-logo.png";
  }

  get imgClass(): string {
    const base = this.wordmark ? "termsh-logo-wordmark" : "termsh-logo-mark";
    return this.className ? `${base} ${this.className}` : base;
  }
}
