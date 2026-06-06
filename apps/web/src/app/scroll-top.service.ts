import { Injectable, inject } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { ViewportScroller } from "@angular/common";
import { filter } from "rxjs";

@Injectable({ providedIn: "root" })
export class ScrollTopService {
  private readonly router = inject(Router);
  private readonly viewport = inject(ViewportScroller);

  init() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe(() => {
      const url = this.router.parseUrl(this.router.url);
      const fragment = url.fragment;
      if (fragment) {
        requestAnimationFrame(() => {
          document.getElementById(fragment)?.scrollIntoView({ behavior: "smooth" });
        });
      } else {
        this.viewport.scrollToPosition([0, 0]);
      }
    });
  }
}
