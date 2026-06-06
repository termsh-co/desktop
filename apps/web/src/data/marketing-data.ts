export type Feature = {
  title: string;
  description: string;
  image: string;
  imageAlt: string;
};

export const FEATURES: Feature[] = [
  {
    title: "Unified terminal",
    description:
      "Local shell and SSH in one window. Tabs, fit-to-window sizing, and a theme that matches the rest of termsh.",
    image: "/screenshots/ssh-connect.png",
    imageAlt: "termsh SSH connection flow",
  },
  {
    title: "Host library",
    description:
      "SQLite-backed hosts with platform icons from SSH banners. Save once, connect in one click.",
    image: "/screenshots/hosts.webp",
    imageAlt: "termsh host library",
  },
  {
    title: "Encrypted vault",
    description:
      "Passwords and PEM keys protected with Argon2 and AES-GCM. Unlock once, credentials stay ready.",
    image: "/screenshots/vault.png",
    imageAlt: "termsh vault-backed SSH password",
  },
  {
    title: "Host grid & drawer",
    description:
      "Browse infrastructure as cards, edit in a slide-over, and jump straight into a session.",
    image: "/screenshots/host-grid.webp",
    imageAlt: "termsh host grid",
  },
  {
    title: "Command palette",
    description: "⌘K surfaces hosts and actions instantly — search, connect, and navigate without the mouse.",
    image: "/screenshots/command-palette.webp",
    imageAlt: "termsh command palette",
  },
  {
    title: "Keyboard-first",
    description: "⌘T new tab, ⌘W close, and shortcuts that stay out of your way while you work.",
    image: "/screenshots/tray-menu.png",
    imageAlt: "termsh menu bar quick access",
  },
];

export type WorkflowStep = {
  id: string;
  icon: "download" | "key" | "terminal";
  title: string;
  description: string;
};

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: "install",
    icon: "download",
    title: "Install",
    description: "Native app for macOS, Windows, and Linux. No signup.",
  },
  {
    id: "unlock",
    icon: "key",
    title: "Unlock",
    description: "One master password. Vault stays on your machine.",
  },
  {
    id: "connect",
    icon: "terminal",
    title: "Connect",
    description: "SSH or local shell with credentials ready to go.",
  },
];

export type PricingTier = {
  name: string;
  price: string;
  period: string;
  description: string;
  badge?: string;
  featured?: boolean;
  soon?: boolean;
  cta: string;
  ctaHref?: string;
  ctaDisabled?: boolean;
  features: string[];
};

export const PRICING_TIERS: PricingTier[] = [
  {
    name: "Desktop",
    price: "Free",
    period: "during beta",
    description: "Full Phase 1 client for individuals. Local vault, SSH, and terminal — no account.",
    badge: "Current",
    featured: true,
    cta: "Download",
    ctaHref: "/#download",
    features: [
      "Local shell & SSH tabs",
      "Encrypted vault on device",
      "Unlimited local hosts",
      "macOS beta builds",
      "Command palette & shortcuts",
    ],
  },
  {
    name: "Pro",
    price: "—",
    period: "coming soon",
    description: "Cloud sync, mobile clients, and priority updates when we ship multi-device.",
    soon: true,
    cta: "Join waitlist",
    ctaDisabled: true,
    features: [
      "Everything in Desktop",
      "Encrypted cloud backup",
      "iOS & Android apps",
      "Sync across devices",
      "Email support",
    ],
  },
  {
    name: "Team",
    price: "—",
    period: "coming soon",
    description: "Shared vaults, RBAC, and audit logs for engineering teams.",
    soon: true,
    cta: "Contact sales",
    ctaDisabled: true,
    features: [
      "Everything in Pro",
      "Shared host libraries",
      "Role-based access",
      "SSO (roadmap)",
      "Dedicated support",
    ],
  },
];

