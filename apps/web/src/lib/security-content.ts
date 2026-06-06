export type SecurityIconId =
  | "hard-drive"
  | "lock"
  | "fingerprint"
  | "shield"
  | "key"
  | "server";

export type SecurityPillar = {
  icon: SecurityIconId;
  title: string;
  description: string;
};

export type SecurityDetail = {
  term: string;
  detail: string;
};

export const SECURITY_PILLARS: SecurityPillar[] = [
  {
    icon: "hard-drive",
    title: "Local by default",
    description:
      "Vault, hosts, and session metadata stay on your machine in Phase 1 — no termsh cloud required.",
  },
  {
    icon: "lock",
    title: "Industry-standard crypto",
    description:
      "Argon2id key derivation and AES-256-GCM for secrets at rest inside the encrypted vault.",
  },
  {
    icon: "fingerprint",
    title: "Transparent roadmap",
    description:
      "Cloud sync and team vaults are opt-in when they ship. We label beta platforms and roadmap items clearly.",
  },
];

export const SECURITY_DETAILS: SecurityDetail[] = [
  {
    term: "Master key",
    detail: "Derived with Argon2id; unlocking the vault never sends your passphrase to a server.",
  },
  {
    term: "Secrets at rest",
    detail: "Passwords and PEM keys are stored with AES-256-GCM inside the local encrypted vault file.",
  },
  {
    term: "Host database",
    detail: "SQLite on disk for host labels, groups, and connection metadata — not your shell history.",
  },
  {
    term: "OS integration",
    detail: "Platform keychain hooks where available so the vault can stay locked between sessions.",
  },
  {
    term: "SSH sessions",
    detail: "Connections run through the native SSH stack; host keys follow your system known_hosts policy.",
  },
  {
    term: "Telemetry",
    detail: "Phase 1 does not require a termsh account. We do not sync credentials to the cloud today.",
  },
];

export const SECURITY_PRACTICES: SecurityPillar[] = [
  {
    icon: "shield",
    title: "Least privilege",
    description:
      "The desktop app only requests permissions it needs for PTY, SSH, and secure local storage.",
  },
  {
    icon: "key",
    title: "Credential hygiene",
    description: "One vault per device, clear unlock flow, and no plaintext secrets in config files or logs.",
  },
  {
    icon: "server",
    title: "Future team tiers",
    description:
      "Shared libraries and audit logs will reuse the same crypto primitives — documented before launch.",
  },
];
