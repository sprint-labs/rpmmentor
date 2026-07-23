import type { ImgHTMLAttributes } from "react";
import brandMark from "@/assets/brand-mark.png.asset.json";

/**
 * BrandMark — Mentor Hub brand icon (green G-hexagon + double chevron).
 *
 * Rendered as a CDN-hosted PNG so the artwork exactly matches the favicon and
 * iOS home-screen tile. The mark is single-colour on transparent, so it sits
 * cleanly on both dark and light surfaces without theme-specific swaps.
 */
export function BrandMark({
  className,
  alt = "Mentor Hub",
  ...props
}: Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & { alt?: string }) {
  return (
    <img
      src={brandMark.url}
      alt={alt}
      className={className}
      draggable={false}
      {...props}
    />
  );
}
