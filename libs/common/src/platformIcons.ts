import type { HostPlatform } from "./hostPlatform";
import type { SimpleIcon } from "simple-icons";
import {
  siAlpinelinux,
  siApple,
  siArchlinux,
  siCentos,
  siDebian,
  siFedora,
  siFreebsd,
  siLinux,
  siUbuntu,
} from "simple-icons";

/** Marka SVG yolu — Simple Icons (CC0) veya elle doğrulanmış Windows markası. */
export type PlatformBrandIcon = {
  title: string;
  path: string;
  color: string;
};

function fromSimpleIcon(icon: SimpleIcon, color?: string): PlatformBrandIcon {
  return {
    title: icon.title,
    path: icon.path,
    color: color ?? `#${icon.hex}`,
  };
}

/** Microsoft Windows — Simple Icons’ta yok; resmi dört bölme logosu. */
const WINDOWS: PlatformBrandIcon = {
  title: "Windows",
  color: "#0078D4",
  path: "M0 0h11v11H0V0zm13 0h11v11H13V0zM0 13h11v11H0V13zm13 0h11v11H13V13",
};

const UNKNOWN: PlatformBrandIcon = {
  title: "Unknown",
  color: "var(--s-muted)",
  path: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zm-1.25 4.25h2.5v7.5h-2.5v-7.5z",
};

export const HOST_PLATFORM_ICONS: Record<HostPlatform, PlatformBrandIcon> = {
  linux: fromSimpleIcon(siLinux),
  ubuntu: fromSimpleIcon(siUbuntu),
  debian: fromSimpleIcon(siDebian),
  centos: fromSimpleIcon(siCentos),
  fedora: fromSimpleIcon(siFedora),
  alpine: fromSimpleIcon(siAlpinelinux),
  arch: fromSimpleIcon(siArchlinux),
  windows: WINDOWS,
  macos: fromSimpleIcon(siApple, "#F5F5F7"),
  freebsd: fromSimpleIcon(siFreebsd),
  unknown: UNKNOWN,
};

export function getHostPlatformIcon(platform: HostPlatform): PlatformBrandIcon {
  return HOST_PLATFORM_ICONS[platform] ?? HOST_PLATFORM_ICONS.unknown;
}
