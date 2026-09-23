import { Link } from "@tanstack/react-router";

/**
 * FoodyPop V2 brand logo.
 * Source of truth: the supplied Canva V2 logo asset.
 *
 * Extracted from the asset:
 *  - Wordmark: FOODYPOP, bold rounded sans-serif, uppercase
 *  - Colors: mustard/amber #F5A623 (F,O,O,D), taupe/beige #C9B896 (Y),
 *            medium blue #4F86C1 (P,O,P)
 *  - Icon: rounded square, diagonal gradient amber→blue, white F/P monogram
 *
 * Variants:
 *  - lg   — full logo for authentication, onboarding, footer
 *  - md   — wordmark for desktop header (default)
 *  - sm   — compact wordmark for mobile header
 *  - icon — standalone icon mark (no wordmark) for favicon/app contexts
 */

export function BrandLogo({ size = "md" }: { size?: "sm" | "md" | "lg" | "icon" }) {
  if (size === "icon") {
    return (
      <span
        aria-hidden="true"
        className="inline-flex items-center justify-center rounded-full bg-gradient-to-br from-amber-500 via-yellow-400 to-blue-500"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M7 6h3l3 4 3-4h3v9h-3v-5l-3 4-3-4h-3v-4h3m3 4h3v4h-3v-4m-6 0h3v4h-3v-4m0 4h4v4h-4v-4"
            fill="currentColor"
            className="text-white"
          />
        </svg>
      </span>
    );
  }

  const scale = size === "sm" ? 0.85 : size === "lg" ? 1.15 : 1;
  const textScale = size === "sm" ? "text-lg" : size === "lg" ? "text-2xl" : "text-xl";
  const iconSize = size === "sm" ? 22 : size === "lg" ? 34 : 28;

  return (
    <Link
      to="/"
      className="inline-flex items-center gap-2 font-display font-semibold tracking-tight text-foreground no-underline transition-colors hover:text-foreground"
      aria-label="FoodyPop home"
    >
      {/* Standalone icon mark */}
      <span
        aria-hidden="true"
        className="flex items-center justify-center rounded-full bg-gradient-to-br from-amber-500 via-yellow-400 to-blue-500 flex-shrink-0"
        style={{ width: iconSize, height: iconSize }}
      >
        <svg
          width={size === "sm" ? 14 : size === "lg" ? 22 : 18}
          height={size === "sm" ? 14 : size === "lg" ? 22 : 18}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M7 6h3l3 4 3-4h3v9h-3v-5l-3 4-3-4h-3v-4h3m3 4h3v4h-3v-4m-6 0h3v4h-3v-4m0 4h4v4h-4v-4"
            fill="currentColor"
            className="text-white"
          />
        </svg>
      </span>

      {/* Wordmark */}
      <span
        className={textScale}
        style={{ transform: `scale(${scale})`, transformOrigin: "top left" }}
      >
        <span className="text-[#F5A623]">F</span>
        <span className="text-[#F5A623]">O</span>
        <span className="text-[#F5A623]">O</span>
        <span className="text-[#F5A623]">D</span>
        <span className="text-[#C9B896]">Y</span>
        <span className="text-[#4F86C1]">P</span>
        <span className="text-[#4F86C1]">O</span>
        <span className="text-[#4F86C1]">P</span>
      </span>
    </Link>
  );
}
