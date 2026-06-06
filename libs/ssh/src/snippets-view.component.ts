import { AsyncPipe } from "@angular/common";
import { Component, inject, OnInit, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";
import { TermshDrawerActionsComponent, TermshDrawerComponent } from "@termsh/angular";
import type { Snippet } from "@termsh/common";
import { TermshPlatformService } from "@termsh/platform";
import { NavStateService, SessionStateService, SnippetStateService } from "@termsh/state";

@Component({
  selector: "termsh-snippets-view",
  standalone: true,
  imports: [
    AsyncPipe,
    FormsModule,
    TranslateModule,
    TermshDrawerComponent,
    TermshDrawerActionsComponent,
  ],
  template: `
    <div class="view">
      <header class="view__head view__head--row">
        <div>
          <h1>{{ 'snippets.title' | translate }}</h1>
          <p class="view__sub">{{ 'snippets.subtitle' | translate }}</p>
        </div>
        <button type="button" class="btn btn--primary" (click)="openNew()">
          {{ 'snippets.addSnippet' | translate }}
        </button>
      </header>
      <div class="view__scroll mac-scrollbar">
        <input
          class="snippets-search"
          [(ngModel)]="query"
          name="q"
          [placeholder]="'snippets.searchPlaceholder' | translate"
        />
        @if (state.loading$stream | async) {
          <p class="view__empty">{{ 'snippets.loading' | translate }}</p>
        } @else if (filtered((state.snippetsStream$ | async) ?? []).length === 0) {
          <p class="view__empty">{{ 'snippets.empty' | translate }}</p>
        } @else {
          <ul class="snippets-list">
            @for (s of filtered((state.snippetsStream$ | async) ?? []); track s.id) {
              <li class="snippet-row">
                <button type="button" class="snippet-row__main" (click)="send(s)">
                  <span class="snippet-row__title">{{ s.title }}</span>
                  <span class="snippet-row__preview">{{ s.body }}</span>
                </button>
                <button type="button" class="snippet-row__edit" (click)="openEdit(s)">
                  {{ 'common.actions.edit' | translate }}
                </button>
                <button type="button" class="snippet-row__edit" (click)="remove(s)">
                  {{ 'common.actions.delete' | translate }}
                </button>
              </li>
            }
          </ul>
        }
      </div>
      <termsh-drawer [open]="drawerOpen()" variant="snippets" (close)="closeDrawer()">
        <span drawerTitle>
          {{ (editing() ? 'snippets.drawer.titleEdit' : 'snippets.drawer.titleNew') | translate }}
        </span>
        <form drawerBody class="drawer__body" (ngSubmit)="save()">
          <div class="vault-field">
            <span>{{ 'snippets.drawer.titleLabel' | translate }}</span>
            <input [(ngModel)]="draft.title" name="title" required />
          </div>
          <div class="vault-field vault-field--snippet">
            <span>{{ 'snippets.drawer.bodyLabel' | translate }}</span>
            <textarea [(ngModel)]="draft.body" name="body" rows="8" required></textarea>
          </div>
          <termsh-drawer-actions (cancel)="closeDrawer()" />
        </form>
      </termsh-drawer>
    </div>
  `,
})
export class SnippetsViewComponent implements OnInit {
  readonly state = inject(SnippetStateService);
  private readonly sessions = inject(SessionStateService);
  private readonly nav = inject(NavStateService);
  private readonly platform = inject(TermshPlatformService);

  query = "";
  readonly drawerOpen = signal(false);
  readonly editing = signal<Snippet | null>(null);
  draft = { title: "", body: "", tags: [] as string[] };

  ngOnInit() {
    void this.state.load();
  }

  filtered(list: Snippet[]): Snippet[] {
    const q = this.query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((s) => `${s.title}\n${s.body}`.toLowerCase().includes(q));
  }

  openNew() {
    this.editing.set(null);
    this.draft = { title: "", body: "", tags: [] };
    this.drawerOpen.set(true);
  }

  openEdit(s: Snippet) {
    this.editing.set(s);
    this.draft = { title: s.title, body: s.body, tags: s.tags };
    this.drawerOpen.set(true);
  }

  closeDrawer() {
    this.drawerOpen.set(false);
  }

  async save() {
    await this.state.save({
      id: this.editing()?.id,
      ...this.draft,
    });
    this.closeDrawer();
  }

  async remove(s: Snippet) {
    await this.state.remove(s.id);
  }

  send(s: Snippet) {
    let id = this.sessions.activeSessionId;
    if (!id) {
      this.sessions.openLocalShell();
      id = this.sessions.activeSessionId;
      this.nav.setView("terminal");
    }
    if (id) {
      const body = s.body.endsWith("\n") ? s.body : `${s.body}\n`;
      this.platform.ptyWrite(id, body);
      this.nav.setView("terminal");
    }
  }
}