export const PRICING_FAQ = [
  {
    q: "Is termsh free during Phase 1?",
    a: "Yes. The desktop app is free while we are in closed beta. Pricing for Pro and Team will be announced before those tiers launch.",
  },
  {
    q: "Do I need an account to use the desktop app?",
    a: "No. Phase 1 runs entirely on your machine with a local vault — no termsh cloud login required.",
  },
  {
    q: "What happens to my data if I upgrade later?",
    a: "Your local vault remains yours. Future cloud tiers will be opt-in with clear migration paths.",
  },
];

export type CompareCellValue = boolean | "soon" | string;

export type CompareRow = {
  feature: string;
  desktop: CompareCellValue;
  pro: CompareCellValue;
  team: CompareCellValue;
};

export type CompareGroup = {
  label: string;
  rows: CompareRow[];
};

export const PRICING_COMPARE_GROUPS: CompareGroup[] = [
  {
    label: "Terminal & vault",
    rows: [
      { feature: "Local SSH & shell", desktop: true, pro: true, team: true },
      { feature: "Encrypted vault on device", desktop: true, pro: true, team: true },
      { feature: "Unlimited local hosts", desktop: true, pro: true, team: true },
      { feature: "Command palette & shortcuts", desktop: true, pro: true, team: true },
    ],
  },
  {
    label: "Platforms",
    rows: [
      { feature: "macOS", desktop: "Beta", pro: true, team: true },
      { feature: "Windows & Linux", desktop: "Beta", pro: true, team: true },
      { feature: "iOS & iPadOS", desktop: false, pro: "soon", team: "soon" },
      { feature: "Android", desktop: false, pro: "soon", team: "soon" },
    ],
  },
  {
    label: "Sync & backup",
    rows: [
      { feature: "Encrypted cloud backup", desktop: "Beta", pro: "soon", team: "soon" },
      { feature: "Sync across devices", desktop: "Beta", pro: "soon", team: "soon" },
      { feature: "termsh account required", desktop: false, pro: "soon", team: "soon" },
    ],
  },
  {
    label: "Team & security",
    rows: [
      { feature: "Shared host libraries", desktop: false, pro: false, team: "soon" },
      { feature: "Role-based access", desktop: false, pro: false, team: "soon" },
      { feature: "SAML SSO", desktop: false, pro: false, team: "soon" },
      { feature: "Audit logs", desktop: false, pro: false, team: "soon" },
    ],
  },
  {
    label: "Support",
    rows: [
      { feature: "Community & docs", desktop: true, pro: true, team: true },
      { feature: "Email support", desktop: false, pro: "soon", team: "soon" },
      { feature: "Dedicated support", desktop: false, pro: false, team: "soon" },
    ],
  },
];

export type EnterpriseSplit = {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  reverse?: boolean;
};

export const ENTERPRISE_SPLITS: EnterpriseSplit[] = [
  {
    eyebrow: "Security",
    title: "Secure by design from day one",
    description:
      "Encrypted vault, industry-standard KDF, and credentials that never leave the device in Phase 1. Enterprise tiers add shared libraries with the same crypto primitives.",
    image: "/screenshots/vault.png",
    imageAlt: "termsh encrypted vault",
  },
  {
    eyebrow: "Teams",
    title: "Onboard engineers in minutes",
    description:
      "Central host libraries replace scattered .env files and one-off SSH configs. New hires connect to staging and production without a ticket to platform.",
    image: "/screenshots/hosts.webp",
    imageAlt: "termsh host library",
    reverse: true,
  },
  {
    eyebrow: "Governance",
    title: "Access control and visibility",
    description:
      "Role-based permissions, session activity, and audit-friendly exports — built for security reviews without slowing operators down.",
    image: "/screenshots/ssh-connect.png",
    imageAlt: "termsh SSH session",
  },
];

export const ENTERPRISE_FAQ = [
  {
    q: "Can we buy Enterprise today?",
    a: "Team and Enterprise tiers are on the roadmap. Phase 1 is the desktop client only — reach out to shape requirements and get early access.",
  },
  {
    q: "Will our data leave our network?",
    a: "Phase 1 never requires cloud sync. Future team features will be opt-in with clear data boundaries before you enable them.",
  },
];

