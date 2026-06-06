import { Component, Input, inject } from "@angular/core";
import { DomSanitizer, type SafeHtml } from "@angular/platform-browser";
import { ICON_PATHS } from "./icon-paths";

export type IconName =
  | "terminal"
  | "dns"
  | "laptop"
  | "add"
  | "home"
  | "lock"
  | "lock_open"
  | "search"
  | "chevron_right"
  | "folder"
  | "settings"
  | "close"
  | "expand"
  | "grid"
  | "split_vertical"
  | "split_horizontal"
  | "code"
  | "key"
  | "visibility"
  | "visibility_off"
  | "edit"
  | "cloud"
  | "cloud_off"
  | "bell"
  | "gear"
  | "fingerprint"
  | "face";

@Component({
  selector: "termsh-icon",
  standalone: true,
  template: `
    <svg
      [class]="'termsh-icon ' + extraClass"
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      [innerHTML]="paths"
    ></svg>
  `,
})
export class TermshIconComponent {
  private readonly sanitizer = inject(DomSanitizer);

  @Input({ required: true }) name!: IconName;
  @Input() size = 18;
  @Input("class") extraClass = "";

  get paths(): SafeHtml {
    const inner = ICON_PATHS[this.name] ?? "";
    return this.sanitizer.bypassSecurityTrustHtml(inner);
  }
}
