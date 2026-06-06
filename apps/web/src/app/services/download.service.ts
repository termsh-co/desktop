import { Injectable } from "@angular/core";
import {
  CTA_PLATFORMS,
  detectPrimaryPlatform,
  fetchLatestRelease,
  formatVersionLabel,
  type DownloadPlatform,
  type LatestRelease,
} from "../../lib/downloads";

@Injectable({ providedIn: "root" })
export class DownloadService {
  private release: LatestRelease | null = null;

  async latest(force = false): Promise<LatestRelease> {
    this.release = await fetchLatestRelease(force);
    return this.release;
  }

  primaryPlatform(): DownloadPlatform {
    return detectPrimaryPlatform();
  }

  versionLabel(release?: LatestRelease | null): string {
    const version = release?.version ?? this.release?.version ?? "0.2.0";
    return formatVersionLabel(version);
  }

  ctaPlatforms(release: LatestRelease) {
    return CTA_PLATFORMS.map((entry) => ({
      ...entry,
      label: release.assets[entry.id].label,
      url: release.assets[entry.id].url,
      available: release.assets[entry.id].available,
    }));
  }

  primaryAsset(release: LatestRelease) {
    return release.assets[this.primaryPlatform()];
  }

  downloadCards(release: LatestRelease) {
    const order: DownloadPlatform[] = ["macos", "windows", "linux", "macosIntel", "linuxDeb"];
    const icons: Record<DownloadPlatform, "apple" | "monitor" | "terminal"> = {
      macos: "apple",
      macosIntel: "apple",
      windows: "monitor",
      linux: "terminal",
      linuxDeb: "terminal",
    };
    return order.map((id) => ({
      id,
      icon: icons[id],
      ...release.assets[id],
    }));
  }
}
