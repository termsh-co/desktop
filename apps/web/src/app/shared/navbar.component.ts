import {
  AfterViewInit,
  Component,
  HostListener,
  inject,
  OnDestroy,
  signal,
} from "@angular/core";
import { NavigationEnd, Router, RouterLink } from "@angular/router";
import { filter, Subscription } from "rxjs";
import { LandingLogoComponent } from "./landing-logo.component";

const SCROLL_THRESHOLD = 96;

const NAV_LINKS = [
  { label: "Features", to: "/#features" },
  { label: "Security", to: "/security" },
  { label: "Enterprise", to: "/enterprise" },
  { label: "Pricing", to: "/pricing" },
] as const;

@Component({
  selector: "termsh-navbar",
  standalone: true,
  imports: [RouterLink, LandingLogoComponent],
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        max-width: var(--layout-max);
      }
    `,
  ],
  template: `
    <nav class="navbar navbar--top" aria-label="Main navigation">
      <a routerLink="/" class="navbar-logo" aria-label="termsh home" (click)="closeMenu()">
        <termsh-landing-logo className="navbar-logo__img" />
      </a>

      <div class="navbar-links">
        @for (link of links; track link.label) {
          @if (linkFragment(link.to); as fragment) {
            <a
              routerLink="/"
              [fragment]="fragment"
              [class.is-active]="isLinkActive(link.to)"
              (click)="closeMenu()"
            >
              {{ link.label }}
            </a>
          } @else {
            <a
              [routerLink]="link.to"
              [class.is-active]="isLinkActive(link.to)"
              (click)="closeMenu()"
            >
              {{ link.label }}
            </a>
          }
        }
      </div>

      <div class="navbar-actions">
        <a routerLink="/register" class="btn-ghost" (click)="closeMenu()">Sign up</a>
        <a routerLink="/login" class="btn-solid" (click)="closeMenu()">Login</a>
      </div>

      <button
        type="button"
        class="hamburger"
        [class.open]="menuOpen()"
        [attr.aria-label]="menuOpen() ? 'Close menu' : 'Open menu'"
        [attr.aria-expanded]="menuOpen()"
        (click)="toggleMenu()"
      >
        <span></span><span></span>
      </button>
    </nav>

    @if (scrolled()) {
      <header class="navbar-sticky navbar-sticky--enter" role="banner">
        <div class="navbar-sticky__glow" aria-hidden></div>
        <nav class="navbar-sticky__shell" aria-label="Main navigation">
          <a routerLink="/" class="navbar-logo" aria-label="termsh home" (click)="closeMenu()">
            <termsh-landing-logo className="navbar-sticky__logo" />
          </a>
          <div class="navbar-links">
            @for (link of links; track link.label) {
              @if (linkFragment(link.to); as fragment) {
                <a
                  routerLink="/"
                  [fragment]="fragment"
                  [class.is-active]="isLinkActive(link.to)"
                  (click)="closeMenu()"
                >
                  {{ link.label }}
                </a>
              } @else {
                <a
                  [routerLink]="link.to"
                  [class.is-active]="isLinkActive(link.to)"
                  (click)="closeMenu()"
                >
                  {{ link.label }}
                </a>
              }
            }
          </div>
          <div class="navbar-actions">
            <a routerLink="/register" class="btn-ghost" (click)="closeMenu()">Sign up</a>
            <a routerLink="/login" class="btn-solid" (click)="closeMenu()">Login</a>
          </div>
          <button
            type="button"
            class="hamburger navbar-sticky__hamburger"
            [class.open]="menuOpen()"
            [attr.aria-label]="menuOpen() ? 'Close menu' : 'Open menu'"
            [attr.aria-expanded]="menuOpen()"
            (click)="toggleMenu()"
          >
            <span></span><span></span>
          </button>
        </nav>
        <div class="navbar-sticky__shine" aria-hidden></div>
      </header>
    }

    <div class="mobile-overlay" [class.open]="menuOpen()" [attr.aria-hidden]="!menuOpen()">
      @for (link of links; track link.label) {
        @if (linkFragment(link.to); as fragment) {
          <a routerLink="/" [fragment]="fragment" (click)="closeMenu()">{{ link.label }}</a>
        } @else {
          <a [routerLink]="link.to" (click)="closeMenu()">{{ link.label }}</a>
        }
      }
      <div class="mobile-overlay-actions">
        <a routerLink="/register" class="btn-ghost" (click)="closeMenu()">Sign up</a>
        <a routerLink="/login" class="btn-solid" (click)="closeMenu()">Login</a>
      </div>
    </div>
  `,
})
export class NavbarComponent implements AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  private routerSub: Subscription | null = null;

  readonly links = NAV_LINKS;
  readonly scrolled = signal(false);
  readonly menuOpen = signal(false);

  private pathname = "/";
  private hash = "";

  constructor() {
    this.syncRoute(this.router.url);
    this.routerSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e) => this.syncRoute((e as NavigationEnd).urlAfterRedirects));
  }

  ngAfterViewInit() {
    this.onScroll();
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
    document.body.style.overflow = "";
  }

  @HostListener("window:scroll")
  onScroll() {
    const next = window.scrollY > SCROLL_THRESHOLD;
    this.scrolled.set(next);
    if (!next && this.menuOpen()) this.menuOpen.set(false);
  }

  linkFragment(to: string): string | null {
    if (!to.startsWith("/#")) return null;
    return to.slice(2);
  }

  isLinkActive(to: string): boolean {
    if (to.startsWith("/#")) {
      const id = to.slice(2);
      return this.pathname === "/" && this.hash === id;
    }
    return this.pathname === to;
  }

  toggleMenu() {
    const next = !this.menuOpen();
    this.menuOpen.set(next);
    document.body.style.overflow = next ? "hidden" : "";
  }

  closeMenu() {
    this.menuOpen.set(false);
    document.body.style.overflow = "";
  }

  private syncRoute(url: string) {
    const [pathPart, hashPart = ""] = url.split("#");
    this.pathname = pathPart.split("?")[0] || "/";
    this.hash = hashPart;
  }
}
