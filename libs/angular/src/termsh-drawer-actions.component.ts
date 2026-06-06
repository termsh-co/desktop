import { Component, input, output } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";

@Component({
  selector: "termsh-drawer-actions",
  standalone: true,
  imports: [TranslateModule],
  template: `
    <footer class="drawer__foot" [class]="extraClass()">
      <ng-content select="[drawerActionsStart]" />
      <span class="drawer__foot-spacer"></span>
      <button
        type="button"
        class="btn btn--ghost"
        [disabled]="busy()"
        (click)="cancel.emit()"
      >
        {{ cancelLabel() | translate }}
      </button>
      <button
        type="submit"
        class="btn btn--primary"
        [disabled]="busy() || submitDisabled()"
      >
        {{ submitLabel() | translate }}
      </button>
    </footer>
  `,
})
export class TermshDrawerActionsComponent {
  readonly busy = input(false);
  readonly submitDisabled = input(false);
  readonly cancelLabel = input("common.actions.cancel");
  readonly submitLabel = input("common.actions.save");
  readonly extraClass = input("");

  readonly cancel = output<void>();
}
