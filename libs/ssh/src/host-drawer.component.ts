import { AsyncPipe } from "@angular/common";
import { Component, effect, inject, input, output, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { TermshDrawerActionsComponent, TermshDrawerComponent } from "@termsh/angular";
import { type AuthType, type Host, type SaveHostPayload } from "@termsh/common";
import { HostStateService, KeyStateService, VaultStateService } from "@termsh/state";
import { SecretInputComponent } from "@termsh/vault";

const COLORS = ["#001d49", "#248eff", "#5eb0ff", "#1a5fc4", "#69f0ae", "#ffd54f"];

@Component({
  selector: "termsh-host-drawer",
  standalone: true,
  imports: [
    AsyncPipe,
    FormsModule,
    TranslateModule,
    TermshDrawerComponent,
    TermshDrawerActionsComponent,
    SecretInputComponent,
  ],
  template: `
    <termsh-drawer
      [open]="open()"
      variant="hosts"
      [subtitle]="(host() ? 'hosts.drawer.subEdit' : 'hosts.drawer.subNew') | translate"
      (close)="close.emit()"
    >
      <span drawerTitle>
        {{ (host() ? 'hosts.drawer.titleEdit' : 'hosts.drawer.titleNew') | translate }}
      </span>
      <form drawerBody class="drawer__body mac-scrollbar" (ngSubmit)="submit()">
        <div class="vault-field">
          <span>{{ 'hosts.drawer.displayName' | translate }}</span>
          <input
            [(ngModel)]="draft.name"
            name="name"
            required
            [placeholder]="'hosts.drawer.placeholders.displayName' | translate"
          />
        </div>
        <div class="vault-field">
          <span>{{ 'hosts.drawer.hostname' | translate }}</span>
          <input
            [(ngModel)]="draft.hostname"
            name="hostname"
            required
            autocomplete="off"
            [placeholder]="'hosts.drawer.placeholders.hostname' | translate"
          />
        </div>
        <div class="drawer__row">
          <div class="vault-field">
            <span>{{ 'hosts.drawer.port' | translate }}</span>
            <input type="number" min="1" max="65535" [(ngModel)]="draft.port" name="port" required />
          </div>
          <div class="vault-field">
            <span>{{ 'hosts.drawer.username' | translate }}</span>
            <input
              [(ngModel)]="draft.username"
              name="username"
              required
              autocomplete="off"
              [placeholder]="'hosts.drawer.placeholders.username' | translate"
            />
          </div>
        </div>

        <p class="host-modal__vault-hint">{{ 'hosts.drawer.platformHint' | translate }}</p>

        <fieldset class="modal__fieldset">
          <legend>{{ 'hosts.drawer.authLegend' | translate }}</legend>
          <label class="modal__radio">
            <input
              type="radio"
              name="authType"
              value="password"
              [(ngModel)]="draft.authType"
            />
            {{ 'hosts.drawer.authPassword' | translate }}
          </label>
          <label class="modal__radio">
            <input
              type="radio"
              name="authType"
              value="privateKey"
              [(ngModel)]="draft.authType"
            />
            {{ 'hosts.drawer.authPrivateKey' | translate }}
          </label>
        </fieldset>

        @if (host() && !hasStoredCredential && vaultReady) {
          <p class="host-modal__vault-hint host-modal__vault-hint--warn">
            {{ 'hosts.drawer.noCredentialWarn' | translate }}
          </p>
        }

        @if (draft.authType === 'password') {
          @if (vaultReady) {
            <termsh-secret-input
              [label]="(host() ? 'hosts.drawer.passwordLabel' : 'hosts.drawer.passwordLabelNew') | translate"
              name="password"
              [(value)]="password"
              [required]="needsSecretOnCreate"
              autocomplete="new-password"
              [placeholder]="passwordPlaceholder"
            />
          }
        } @else {
          @if (vaultReady) {
            <div class="vault-field">
              <span>{{ 'hosts.drawer.savedKey' | translate }}</span>
              <select
                [(ngModel)]="sshKeyId"
                name="sshKeyId"
                (ngModelChange)="onSshKeyPicked($event)"
              >
                <option value="">{{ 'hosts.drawer.savedKeyNone' | translate }}</option>
                @for (k of (keyState.keysStream$ | async) ?? []; track k.id) {
                  <option [value]="k.id">{{ k.name }}</option>
                }
              </select>
            </div>
            <termsh-secret-input
              [label]="(host() ? 'hosts.drawer.privateKeyLabel' : 'hosts.drawer.privateKeyLabelNew') | translate"
              name="privateKey"
              [(value)]="privateKey"
              (valueChange)="onPrivateKeyChange()"
              [multiline]="true"
              [rows]="5"
              [required]="needsSecretOnCreate && !sshKeyId"
              autocomplete="off"
              [placeholder]="privateKeyPlaceholder"
            />
          }
        }

        @if (!vaultReady) {
          <p class="host-modal__vault-hint">{{ 'hosts.drawer.noVaultHint' | translate }}</p>
        }
        @if (host() && hasStoredCredential) {
          <p class="host-modal__vault-hint">{{ 'hosts.drawer.keepCredentialHint' | translate }}</p>
        }

        <div class="vault-field">
          <span>{{ 'hosts.drawer.tags' | translate }}</span>
          <input
            [(ngModel)]="tagsInput"
            name="tags"
            [placeholder]="'hosts.drawer.placeholders.tags' | translate"
          />
        </div>
        <div class="vault-field">
          <span>{{ 'hosts.drawer.group' | translate }}</span>
          <input
            [(ngModel)]="draft.group"
            name="group"
            [placeholder]="'hosts.drawer.placeholders.group' | translate"
          />
        </div>

        <div class="modal__colors">
          <span>{{ 'hosts.drawer.colorLabel' | translate }}</span>
          <div class="modal__color-row">
            @for (c of colors; track c) {
              <button
                type="button"
                class="modal__color"
                [class.modal__color--active]="draft.color === c"
                [style.backgroundColor]="c"
                [attr.aria-label]="'hosts.drawer.colorAria' | translate: { color: c }"
                (click)="draft.color = c"
              ></button>
            }
          </div>
        </div>

        @if (error()) {
          <p class="vault-card__error">{{ error() }}</p>
        }

        <termsh-drawer-actions
          [busy]="busy()"
          [submitLabel]="busy() ? 'hosts.drawer.saving' : 'common.actions.save'"
          (cancel)="close.emit()"
        >
          @if (host()) {
            <button
              drawerActionsStart
              type="button"
              class="btn btn--ghost drawer__delete"
              [disabled]="busy()"
              (click)="removeHost()"
            >
              {{ 'hosts.drawer.deleteHost' | translate }}
            </button>
          }
        </termsh-drawer-actions>
      </form>
    </termsh-drawer>
  `,
})
export class HostDrawerComponent {
  readonly open = input(false);
  readonly host = input<Host | null>(null);
  readonly close = output<void>();
  readonly saved = output<void>();

  readonly keyState = inject(KeyStateService);
  private readonly hostState = inject(HostStateService);
  private readonly vault = inject(VaultStateService);
  private readonly translate = inject(TranslateService);

  readonly colors = COLORS;
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  password = "";
  privateKey = "";
  sshKeyId = "";
  tagsInput = "";

  draft: SaveHostPayload = {
    name: "",
    hostname: "",
    port: 22,
    username: "root",
    authType: "password",
    tags: [],
    color: COLORS[0],
  };

  constructor() {
    effect(() => {
      const h = this.host();
      if (!this.open()) return;
      this.error.set(null);
      this.password = "";
      this.privateKey = "";
      this.sshKeyId = "";
      this.tagsInput = h?.tags.join(", ") ?? "";
      this.draft = {
        id: h?.id,
        name: h?.name ?? "",
        hostname: h?.hostname ?? "",
        port: h?.port ?? 22,
        username: h?.username ?? "root",
        authType: (h?.authType ?? "password") as AuthType,
        tags: h?.tags ?? [],
        group: h?.group,
        color: h?.color ?? COLORS[0],
      };
    });

    effect(() => {
      if (this.open() && this.vaultReady) {
        void this.keyState.load();
      }
    });
  }

  get vaultReady(): boolean {
    const s = this.vault.status;
    return Boolean(s?.isSetup && s.isUnlocked);
  }

  get hasStoredCredential(): boolean {
    const h = this.host();
    if (!h) return false;
    return this.draft.authType === "password"
      ? Boolean(h.credentialRef)
      : Boolean(h.privateKeyRef);
  }

  get needsSecretOnCreate(): boolean {
    if (this.host()) return false;
    if (!this.vaultReady) return false;
    return this.draft.authType === "password" || this.draft.authType === "privateKey";
  }

  get passwordPlaceholder(): string {
    if (this.host() && this.hasStoredCredential) {
      return this.translate.instant("hosts.drawer.passwordPlaceholderChange");
    }
    return this.vaultReady
      ? ""
      : this.translate.instant("hosts.drawer.passwordPlaceholderVaultLater");
  }

  get privateKeyPlaceholder(): string {
    if (this.host() && this.hasStoredCredential) {
      return this.translate.instant("hosts.drawer.privateKeyPlaceholderChange");
    }
    return this.vaultReady
      ? this.translate.instant("hosts.drawer.pemHeaderPlaceholder")
      : this.translate.instant("hosts.drawer.privateKeyPlaceholderVaultLater");
  }

  onSshKeyPicked(id: string) {
    if (id) this.privateKey = "";
  }

  onPrivateKeyChange() {
    if (this.privateKey.trim()) this.sshKeyId = "";
  }

  async removeHost() {
    const h = this.host();
    if (!h) return;
    const ok = confirm(
      this.translate.instant("hosts.drawer.deleteConfirm", { name: h.name }),
    );
    if (!ok) return;

    this.busy.set(true);
    this.error.set(null);
    try {
      await this.hostState.remove(h.id);
      this.saved.emit();
      this.close.emit();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.busy.set(false);
    }
  }

  async submit() {
    if (!this.host() && this.vaultReady && this.draft.authType === "password" && !this.password.trim()) {
      this.error.set(this.translate.instant("hosts.drawer.errors.passwordRequired"));
      return;
    }
    if (
      !this.host() &&
      this.vaultReady &&
      this.draft.authType === "privateKey" &&
      !this.privateKey.trim() &&
      !this.sshKeyId
    ) {
      this.error.set(this.translate.instant("hosts.drawer.errors.privateKeyRequired"));
      return;
    }

    this.busy.set(true);
    this.error.set(null);
    try {
      const payload: SaveHostPayload = {
        ...this.draft,
        tags: this.tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        password: this.password.trim() || undefined,
        privateKey: this.privateKey.trim() || undefined,
        sshKeyId: this.sshKeyId || undefined,
      };
      if (!this.vaultReady) {
        payload.password = undefined;
        payload.privateKey = undefined;
        payload.sshKeyId = undefined;
      }
      await this.hostState.save(payload);
      this.saved.emit();
      this.close.emit();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.busy.set(false);
    }
  }
}
