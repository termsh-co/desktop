import type { HostPlatform } from "./hostPlatform";

/** SSH banner, MOTD, /etc/os-release veya uname çıktısından platform tahmini. */
export function detectPlatformFromText(raw: string): HostPlatform | null {
  const text = raw.toLowerCase();

  const idMatch = text.match(/^id=(.+)$/m);
  if (idMatch) {
    const id = idMatch[1].trim().replace(/"/g, "");
    const mapped = mapOsReleaseId(id);
    if (mapped) return mapped;
  }

  if (text.includes("ubuntu")) return "ubuntu";
  if (text.includes("debian")) return "debian";
  if (
    text.includes("centos") ||
    text.includes("rocky") ||
    text.includes("alma") ||
    text.includes("red hat") ||
    text.includes("rhel")
  ) {
    return "centos";
  }
  if (text.includes("fedora")) return "fedora";
  if (text.includes("alpine")) return "alpine";
  if (text.includes("arch")) return "arch";
  if (text.includes("freebsd")) return "freebsd";
  if (text.includes("darwin") || text.includes("macos")) return "macos";
  if (text.includes("windows") || text.includes("microsoft")) return "windows";
  if (text.includes("linux") || text.includes("openssh")) return "linux";

  return null;
}

function mapOsReleaseId(id: string): HostPlatform | null {
  switch (id) {
    case "ubuntu":
      return "ubuntu";
    case "debian":
      return "debian";
    case "centos":
    case "rhel":
    case "rocky":
    case "almalinux":
    case "alma":
      return "centos";
    case "fedora":
      return "fedora";
    case "alpine":
      return "alpine";
    case "arch":
    case "archlinux":
      return "arch";
    case "freebsd":
      return "freebsd";
    case "darwin":
    case "macos":
      return "macos";
    case "windows":
      return "windows";
    default:
      return null;
  }
}
