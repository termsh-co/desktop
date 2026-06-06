import { AsyncPipe } from "@angular/common";
import { Component, inject, OnInit, signal } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import type { SshKey } from "@termsh/common";
import { KeyStateService, VaultStateService } from "@termsh/state";
import { KeyDrawerComponent } from "./key-drawer.component";

@Component({
  selector: "termsh-keys-view",
  standalone: true,
  imports: [AsyncPipe, TranslateModule, KeyDrawerComponent],
  template: `
    <div class="view">
      <header class="view__head view__head--row">
        <div>
          <h1>{{ 'keys.title' | translate }}</h1>
          <p class="view__sub">{{ 'keys.subtitle' | translate }}</p>
        </div>
        <button type="button" class="btn btn--primary" [disabled]="!vaultReady" (click)="openNew()">
          {{ 'keys.addKey' | translate }}
        </button>
      </header>
      <div class="view__scroll mac-scrollbar">
        @if (!vaultReady) {
          <p class="view__empty">{{ 'keys.vaultLocked' | translate }}</p>
        } @else if (state.loading$stream | async) {
          <p class="view__empty">{{ 'snippets.loading' | translate }}</p>
        } @else if ((state.keysStream$ | async)?.length === 0) {
          <p class="view__empty">{{ 'keys.empty' | translate }}</p>
        } @else {
          <ul class="snippets-list">
            @for (k of state.keysStream$ | async; track k.id) {
              <li class="snippet-row">
                <div class="snippet-row__main">
                  <span class="snippet-row__title">{{ k.name }}</span>
                  @if (k.tags.length) {
                    <span class="snippet-row__preview">{{ k.tags.join(', ') }}</span>
                  }
                </div>
                <button type="button" class="snippet-row__edit" (click)="openEdit(k)">
                  {{ 'common.actions.edit' | translate }}
                </button>
                <button type="button" class="snippet-row__edit" (click)="remove(k)">
                  {{ 'common.actions.delete' | translate }}
                </button>
              </li>
            }
          </ul>
        }
      </div>

      <termsh-key-drawer
        [open]="drawerOpen()"
        [keyItem]="editingKey()"
        (close)="closeDrawer()"
        (saved)="onSaved()"
      />
    </div>
  `,
})
export class KeysViewComponent implements OnInit {
  readonly state = inject(KeyStateService);
  private readonly vault = inject(VaultStateService);

  readonly drawerOpen = signal(false);
  readonly editingKey = signal<SshKey | null>(null);

  ngOnInit() {
    void this.state.load();
  }

  get vaultReady(): boolean {
    const s = this.vault.status;
    return Boolean(s?.isSetup && s.isUnlocked);
  }

  openNew() {
    this.editingKey.set(null);
    this.drawerOpen.set(true);
  }

  openEdit(k: SshKey) {
    this.editingKey.set(k);
    this.drawerOpen.set(true);
  }

  closeDrawer() {
    this.drawerOpen.set(false);
    this.editingKey.set(null);
  }

  onSaved() {
    void this.state.load();
  }

  async remove(k: SshKey) {
    await this.state.remove(k.id);
  }
}
