import { Component, inject, OnInit, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { DownloadService } from "../services/download.service";
import { MarketingIconComponent } from "../shared/marketing-icon.component";

@Component({
  selector: "termsh-download-page",
  standalone: true,
  imports: [RouterLink, MarketingIconComponent],
  template: `
    <main class="download-page">
      <header class="download-page__hero">
        <p class="section-eyebrow">Download</p>
        <h1 class="download-page__title">Get termsh {{ versionLabel() }}</h1>
        <p class="download-page__lead">Free desktop SSH client. No account needed. Zero telemetry.</p>
      </header>

      <div class="download-page__cards">
        @for (card of cards(); track card.id) {
          <a
            [href]="card.url"
            target="_blank"
            rel="noopener noreferrer"
            class="download-card"
            [class.download-card--disabled]="!card.available"
            [attr.aria-disabled]="!card.available || null"
          >
            <span class="download-card__icon">
              <termsh-marketing-icon [name]="card.icon" [size]="22" />
            </span>
            <span class="download-card__body">
              <span class="download-card__label">{{ card.label }}</span>
              <span class="download-card__meta">{{ card.arch }} · {{ card.ext }}</span>
            </span>
            <termsh-marketing-icon name="download" [size]="18" className="download-card__action" />
          </a>
        }
      </div>

      <p class="download-page__note">
        macOS users: after downloading, drag termsh to your Applications folder. If you see a security
        warning, go to System Settings → Privacy & Security and click "Open Anyway".
      </p>

      <footer class="download-page__footer">
        <a routerLink="/" class="btn-ghost">← Back to home</a>
        <a routerLink="/changelog" class="btn-ghost">View changelog</a>
      </footer>
    </main>
  `,
})
export class DownloadPage implements OnInit {
  private readonly downloads = inject(DownloadService);

  readonly versionLabel = signal("v0.2.0");
  readonly cards = signal<ReturnType<DownloadService["downloadCards"]>>([]);

  ngOnInit() {
    void this.load();
  }

  private async load() {
    const rel = await this.downloads.latest();
    this.versionLabel.set(this.downloads.versionLabel(rel));
    this.cards.set(this.downloads.downloadCards(rel));
  }
}
