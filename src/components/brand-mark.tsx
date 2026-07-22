import type { SVGProps } from "react";

/**
 * BrandMark — theme-aware inline SVG icon for the Mentor Hub header.
 *
 * Renders as pure vector paths (no embedded raster) so it stays crisp at every
 * size (16px favicon → 40px header → retina). The green glyph is pinned to the
 * semantic `--color-gk-green` token, and a `currentColor` outline is drawn
 * behind the glyph so the mark pops against both dark and light header surfaces
 * without washing out.
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
      {/* Background chip — lifts the mark off its surface and adapts to theme */}
      <rect
        x="1"
        y="1"
        width="38"
        height="38"
        rx="9"
        fill="var(--color-card, #0A0A0A)"
        stroke="currentColor"
        strokeOpacity="0.15"
        strokeWidth="1"
      />
      {/* Contrast outline layer: light in dark mode, dark in light mode */}
      <g
        stroke="currentColor"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.65"
      >
        <path d="M20 8 L31 14 L20 20 L9 14 Z" />
        <path d="M9 20 L20 26 L31 20" />
        <path d="M9 26 L20 32 L31 26" />
      </g>
      {/* Green glyph layer */}
      <path
        d="M20 8 L31 14 L20 20 L9 14 Z"
        fill="var(--color-gk-green, #00E676)"
      />
      <path
        d="M9 20 L20 26 L31 20"
        fill="none"
        stroke="var(--color-gk-green, #00E676)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.75"
      />
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
