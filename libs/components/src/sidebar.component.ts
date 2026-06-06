import { AsyncPipe } from "@angular/common";
import { Component, inject } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { TermshIconComponent, type IconName } from "@termsh/angular";
import { NavStateService, SessionStateService, type AppView } from "@termsh/state";
import { map } from "rxjs";

type NavItem = {
  id: AppView;
  labelKey: string;
  icon: IconName;
};

const ITEMS: NavItem[] = [
  { id: "hosts", labelKey: "nav.servers", icon: "dns" },
  { id: "snippets", labelKey: "nav.snippets", icon: "code" },
  { id: "vault", labelKey: "nav.vault", icon: "lock" },
  { id: "keys", labelKey: "nav.keys", icon: "key" },
  { id: "settings", labelKey: "nav.settings", icon: "settings" },
];

@Component({
  selector: "termsh-sidebar",
  standalone: true,
  imports: [AsyncPipe, TranslateModule, TermshIconComponent],
  template: `
    <aside class="sidebar" [attr.aria-label]="'nav.navigation' | translate">
      <div class="sidebar__inner">
        <nav class="sidebar__nav" [attr.aria-label]="'nav.pages' | translate">
          @for (item of items; track item.id) {
            <button
              type="button"
              class="sidebar__item"
              [class.sidebar__item--active]="(effectiveView$ | async) === item.id"
              [attr.aria-current]="(effectiveView$ | async) === item.id ? 'page' : null"
              [title]="item.labelKey | translate"
              (click)="nav.setView(item.id)"
            >
              <span class="sidebar__icon">
                <termsh-icon [name]="item.icon" [size]="18" />
              </span>
              <span class="sidebar__label">{{ item.labelKey | translate }}</span>
            </button>
          }
        </nav>

        @if ((sessions$ | async)?.length; as count) {
          @if (count > 0) {
            <div class="sidebar__sessions">
              <div class="sidebar__divider"></div>
              @for (s of (sessions$ | async)?.slice(0, 5); track s.id) {
                <button
                  type="button"
                  class="sidebar__item sidebar__item--session"
                  [class.sidebar__item--active]="
                    (view$ | async) === 'terminal' && (activeId$ | async) === s.id
                  "
                  [title]="s.title"
                  (click)="openSession(s.id)"
                >
                  <span class="sidebar__icon">
                    <termsh-icon
                      [name]="s.kind === 'local' ? 'laptop' : s.kind === 'remote' ? 'folder' : 'terminal'"
                      [size]="16"
                    />
                  </span>
                  <span class="sidebar__label">{{ s.title }}</span>
                  <span
                    class="sidebar__dot"
                    [class.sidebar__dot--live]="
                      (view$ | async) === 'terminal' && (activeId$ | async) === s.id
                    "
                  ></span>
                </button>
              }
              @if (count > 5) {
                <span class="sidebar__more">+{{ count - 5 }}</span>
              }
            </div>
          }
        }
      </div>
    </aside>
  `,
})
export class SidebarComponent {
  readonly nav = inject(NavStateService);
  private readonly sessions = inject(SessionStateService);
  readonly items = ITEMS;

  readonly view$ = this.nav.viewStream$;
  readonly sessions$ = this.sessions.sessionsStream$;
  readonly activeId$ = this.sessions.activeSessionIdStream$;

  readonly effectiveView$ = this.nav.viewStream$.pipe(
    map((view) => (view === "terminal" ? "hosts" : view)),
  );

  openSession(id: string) {
    this.sessions.setActiveSession(id);
    this.nav.setView("terminal");
  }
}
