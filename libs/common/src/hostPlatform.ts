export type HostPlatform =
  | "linux"
  | "ubuntu"
  | "debian"
  | "centos"
  | "fedora"
  | "alpine"
  | "arch"
  | "windows"
  | "macos"
  | "freebsd"
  | "unknown";

export const HOST_PLATFORMS: HostPlatform[] = [
  "linux",
  "ubuntu",
  "debian",
  "centos",
  "fedora",
  "alpine",
  "arch",
  "windows",
  "macos",
  "freebsd",
  "unknown",
];

export const HOST_PLATFORM_LABELS: Record<HostPlatform, string> = {
  linux: "Linux",
  ubuntu: "Ubuntu",
  debian: "Debian",
  centos: "RHEL / CentOS",
  fedora: "Fedora",
  alpine: "Alpine",
  arch: "Arch Linux",
  windows: "Windows",
  macos: "macOS",
  freebsd: "FreeBSD",
  unknown: "Bilinmiyor",
};
