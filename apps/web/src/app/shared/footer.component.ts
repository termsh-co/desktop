import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";
import { SITE_LINKS } from "../../lib/site-links";
import { LandingLogoComponent } from "./landing-logo.component";
import { SocialIconComponent } from "./social-icon.component";

const PRODUCT_LINKS = [
  { label: "Features", to: "/#features" },
  { label: "Enterprise", to: "/enterprise" },
  { label: "Pricing", to: "/pricing" },
  { label: "Download", to: "/#download" },
];

const TRUST_LINKS = [
  { label: "Security", to: SITE_LINKS.trust.security },
  { label: "System Status", to: SITE_LINKS.trust.status },
  { label: "Trust Center", to: SITE_LINKS.trust.trustCenter },
  { label: "Changelog", to: SITE_LINKS.trust.changelog },
];

const PLATFORM_LINKS = [
  { label: "iPad", to: SITE_LINKS.platforms.ipad },
  { label: "iPhone", to: SITE_LINKS.platforms.iphone },
  { label: "Android", to: SITE_LINKS.platforms.android },
  { label: "macOS", to: SITE_LINKS.platforms.macos },
  { label: "Windows", to: SITE_LINKS.platforms.windows },
  { label: "Linux", to: SITE_LINKS.platforms.linux },
];

const COMPANY_LINKS = [
  { label: "About Us", to: SITE_LINKS.company.about },
  { label: "Blog", to: SITE_LINKS.company.blog },
  { label: "Brand Resources", to: SITE_LINKS.company.brand },
];

const LEGAL = [
  { label: "Terms of Use", href: SITE_LINKS.legal.terms },
  { label: "Privacy Policy", href: SITE_LINKS.legal.privacy },
  { label: "Responsible Disclosure", href: SITE_LINKS.legal.disclosure },
];

const SOCIAL = [
  { id: "x" as const, label: "X (Twitter)", href: SITE_LINKS.social.x },
  { id: "reddit" as const, label: "Reddit", href: SITE_LINKS.social.reddit },
  { id: "github" as const, label: "GitHub", href: SITE_LINKS.social.github },
];

@Component({
  selector: "termsh-footer",
  standalone: true,
  imports: [RouterLink, LandingLogoComponent, SocialIconComponent],
  template: `
    <footer class="site-footer">
      <div class="site-footer__main">
        <div class="site-footer__inner">
          <div class="site-footer__links">
            <div class="site-footer__col">
              <p class="site-footer__col-title">SSH client for</p>
              <ul class="site-footer__col-list">
                @for (link of platformLinks; track link.label) {
                  <li><a [routerLink]="link.to">{{ link.label }}</a></li>
                }
              </ul>
            </div>
            <div class="site-footer__col">
              <p class="site-footer__col-title">Product</p>
              <ul class="site-footer__col-list">
                @for (link of productLinks; track link.label) {
                  <li>
                    @if (link.to.includes('#')) {
                      <a routerLink="/" [fragment]="link.to.split('#')[1]">{{ link.label }}</a>
                    } @else {
                      <a [routerLink]="link.to">{{ link.label }}</a>
                    }
                  </li>
                }
              </ul>
            </div>
            <div class="site-footer__col">
              <p class="site-footer__col-title">Company</p>
              <ul class="site-footer__col-list">
                @for (link of companyLinks; track link.label) {
                  <li><a [routerLink]="link.to">{{ link.label }}</a></li>
                }
              </ul>
            </div>
            <div class="site-footer__col">
              <p class="site-footer__col-title">Trust</p>
              <ul class="site-footer__col-list">
                @for (link of trustLinks; track link.label) {
                  <li><a [routerLink]="link.to">{{ link.label }}</a></li>
                }
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div class="site-footer__bar">
        <div class="site-footer__bar-inner">
          <div class="site-footer__bar-brand">
            <a routerLink="/" class="site-footer__logo" aria-label="termsh home">
              <termsh-landing-logo className="site-footer__logo-img" />
            </a>
            <p class="site-footer__tagline">
              Lightweight SSH terminal for teams who live in the command line.
            </p>
          </div>

          <nav class="site-footer__legal" aria-label="Legal">
            @for (item of legal; track item.label; let i = $index) {
              <span class="site-footer__legal-item">
                @if (i > 0) {
                  <span class="site-footer__legal-sep" aria-hidden>|</span>
                }
                @if (item.href.startsWith('mailto:')) {
                  <a [href]="item.href">{{ item.label }}</a>
                } @else {
                  <a [routerLink]="item.href">{{ item.label }}</a>
                }
              </span>
            }
          </nav>

          <div class="site-footer__social" aria-label="Social">
            @for (item of social; track item.id) {
              <a
                [href]="item.href"
                class="site-footer__social-link"
                [attr.aria-label]="item.label"
                target="_blank"
                rel="noopener noreferrer"
              >
                <termsh-social-icon [id]="item.id" />
              </a>
            }
          </div>
        </div>
      </div>
    </footer>
  `,
})
export class FooterComponent {
  readonly productLinks = PRODUCT_LINKS;
  readonly trustLinks = TRUST_LINKS;
  readonly platformLinks = PLATFORM_LINKS;
  readonly companyLinks = COMPANY_LINKS;
  readonly legal = LEGAL;
  readonly social = SOCIAL;
}
