import { Component, inject, OnInit, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import {
  formatReleaseLabel,
  orderedSectionEntries,
  sectionLabel,
  type ChangelogData,
  type ChangelogRelease,
} from "../../lib/changelog";
import { PageHeroComponent } from "../shared/page-hero.component";

@Component({
  selector: "termsh-changelog-page",
  standalone: true,
  imports: [RouterLink, PageHeroComponent],
  template: `
    <main class="changelog-page">
      <termsh-page-hero
        eyebrow="Product"
        titleId="changelog-title"
        lead="What's new in termsh for Mac, version by version."
        [hasActions]="!!data()?.appVersion"
      >
        <span hero-title>Changelog</span>
        @if (data()?.appVersion) {
          <span hero-actions class="changelog-page__badge">Latest {{ data()!.appVersion }}</span>
        }
      </termsh-page-hero>

      <div class="changelog-page__body">
        @if (error()) {
          <p class="changelog-page__error" role="alert">{{ error() }}</p>
        }
        @if (!data() && !error()) {
          <p class="changelog-page__muted">Loading release notes…</p>
        }
        @for (release of data()?.releases ?? []; track release.version) {
          @if (sectionsFor(release).length > 0 || release.unreleased) {
            <article
              class="changelog-release"
              [class.changelog-release--unreleased]="release.unreleased"
              [id]="release.unreleased ? 'unreleased' : 'v' + release.version"
            >
              <header class="changelog-release__head">
                <h2 class="changelog-release__title">{{ formatLabel(release) }}</h2>
                @if (release.unreleased) {
                  <span class="changelog-release__tag">In progress</span>
                }
              </header>
              @if (sectionsFor(release).length === 0) {
                <p class="changelog-page__muted">No entries yet.</p>
              } @else {
                <div class="changelog-release__sections">
                  @for (section of sectionsFor(release); track section[0]) {
                    <section class="changelog-section">
                      <h3 class="changelog-section__title">{{ sectionLabel(section[0]) }}</h3>
                      <ul class="changelog-section__list">
                        @for (item of section[1]; track item) {
                          <li>{{ item }}</li>
                        }
                      </ul>
                    </section>
                  }
                </div>
              }
            </article>
          }
        }
      </div>

      <p class="changelog-page__back">
        <a routerLink="/" class="btn-ghost">Back to home</a>
      </p>
    </main>
  `,
})
export class ChangelogPage implements OnInit {
  private readonly http = inject(HttpClient);
  readonly data = signal<ChangelogData | null>(null);
  readonly error = signal<string | null>(null);
  readonly formatLabel = formatReleaseLabel;
  readonly sectionLabel = sectionLabel;

  ngOnInit() {
    this.http.get<ChangelogData>("/changelog.json").subscribe({
      next: (json) => this.data.set(json),
      error: () => this.error.set("Could not load release notes"),
    });
  }

  sectionsFor(release: ChangelogRelease) {
    return orderedSectionEntries(release.sections);
  }
}
