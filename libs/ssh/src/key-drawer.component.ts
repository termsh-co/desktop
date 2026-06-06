import { Component, effect, inject, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";
import { TermshDrawerActionsComponent, TermshDrawerComponent } from "@termsh/angular";
import type { SshKey } from "@termsh/common";
import { KeyStateService } from "@termsh/state";
import { SecretInputComponent } from "@termsh/vault";

type AddMode = "import" | "generate";

function toTagList(tags: string): string[] {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 20);
}

@Component({
  selector: "termsh-key-drawer",
  standalone: true,
  imports: [
    FormsModule,
    TranslateModule,
    TermshDrawerComponent,
    TermshDrawerActionsComponent,
    SecretInputComponent,
  ],
  template: `
    <termsh-drawer
      [open]="open()"
      variant="keys"
      [subtitle]="drawerSubtitle | translate"
      (close)="close.emit()"
    >
      <span drawerTitle>{{ drawerTitle | translate }}</span>

      @if (generatedPublicKey()) {
        <div drawerBody class="drawer__body mac-scrollbar">
          <div class="vault-field vault-field--snippet">
            <span>{{ 'keys.drawer.publicKeyLabel' | translate }}</span>
            <textarea [value]="generatedPublicKey()" readonly rows="4"></textarea>
          </div>
          @if (error()) {
            <p class="drawer-error">{{ error() }}</p>
          }
          <footer class="drawer__footer">
            <button type="button" class="btn btn--ghost" (click)="copyPublicKey()">
              {{ 'common.actions.copy' | translate }}
            </button>
            <button type="button" class="btn btn--primary" (click)="close.emit()">
              {{ 'keys.drawer.done' | translate }}
            </button>
          </footer>
        </div>
      } @else {
        <form drawerBody class="drawer__body mac-scrollbar" (ngSubmit)="submit()">
          @if (!keyItem()) {
            <div class="drawer__row" role="tablist" [attr.aria-label]="'keys.drawer.modeAria' | translate">
              <button
                type="button"
                role="tab"
                [attr.aria-selected]="addMode() === 'generate'"
                class="btn"
                [class.btn--primary]="addMode() === 'generate'"
                [class.btn--ghost]="addMode() !== 'generate'"
                (click)="addMode.set('generate')"
              >
                {{ 'keys.drawer.generate' | translate }}
              </button>
              <button
                type="button"
                role="tab"
                [attr.aria-selected]="addMode() === 'import'"
                class="btn"
                [class.btn--primary]="addMode() === 'import'"
                [class.btn--ghost]="addMode() !== 'import'"
                (click)="addMode.set('import')"
              >
                {{ 'keys.drawer.import' | translate }}
              </button>
            </div>
          }

          <div class="vault-field">
            <span>{{ 'keys.drawer.nameLabel' | translate }}</span>
            <input
              [(ngModel)]="name"
              name="name"
              required
              [placeholder]="'keys.drawer.namePlaceholder' | translate"
            />
          </div>

          <div class="vault-field">
            <span>{{ 'keys.drawer.tagsLabel' | translate }}</span>
            <input
              [(ngModel)]="tags"
              name="tags"
              [placeholder]="'keys.drawer.tagsPlaceholder' | translate"
            />
          </div>

          @if (!keyItem() && addMode() === 'generate') {
            <div class="vault-field">
              <span>{{ 'keys.drawer.algorithmLabel' | translate }}</span>
              <select [(ngModel)]="algorithm" name="algorithm">
                <option value="ed25519">{{ 'keys.drawer.algorithmEd25519' | translate }}</option>
                <option value="rsa">{{ 'keys.drawer.algorithmRsa' | translate }}</option>
              </select>
            </div>
          }

          @if ((!keyItem() && addMode() === 'import') || keyItem()) {
            <termsh-secret-input
              [label]="'keys.drawer.privateKeyLabel' | translate"
              name="privateKey"
              [(value)]="privateKey"
              [multiline]="true"
              [placeholder]="keyItem()
                ? ('keys.drawer.privateKeyPlaceholderRotate' | translate)
                : ('keys.drawer.privateKeyPlaceholderNew' | translate)"
            />
          }

          @if (error()) {
            <p class="drawer-error">{{ error() }}</p>
          }

          <termsh-drawer-actions
            [submitLabel]="submitLabel"
            [busy]="submitting()"
            [submitDisabled]="!name.trim()"
            (cancel)="close.emit()"
          />
        </form>
      }
    </termsh-drawer>
  `,
})
export class KeyDrawerComponent {
  readonly open = input(false);
  readonly keyItem = input<SshKey | null>(null);

