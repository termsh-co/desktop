import { Component, input, model, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";
import { TermshIconComponent } from "@termsh/angular";

let secretInputId = 0;

@Component({
  selector: "termsh-secret-input",
  standalone: true,
  imports: [FormsModule, TranslateModule, TermshIconComponent],
  template: `
    @if (variant() === 'unlock') {
      <div class="vault-unlock__field">
        @if (label()) {
          <label class="vault-unlock__sr-only" [attr.for]="inputId">{{ label() }}</label>
        }
        <div class="secret-input__wrap">
          <input
            [id]="inputId"
            class="vault-unlock__input"
            [type]="visible() ? 'text' : 'password'"
            [(ngModel)]="value"
            [name]="name()"
            [placeholder]="placeholder()"
            [required]="required()"
            [disabled]="disabled()"
            [attr.autocomplete]="autocomplete()"
          />
          <button
            type="button"
            class="vault-unlock__toggle"
            (click)="toggle()"
            [disabled]="disabled()"
            [attr.aria-label]="toggleAriaLabel() | translate"
            [attr.aria-pressed]="visible()"
            tabindex="-1"
          >
            <termsh-icon [name]="visible() ? 'visibility_off' : 'visibility'" [size]="18" />
          </button>
        </div>
      </div>
    } @else {
      <label class="vault-field secret-input" [attr.for]="inputId">
        @if (label()) {
          <span class="secret-input__label-row">
            <span>{{ label() }}</span>
          </span>
        }
        <div class="secret-input__wrap" [class.secret-input__wrap--area]="multiline()">
          @if (multiline()) {
            <textarea
              [id]="inputId"
              [class.secret-input__visible]="visible()"
              [(ngModel)]="value"
              [name]="name()"
              [placeholder]="placeholder()"
              [required]="required()"
              [disabled]="disabled()"
              [attr.rows]="rows()"
              [attr.autocomplete]="autocomplete()"
            ></textarea>
          } @else {
            <input
              [id]="inputId"
              [type]="visible() ? 'text' : 'password'"
              [(ngModel)]="value"
              [name]="name()"
              [placeholder]="placeholder()"
              [required]="required()"
              [disabled]="disabled()"
              [attr.autocomplete]="autocomplete()"
            />
          }
          <button
            type="button"
            class="secret-input__toggle"
            (click)="toggle()"
            [disabled]="disabled()"
            [attr.aria-label]="toggleAriaLabel() | translate"
            [attr.aria-pressed]="visible()"
            tabindex="-1"
          >
            <termsh-icon [name]="visible() ? 'visibility_off' : 'visibility'" [size]="18" />
          </button>
        </div>
      </label>
    }
  `,
})
export class SecretInputComponent {
  readonly label = input<string>("");
  readonly name = input.required<string>();
  readonly placeholder = input<string>("");
  readonly required = input(false);
  readonly disabled = input(false);
  readonly autocomplete = input<string>("current-password");
  readonly variant = input<"default" | "unlock">("default");
  readonly multiline = input(false);
  readonly rows = input(5);

  readonly value = model("");

  readonly visible = signal(false);
  readonly inputId = `termsh-secret-${++secretInputId}`;

  toggle() {
    this.visible.set(!this.visible());
  }

  toggleAriaLabel(): string {
    return this.visible() ? "vault.unlock.hidePassword" : "vault.unlock.showPassword";
  }
}
