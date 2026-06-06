import iconMono from "@/assets/brand/icon-mono.png";
import wordmarkMono from "@/assets/brand/wordmark-mono.png";

/**
 * mark — icon-mono.png (kasa kilidi, ikon alanları)
 * wordmark — wordmark-mono.png (ikon + "termsh" yazısı)
 */
export type TermshLogoVariant = "mark" | "wordmark" | "wordmark-mono";

type Props = {
  variant?: TermshLogoVariant;
  /** İkon için kare kenar; wordmark için yükseklik (px). */
  size?: number;
  className?: string;
  alt?: string;
};

const SOURCES: Record<TermshLogoVariant, string> = {
  mark: iconMono,
  wordmark: wordmarkMono,
  "wordmark-mono": wordmarkMono,
};

function isWordmark(variant: TermshLogoVariant): boolean {
  return variant !== "mark";
}

export function TermshLogo({
  variant = "mark",
  size = 28,
  className,
  alt = "termsh",
}: Props) {
  const wordmark = isWordmark(variant);

  return (
    <img
      src={SOURCES[variant]}
      alt={alt}
      width={wordmark ? undefined : size}
      height={size}
      className={
        wordmark
          ? `termsh-logo termsh-logo--wordmark ${className ?? ""}`.trim()
          : className
            ? `termsh-logo ${className}`
            : "termsh-logo"
      }
      draggable={false}
      decoding="async"
    />
  );
}
