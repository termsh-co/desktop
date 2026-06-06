import { Component, input, output } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";
import { TermshIconComponent } from "@termsh/angular";
import type { Session } from "@termsh/common";

@Component({
  selector: "termsh-split-pane-bar",
  standalone: true,
  imports: [FormsModule, TranslateModule, TermshIconComponent],
  template: `
    <div
      class="terminal-split__bar"
      role="group"
      [attr.aria-label]="
        role() === 'primary'
          ? ('terminal.split.primaryAria' | translate)
          : ('terminal.split.secondaryAria' | translate)
      "
    >
      <span class="terminal-split__bar-tag">
        {{
          role() === 'primary'
            ? ('terminal.split.primary' | translate)
            : ('terminal.split.split' | translate)
        }}
      </span>

      @if (role() === 'primary') {
        <span class="terminal-split__bar-title">
          @if (session(); as s) {
            <termsh-icon [name]="sessionIcon(s)" [size]="12" />
            <span>{{ s.title }}</span>
          } @else {
            —
          }
        </span>
      } @else {
        <label class="terminal-split__bar-select-wrap">
          <select
            class="terminal-split__bar-select"
            [attr.aria-label]="'terminal.split.secondarySession' | translate"
            [ngModel]="secondarySessionId() ?? ''"
            (ngModelChange)="secondaryChange.emit($event)"
            [disabled]="secondaryOptions().length === 0"
          >
            @if (secondaryOptions().length === 0) {
              <option value="">{{ 'terminal.split.noOtherSession' | translate }}</option>
            }
            @for (s of secondaryOptions(); track s.id) {
              <option [value]="s.id">
                {{
                  s.kind === 'local'
                    ? ('terminal.split.local' | translate)
                    : s.title
                }}
              </option>
            }
          </select>
        </label>
      }
    </div>
  `,
})
export class SplitPaneBarComponent {
  readonly role = input.required<"primary" | "secondary">();
  readonly session = input<Session | null>(null);
  readonly secondaryOptions = input<Session[]>([]);
  readonly secondarySessionId = input<string | null>(null);

  readonly secondaryChange = output<string>();

  sessionIcon(session: Session): "laptop" | "terminal" {
    return session.kind === "local" ? "laptop" : "terminal";
  }
}
