import { Component, input } from "@angular/core";
import {
  getHostPlatformIcon,
  resolveHostPlatform,
  type Host,
  type HostPlatform,
} from "@termsh/common";

@Component({
  selector: "termsh-host-os-icon",
  standalone: true,
  template: `
    <svg
      [class]="'host-os-icon host-os-icon--' + platform()"
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      role="img"
      [attr.aria-label]="icon().title"
    >
      <path [attr.d]="icon().path" [attr.fill]="icon().color" />
    </svg>
  `,
})
export class HostOsIconComponent {
  readonly host = input<Host | null>(null);
  readonly platformOverride = input<HostPlatform | null>(null);
  readonly size = input(28);

  platform(): HostPlatform {
    const explicit = this.platformOverride();
    if (explicit) return explicit;
    const h = this.host();
    return h ? resolveHostPlatform(h) : "unknown";
  }

  icon() {
    return getHostPlatformIcon(this.platform());
  }
}