  readonly close = output<void>();
  readonly saved = output<void>();

  private readonly keys = inject(KeyStateService);

  readonly addMode = signal<AddMode>("generate");
  readonly generatedPublicKey = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  name = "";
  privateKey = "";
  algorithm: "ed25519" | "rsa" = "ed25519";
  tags = "";

  constructor() {
    effect(() => {
      if (!this.open()) return;
      const item = this.keyItem();
      this.addMode.set("generate");
      this.name = item?.name ?? "";
      this.privateKey = "";
      this.algorithm = "ed25519";
      this.tags = item?.tags.join(", ") ?? "";
      this.generatedPublicKey.set(null);
      this.submitting.set(false);
      this.error.set(null);
    });
  }

  get drawerTitle(): string {
    if (this.keyItem()) return "keys.drawer.titleEdit";
    if (this.generatedPublicKey()) return "keys.drawer.titleCreated";
    return "keys.drawer.titleAdd";
  }

  get drawerSubtitle(): string {
    return this.generatedPublicKey() ? "keys.drawer.subtitleCreated" : "keys.drawer.subtitleStored";
  }

  get submitLabel(): string {
    if (this.submitting()) {
      return this.keyItem() || this.addMode() === "import"
        ? "keys.drawer.saving"
        : "keys.drawer.generating";
    }
    if (this.keyItem()) return "common.actions.save";
    return this.addMode() === "generate" ? "keys.drawer.generate" : "common.actions.save";
  }

  async copyPublicKey() {
    const text = this.generatedPublicKey();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      this.error.set("keys.drawer.errors.copyFailed");
    }
  }

  async submit() {
    this.error.set(null);

    if (!this.name.trim()) {
      this.error.set("keys.drawer.errors.nameRequired");
      return;
    }

    const item = this.keyItem();
    if (item) {
      this.submitting.set(true);
      try {
        await this.keys.save({
          id: item.id,
          name: this.name.trim(),
          privateKey: this.privateKey.trim(),
          tags: toTagList(this.tags),
        });
        this.saved.emit();
        this.close.emit();
      } catch (err) {
        this.error.set(err instanceof Error ? err.message : String(err));
      } finally {
        this.submitting.set(false);
      }
      return;
    }

    if (this.addMode() === "generate") {
      this.submitting.set(true);
      try {
        const result = await this.keys.generate({
          name: this.name.trim(),
          algorithm: this.algorithm,
          tags: toTagList(this.tags),
        });
        this.generatedPublicKey.set(result.publicKeyPem);
        this.saved.emit();
      } catch (err) {
        this.error.set(err instanceof Error ? err.message : String(err));
      } finally {
        this.submitting.set(false);
      }
      return;
    }

    if (!this.privateKey.trim()) {
      this.error.set("keys.drawer.errors.privateKeyRequired");
      return;
    }

    this.submitting.set(true);
    try {
      await this.keys.save({
        name: this.name.trim(),
        privateKey: this.privateKey.trim(),
        tags: toTagList(this.tags),
      });
      this.saved.emit();
      this.close.emit();
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : String(err));
    } finally {
      this.submitting.set(false);
    }
  }
}
