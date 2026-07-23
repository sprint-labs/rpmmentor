## Recommendation

**In-app brand mark (header, favicon, empty states):** Image 1 (transparent green G on white/no background).
- Reason: single-color vector-style mark, scales cleanly, and lets us tint via `currentColor`/`--color-gk-green` against any theme surface (dark or light). Image 3 is a fully-rendered glossy icon — baking gradients + bevels into a 20px header logo looks muddy and fights the Carbon UI.

**iOS Add-to-Home-Screen icon (`/apple-touch-icon.png`, 180/192/512 in manifest):** Image 3 (glossy dark-green tile).
- Reason: iOS renders home-screen icons at large sizes on a bright springboard where a full-bleed, contained artwork reads best. It already has its own rounded-square shape, depth, and glow — exactly what a home-screen tile is designed to show. iOS will apply its own mask, so the built-in rounding is fine.
- Image 2 (orange outline on black) is too "debug/reference" looking for a shipped home-screen icon; the orange border isn't part of the brand system elsewhere in the app. Skip.
- Image 1 would work as a fallback but looks flat and empty next to other polished app icons on a home screen.

## Changes

1. **Save assets**
   - `user-uploads://gkhq-icon-mark-transparent-2.png` → `src/assets/brand-mark.png` (import for in-app usage where an SVG isn't practical) and rasterize/trace into `public/favicon.svg` so the favicon uses the new G shape.
   - `user-uploads://5.png` → rasterize to `public/apple-touch-icon.png` (180×180), `public/icon-192.png` (192×192), `public/icon-512.png` (512×512), overwriting the current dark-glyph PNGs.

2. **`src/components/brand-mark.tsx`**
   - Replace the current diamond/chevron paths with the new hexagonal "G + double chevron" geometry so header/sidebar usage matches the favicon. Keep the `currentColor` outline + `--color-gk-green` fill pattern so it stays theme-aware.

3. **`public/favicon.svg`**
   - Redraw with the new G-hexagon paths, keeping the existing dark/light `@media (prefers-color-scheme)` styles so browser tabs stay legible in both modes.

4. **`public/manifest.webmanifest`**
   - No structural changes needed — filenames stay the same. Confirm `name`/`short_name` remain "Mentor Hub by RPM" / "Mentor Hub".

5. **`src/routes/__root.tsx`**
   - No head changes needed; existing `<link rel="apple-touch-icon" href="/apple-touch-icon.png">` and manifest link already point at the paths we're overwriting.

6. **Publish** so iOS Safari re-fetches `/apple-touch-icon.png` on the live domains.

## What stays

- Social share (`og:image`) untouched.
- Green brand token `--color-gk-green` unchanged.
- No copy or route changes.

## After deploy

On any device with the old icon installed, remove the Home Screen tile and re-add it — iOS caches the icon per-install and won't replace it in place.
