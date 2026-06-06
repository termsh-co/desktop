import { Component, inject, OnDestroy } from "@angular/core";
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { filter, Subscription } from "rxjs";
import { usesPageHero } from "../../lib/page-hero-routes";
import { FooterComponent } from "../shared/footer.component";
import { NavbarComponent } from "../shared/navbar.component";

@Component({
  selector: "termsh-marketing-layout",
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent],
  template: `
    <div [class]="layoutClass">
      <termsh-navbar />
      <router-outlet />
      <termsh-footer />
    </div>
  `,
})
export class MarketingLayoutComponent implements OnDestroy {
  private readonly router = inject(Router);
  private sub: Subscription;
  layoutClass = "page-layout";

  constructor() {
    this.applyBodyClass(this.router.url);
    this.sub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e) => this.applyBodyClass((e as NavigationEnd).urlAfterRedirects));
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
    document.body.classList.remove("layout-page-hero");
  }

  private applyBodyClass(url: string) {
    const path = url.split("?")[0].split("#")[0];
    const hasPageHero = usesPageHero(path);
    this.layoutClass = hasPageHero ? "page-layout page-layout--page-hero" : "page-layout";
    document.body.classList.toggle("layout-page-hero", hasPageHero);
  }
}
