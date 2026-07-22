import type { SVGProps } from "react";

/**
 * BrandMark — dark-mode-optimized inline SVG icon for the Mentor Hub header.
 *
 * Renders as pure vector paths (no embedded raster) so it stays crisp at every
 * size (16px favicon → 40px header → retina). Uses `currentColor` for stroke
 * accents so it inherits the surrounding text color, and the green fill is
 * pinned to the semantic `--color-gk-green` token so the mark keeps brand
 * contrast on the carbon-dark surface without washing out.
 */
export function BrandMark({
  className,
  title = "Mentor Hub",
  ...props
}: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      role="img"
      aria-label={title}
      className={className}
      {...props}
    >
      <title>{title}</title>
      {/* Subtle outer ring — lifts the mark off dark backgrounds */}
      <rect
        x="1"
        y="1"
        width="38"
        height="38"
        rx="9"
        fill="hsl(var(--color-carbon-surface, 0 0% 8%))"
        stroke="currentColor"
        strokeOpacity="0.18"
        strokeWidth="1"
      />
      {/* Stacked-layers glyph — top layer */}
      <path
        d="M20 8 L31 14 L20 20 L9 14 Z"
        fill="var(--color-gk-green, #00E676)"
      />
      {/* Middle layer */}
      <path
        d="M9 20 L20 26 L31 20"
        fill="none"
        stroke="var(--color-gk-green, #00E676)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.75"
      />
      {/* Bottom layer */}
      <path
        d="M9 26 L20 32 L31 26"
        fill="none"
        stroke="var(--color-gk-green, #00E676)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.45"
      />
    </svg>
  );
}
