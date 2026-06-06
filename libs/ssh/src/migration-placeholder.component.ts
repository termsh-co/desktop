import { Component, Input } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";

@Component({
  selector: "termsh-migration-placeholder",
  standalone: true,
  imports: [TranslateModule],
  template: `
    <section class="placeholder">
      <h2 class="placeholder__title">{{ title }}</h2>
      <p class="placeholder__muted">{{ 'shell.migrationHint' | translate }}</p>
    </section>
  `,
  styles: [
    `
      .placeholder {
        padding: 24px;
      }
      .placeholder__title {
        margin: 0 0 8px;
        font-size: 20px;
        font-weight: 600;
      }
      .placeholder__muted {
        margin: 0;
        color: var(--s-muted);
        font-size: 14px;
      }
    `,
  ],
})
export class MigrationPlaceholderComponent {
  @Input({ required: true }) title!: string;
}
