import { Component, inject, OnInit, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import type { LatestRelease } from "../../lib/downloads";
import { DownloadService } from "../services/download.service";
import { MarketingIconComponent } from "../shared/marketing-icon.component";

@Component({
  selector: "termsh-cta-section",
  standalone: true,
  imports: [RouterLink, MarketingIconComponent],
  template: `
    <section class="cta-band" id="download">
      <div class="cta-band__glow" aria-hidden></div>
      <div class="cta-band__inner">
        <p class="section-eyebrow">Get started</p>
        <h2 class="cta-band__title">Download termsh for desktop</h2>
        <p class="cta-band__lead">
          macOS beta available now. Windows and Linux builds in open beta — no account required.
        </p>

        @if (release(); as rel) {
          <ul class="cta-band__platforms">
            @for (platform of platforms(); track platform.id) {
              <li [class.cta-band__soon]="!platform.available">
                <a
                  [href]="platform.url"
                  target="_blank"
                  rel="noopener noreferrer"
                  [attr.aria-disabled]="!platform.available || null"
                  [class.btn-cta--disabled]="!platform.available"
                >
                  <termsh-marketing-icon [name]="platform.icon" [size]="18" />
                  {{ platform.label }}
                </a>
              </li>
            }
          </ul>

          <div class="cta-band__actions">
            <a
              [href]="primaryUrl()"
              class="btn-cta"
              target="_blank"
              rel="noopener noreferrer"
            >
              Download {{ versionLabel() }}
            </a>
            <a routerLink="/pricing" class="btn-ghost">View pricing</a>
          </div>
        }
      </div>
    </section>
  `,
})
export class CtaSectionComponent implements OnInit {
  private readonly downloads = inject(DownloadService);

  readonly release = signal<LatestRelease | null>(null);
  readonly platforms = signal<ReturnType<DownloadService["ctaPlatforms"]>>([]);
  readonly versionLabel = signal("v0.2.0");
  readonly primaryUrl = signal("https://termsh.co/download/macos");

  ngOnInit() {
    void this.load();
  }

  private async load() {
    const rel = await this.downloads.latest();
    this.release.set(rel);
    this.platforms.set(this.downloads.ctaPlatforms(rel));
    this.versionLabel.set(this.downloads.versionLabel(rel));
    this.primaryUrl.set(this.downloads.primaryAsset(rel).url);
  }
}
