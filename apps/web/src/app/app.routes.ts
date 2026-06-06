import { Routes } from "@angular/router";
import { AuthLayoutComponent } from "./layout/auth-layout.component";
import { MarketingLayoutComponent } from "./layout/marketing-layout.component";

export const routes: Routes = [
  {
    path: "",
    component: MarketingLayoutComponent,
    children: [
      { path: "", loadComponent: () => import("./pages/home.page").then((m) => m.HomePage) },
      { path: "pricing", loadComponent: () => import("./pages/pricing.page").then((m) => m.PricingPage) },
      { path: "enterprise", loadComponent: () => import("./pages/enterprise.page").then((m) => m.EnterprisePage) },
      { path: "about", loadComponent: () => import("./pages/about.page").then((m) => m.AboutPage) },
      { path: "security", loadComponent: () => import("./pages/security.page").then((m) => m.SecurityPage) },
      { path: "download", loadComponent: () => import("./pages/download.page").then((m) => m.DownloadPage) },
      { path: "changelog", loadComponent: () => import("./pages/changelog.page").then((m) => m.ChangelogPage) },
      {
        path: "terms",
        loadComponent: () => import("./pages/legal-stub.page").then((m) => m.LegalStubPage),
        data: { title: "Terms of Use", titleId: "terms-title" },
      },
      {
        path: "privacy",
        loadComponent: () => import("./pages/legal-stub.page").then((m) => m.LegalStubPage),
        data: { title: "Privacy Policy", titleId: "privacy-title" },
      },
      {
        path: "blog",
        loadComponent: () => import("./pages/legal-stub.page").then((m) => m.LegalStubPage),
        data: { title: "Blog", titleId: "blog-title" },
      },
      {
        path: "brand",
        loadComponent: () => import("./pages/legal-stub.page").then((m) => m.LegalStubPage),
        data: { title: "Brand Resources", titleId: "brand-title" },
      },
      {
        path: "status",
        loadComponent: () => import("./pages/legal-stub.page").then((m) => m.LegalStubPage),
        data: {
          title: "System Status",
          titleId: "status-title",
          eyebrow: "Trust",
          lead: "Live uptime and incident history will be published here. For urgent issues, email us.",
        },
      },
      {
        path: "trust",
        loadComponent: () => import("./pages/legal-stub.page").then((m) => m.LegalStubPage),
        data: {
          title: "Trust Center",
          titleId: "trust-title",
          eyebrow: "Trust",
          lead: "Policies, subprocessors, and data handling summaries for security reviews.",
        },
      },
    ],
  },
  {
    path: "",
    component: AuthLayoutComponent,
    children: [
      { path: "login", loadComponent: () => import("./pages/login.page").then((m) => m.LoginPage) },
      { path: "register", loadComponent: () => import("./pages/register.page").then((m) => m.RegisterPage) },
    ],
  },
  { path: "**", redirectTo: "" },
];
