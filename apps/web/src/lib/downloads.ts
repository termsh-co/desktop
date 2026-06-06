/** termsh.co — canonical download origin (redirects or API-backed assets). */
export const DOWNLOAD_ORIGIN = "https://termsh.co";

export const RELEASES_API = `${DOWNLOAD_ORIGIN}/api/releases/latest`;

export type DownloadPlatform =
  | "macos"
  | "macosIntel"
  | "windows"
  | "linux"
  | "linuxDeb";

export type DownloadSlug =
  | "macos"
  | "macos-intel"
  | "windows"
  | "linux"
  | "linux-deb";

export type ReleaseAsset = {
  label: string;
  ext: string;
  arch: string;
  url: string;
  available: boolean;
};

export type LatestRelease = {
  version: string;
  assets: Record<DownloadPlatform, ReleaseAsset>;
};

export const PLATFORM_SLUGS: Record<DownloadPlatform, DownloadSlug> = {
  macos: "macos",
  macosIntel: "macos-intel",
  windows: "windows",
  linux: "linux",
  linuxDeb: "linux-deb",
};

export const CTA_PLATFORMS: Array<{
  id: DownloadPlatform;
  icon: "apple" | "monitor" | "terminal";
}> = [
  { id: "macos", icon: "apple" },
  { id: "windows", icon: "monitor" },
  { id: "linux", icon: "terminal" },
];

const FALLBACK_VERSION = "0.2.0";

const FALLBACK_META: Record<
  DownloadPlatform,
  Pick<ReleaseAsset, "label" | "ext" | "arch">
> = {
  macos: { label: "macOS", ext: ".dmg", arch: "ARM64 (Apple Silicon)" },
  macosIntel: { label: "macOS (Intel)", ext: ".dmg", arch: "x86_64" },
  windows: { label: "Windows", ext: ".exe", arch: "x86_64" },
  linux: { label: "Linux", ext: ".AppImage", arch: "x86_64" },
  linuxDeb: { label: "Linux (deb)", ext: ".deb", arch: "x86_64" },
};

/** Direct server download route — termsh.co redirects to the release artifact. */
export function serverDownloadUrl(slug: DownloadSlug, version?: string): string {
  const query = version ? `?version=${encodeURIComponent(version)}` : "";
  return `${DOWNLOAD_ORIGIN}/download/${slug}${query}`;
}

export function formatVersionLabel(version: string): string {
  return version.startsWith("v") ? version : `v${version}`;
}

export function detectPrimaryPlatform(): DownloadPlatform {
  if (typeof navigator === "undefined") return "macos";

  const ua = navigator.userAgent;
  if (/Win/i.test(ua)) return "windows";
  if (/Linux/i.test(ua) && !/Android/i.test(ua)) return "linux";
  if (/Mac/i.test(ua)) return "macos";
  return "macos";
}

function buildFallbackRelease(): LatestRelease {
  const version = FALLBACK_VERSION;
  const assets = Object.entries(FALLBACK_META).reduce(
    (acc, [id, meta]) => {
      const platform = id as DownloadPlatform;
      acc[platform] = {
        ...meta,
        url: serverDownloadUrl(PLATFORM_SLUGS[platform], version),
        available: true,
      };
      return acc;
    },
    {} as Record<DownloadPlatform, ReleaseAsset>,
  );

  return { version, assets };
}

function normalizeAsset(
  platform: DownloadPlatform,
  raw: Partial<ReleaseAsset> | undefined,
  version: string,
): ReleaseAsset {
  const meta = FALLBACK_META[platform];
  const slug = PLATFORM_SLUGS[platform];
  return {
    label: raw?.label ?? meta.label,
    ext: raw?.ext ?? meta.ext,
    arch: raw?.arch ?? meta.arch,
    url: raw?.url ?? serverDownloadUrl(slug, version),
    available: raw?.available ?? true,
  };
}

function normalizeRelease(payload: Partial<LatestRelease>): LatestRelease {
  const version = payload.version ?? FALLBACK_VERSION;
  const assets = (Object.keys(FALLBACK_META) as DownloadPlatform[]).reduce(
    (acc, platform) => {
      acc[platform] = normalizeAsset(platform, payload.assets?.[platform], version);
      return acc;
    },
    {} as Record<DownloadPlatform, ReleaseAsset>,
  );
  return { version, assets };
}

let cachedRelease: LatestRelease | null = null;
let inflight: Promise<LatestRelease> | null = null;

/** Fetch latest release manifest from termsh.co; falls back to server download routes. */
export async function fetchLatestRelease(force = false): Promise<LatestRelease> {
  if (!force && cachedRelease) return cachedRelease;
  if (!force && inflight) return inflight;

  inflight = (async () => {
    try {
      const res = await fetch(RELEASES_API, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`releases ${res.status}`);
      const data = (await res.json()) as Partial<LatestRelease>;
      cachedRelease = normalizeRelease(data);
    } catch {
      cachedRelease = buildFallbackRelease();
    } finally {
      inflight = null;
    }
    return cachedRelease!;
  })();

  return inflight;
}

/** @deprecated Use fetchLatestRelease — kept for static imports during migration. */
export const LATEST_VERSION = formatVersionLabel(FALLBACK_VERSION);
