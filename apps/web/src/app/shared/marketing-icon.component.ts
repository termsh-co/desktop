import { Component, Input } from "@angular/core";

export type MarketingIconId =
  | "check"
  | "download"
  | "key"
  | "terminal"
  | "apple"
  | "monitor"
  | "lock"
  | "shield"
  | "hard-drive"
  | "fingerprint"
  | "server"
  | "gauge"
  | "users"
  | "user-cog"
  | "zap";

@Component({
  selector: "termsh-marketing-icon",
  standalone: true,
  template: `
    <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" fill="none" [attr.stroke]="stroke" stroke-width="1.75" aria-hidden>
      @switch (name) {
        @case ('check') { <polyline points="20 6 9 17 4 12" /> }
        @case ('download') { <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /> }
        @case ('key') { <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" /> }
        @case ('terminal') { <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" /> }
        @case ('apple') { <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-3 6-6.78 0-1.86-.92-3.56-2.36-4.74C18.54 9.88 16.8 9 15 9c-1.2 0-2.4.45-3 1.06-.6-.61-1.8-1.06-3-1.06-1.8 0-3.54.88-4.64 2.28C2.92 13.46 2 15.16 2 17.02 2 20.8 5 24 8 24c1.25 0 2.5-1.06 4-1.06zM15 5c.83-1.17 2.17-2 3.5-2 .16 1.17-.38 2.35-1.17 3.19-.79.84-2 1.5-3.33 1.42-.14-1.15.5-2.35 1-3.11z" fill="currentColor" stroke="none" /> }
        @case ('monitor') { <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /> }
        @case ('lock') { <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /> }
        @case ('shield') { <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> }
        @case ('hard-drive') { <line x1="22" y1="12" x2="2" y2="12" /><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" /><line x1="6" y1="16" x2="6.01" y2="16" /><line x1="10" y1="16" x2="10.01" y2="16" /> }
        @case ('fingerprint') { <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4" /><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 12 0c0 3 .5 5.5 1 7" /><path d="M8.5 17c.5-1.5 1-3.5 1-5a4 4 0 0 1 8 0c0 1.5.5 3.5 1 5" /><path d="M12 22v-2" /> }
        @case ('server') { <rect x="2" y="2" width="20" height="8" rx="2" /><rect x="2" y="14" width="20" height="8" rx="2" /><line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" /> }
        @case ('gauge') { <path d="m12 14 4-4" /><path d="M3.34 19a10 10 0 1 1 17.32 0" /> }
        @case ('users') { <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /> }
        @case ('user-cog') { <circle cx="18" cy="15" r="3" /><path d="M21 12v-1a2 2 0 0 0-2-2h-1" /><path d="M16.5 10.5 19 8" /><path d="m19 8 2.5 2.5" /><path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" /><path d="M2 20v-1a6 6 0 0 1 6-6h1" /> }
        @case ('zap') { <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /> }
      }
    </svg>
  `,
})
export class MarketingIconComponent {
  @Input({ required: true }) name!: MarketingIconId;
  @Input() size = 20;
  @Input() stroke = "currentColor";
}