export type PlatformId = "macos" | "windows" | "linux" | "ios" | "ipados" | "android";

export const ENTERPRISE_PLATFORMS: {
  id: PlatformId;
  label: string;
  group: "desktop" | "mobile";
  phase: "beta" | "roadmap";
}[] = [
  { id: "macos", label: "macOS", group: "desktop", phase: "beta" },
  { id: "windows", label: "Windows", group: "desktop", phase: "roadmap" },
  { id: "linux", label: "Linux", group: "desktop", phase: "roadmap" },
  { id: "ios", label: "iOS", group: "mobile", phase: "roadmap" },
  { id: "ipados", label: "iPadOS", group: "mobile", phase: "roadmap" },
  { id: "android", label: "Android", group: "mobile", phase: "roadmap" },
];

export const ENTERPRISE_CAPABILITIES = [
  { icon: "users" as const, title: "Shared host libraries", description: "Curated profiles for every environment in one place." },
  { icon: "user-cog" as const, title: "Role-based access", description: "Separate who can view hosts from who can connect." },
  { icon: "key" as const, title: "SAML SSO", description: "Sign in with your existing identity provider." },
  { icon: "lock" as const, title: "Team vaults", description: "Encrypted secrets with clear rotation workflows." },
  { icon: "server" as const, title: "Audit logs", description: "Export-friendly activity for compliance and IR." },
  { icon: "zap" as const, title: "Priority support", description: "Direct access to the team shipping the client." },
];

export const ABOUT_VALUES = [
  {
    icon: "terminal" as const,
    title: "Native first",
    description:
      "A Tauri desktop client — not a browser tab. Fast startup, OS keychain integration, and a terminal that feels at home on your machine.",
  },
  {
    icon: "lock" as const,
    title: "Privacy by default",
    description:
      "Zero-knowledge encrypted cloud sync (beta) keeps hosts, keys, and snippets on your device. The server never sees your plain-text data.",
  },
  {
    icon: "gauge" as const,
    title: "Honest roadmap",
    description:
      'We ship what works, label what is beta, and say "soon" when it is not ready. No dark patterns, no surprise paywalls in beta.',
  },
];

export const ABOUT_PHASES = [
  {
    label: "Phase 1 — Desktop",
    status: "now" as const,
    summary:
      "macOS, Windows, and Linux beta: local shell, SSH, encrypted vault, host library, command palette, and split-view terminal.",
  },
  {
    label: "Phase 2 — Pro",
    status: "beta" as const,
    summary:
      "Zero-knowledge encrypted cloud sync (beta), sync across devices — opt-in, with a clear migration path from your local vault.",
  },
  {
    label: "Phase 3 — Team",
    status: "later" as const,
    summary:
      "Shared libraries, RBAC, SSO, and audit logs for platform and security teams who outgrew scattered SSH configs.",
  },
];

export const LEGAL_STUB_CONTENT: Record<string, string> = {
  "Terms of Use":
    "These terms govern your use of termsh. The desktop client is free during beta. Cloud sync is opt-in and zero-knowledge encrypted. Full terms will be published before the public launch.",
  "Privacy Policy":
    "termsh does not collect telemetry or personal data. Your hosts, keys, and snippets stay on your device. Cloud sync uses client-side AES-256-GCM encryption — the server never sees your plain-text data.",
  Blog: "Articles about termsh development, terminal tips, and SSH best practices will be published here. Follow along as we build.",
  "Brand Resources":
    "Download the termsh logo, icon, and brand assets for use in articles, videos, and integrations.",
  "System Status": "Live uptime and incident history will be published here. For urgent issues, email us.",
  "Trust Center":
    "Security policies, subprocessors, and compliance documentation for enterprise reviews. termsh uses zero-knowledge encryption by design.",
};

export const DEFAULT_LEGAL_LEAD =
  "We're preparing this document. Reach out if you need something in the meantime.";

export const CONTACT_EMAIL = "hello@monolitdigital.com";
