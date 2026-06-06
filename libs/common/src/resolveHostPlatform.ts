import type { HostPlatform } from "./hostPlatform";
import type { Host } from "./types";

/** Prefer stored platform; otherwise guess from name, group, hostname, tags. */
export function resolveHostPlatform(host: Host): HostPlatform {
  if (host.platform) return host.platform;

  const hay = [host.name, host.group, host.hostname, ...host.tags].join(" ").toLowerCase();

  if (hay.includes("ubuntu")) return "ubuntu";
  if (hay.includes("debian")) return "debian";
  if (hay.includes("centos") || hay.includes("rhel") || hay.includes("rocky") || hay.includes("alma")) {
    return "centos";
  }
  if (hay.includes("fedora")) return "fedora";
  if (hay.includes("alpine")) return "alpine";
  if (hay.includes("arch")) return "arch";
  if (hay.includes("windows") || hay.includes("win-server")) return "windows";
  if (hay.includes("macos") || hay.includes("darwin") || hay.includes("mac ")) return "macos";
  if (hay.includes("freebsd") || hay.includes("bsd")) return "freebsd";

  return "linux";
}
