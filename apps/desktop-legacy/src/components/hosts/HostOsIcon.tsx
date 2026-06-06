import type { HostPlatform } from "@termsh/shared";
import { getHostPlatformIcon } from "@/lib/hosts/platformIcons";

type Props = {
  platform: HostPlatform;
  size?: number;
  className?: string;
};

/** İşletim sistemi marka logoları (Simple Icons + Windows). */
export function HostOsIcon({ platform, size = 28, className = "" }: Props) {
  const icon = getHostPlatformIcon(platform);
  const cn = `host-os-icon host-os-icon--${platform} ${className}`.trim();

  return (
    <svg
      className={cn}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label={icon.title}
    >
      <path d={icon.path} fill={icon.color} />
    </svg>
  );
}
