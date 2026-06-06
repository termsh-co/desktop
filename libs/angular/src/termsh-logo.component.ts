import { Component, Input } from "@angular/core";

export type TermshLogoVariant = "mark" | "wordmark" | "wordmark-mono";

@Component({
  selector: "termsh-logo",
  standalone: true,
  template: `
    <img
      [src]="src"
      [alt]="alt"
      [attr.width]="wordmark ? null : size"
      [attr.height]="size"
      [class]="wordmark ? 'termsh-logo termsh-logo--wordmark ' + (className ?? '') : 'termsh-logo ' + (className ?? '')"
      draggable="false"
      decoding="async"
    />
  `,
})
export class TermshLogoComponent {
  @Input() variant: TermshLogoVariant = "mark";
  @Input() size = 28;
  @Input() className?: string;
  @Input() alt = "termsh";

  get wordmark(): boolean {
    return this.variant !== "mark";
  }

  get src(): string {
    return this.variant === "mark"
      ? "assets/brand/termsh-icon.png"
      : "assets/brand/termsh-logo.png";
  }
}
