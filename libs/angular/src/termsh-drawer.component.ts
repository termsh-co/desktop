import { Component, input, output } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";

export type TermshDrawerVariant = "hosts" | "snippets" | "keys" | "default";

@Component({
  selector: "termsh-drawer",
  standalone: true,
  imports: [TranslateModule],
  template: `
    @if (open()) {
      <div class="drawer-root drawer-root--open">
        <button
          type="button"
          class="drawer-root__backdrop"
          [attr.aria-label]="'common.actions.close' | translate"
          (click)="onBackdropClick()"
        ></button>
        <aside
          class="drawer"
          [class.drawer--hosts]="variant() === 'hosts'"
          [class.drawer--snippets]="variant() === 'snippets'"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="titleId"
          (click)="$event.stopPropagation()"
        >
          <header class="drawer__header">
            <div class="drawer__header-text">
              <h2 [id]="titleId">
                <ng-content select="[drawerTitle]" />
              </h2>
              @if (subtitle()) {
                <p class="drawer__sub">{{ subtitle() }}</p>
              }
            </div>
            <button
              type="button"
              class="drawer__close"
              (click)="close.emit()"
              [attr.aria-label]="'common.actions.close' | translate"
            >
              ×
            </button>
          </header>
          <ng-content select="[drawerBody]" />
        </aside>
      </div>
    }
  `,
})
export class TermshDrawerComponent {
  readonly open = input(false);
  readonly variant = input<TermshDrawerVariant>("default");
  readonly subtitle = input<string>("");
  readonly closeOnBackdrop = input(true);

  readonly close = output<void>();

  readonly titleId = `termsh-drawer-title-${Math.random().toString(36).slice(2, 9)}`;

  onBackdropClick() {
    if (this.closeOnBackdrop()) {
      this.close.emit();
    }
  }
}
