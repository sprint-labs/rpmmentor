# Offline caching for core dashboard routes

Add a controlled service worker so Mentor Hub keeps working through short network drops (subway, spotty Wi-Fi, weak mobile signal). The last-seen dashboard, goalkeeper list, calendar and reports index remain viewable; writes queue naturally through TanStack Query retries when the connection returns.

## What the user gets

- Open the app after losing signal and still see the last dashboard, calendar, goalkeeper roster and reports list.
- A subtle "Offline — showing last synced data" banner appears when the browser reports no network, and disappears on reconnect.
- Installed home-screen app updates automatically in the background; a small toast offers "Reload for latest" when a new version is ready.
- No change in the Lovable editor preview — the worker only runs on the published site (`rpmmentor.com` / `rpmmentor.lovable.app`).

## Scope

In:
- `/` (dashboard), `/goalkeepers`, `/calendar`, `/reports`, `/alerts`, `/account` — HTML shell + JS/CSS/font/icon assets.
- Supabase GET responses for the dashboard/roster/calendar/reports queries (short SWR window, network-first).

Out (explicitly not cached):
- `/login`, `/reset-password`, `/[.]lovable.oauth.consent`, `/api/*`, `/[.mcp]/*`, `/[.well-known]/*` — always network.
- Any Supabase POST/PUT/PATCH/DELETE — offline writes are out of scope; the UI shows the offline banner and surfaces failures via existing toasts.
- Voice-note transcription and media uploads — network-only.

## Approach

Follow the Lovable PWA skill (offline path):

1. Add `vite-plugin-pwa` with `generateSW`, `registerType: "autoUpdate"`, `injectRegister: null`, `devOptions.enabled: false`, SW filename `/sw.js`.
2. Runtime caching rules in `vite.config.ts`:
   - Navigations → `NetworkFirst` (3s timeout, fallback to cached shell).
   - Same-origin hashed build assets (`/assets/*`) → `CacheFirst`, 30-day expiry.
   - Google Fonts CSS + files → `StaleWhileRevalidate` / `CacheFirst`.
   - Supabase REST GETs for the four dashboard endpoints → `NetworkFirst`, 5s timeout, 24h max age, cap ~50 entries.
   - Exclude `/~oauth`, `/api/`, `/[.mcp]`, `/[.well-known]`, `/login`, auth token endpoints from navigation fallback and caching.
3. Registration wrapper `src/lib/pwa/register-sw.ts` — refuses to register when any of these hold, and unregisters any matching `/sw.js` first:
   - `!import.meta.env.PROD`
   - inside an iframe
   - hostname starts with `id-preview--` or `preview--`
   - hostname is/ends with `lovableproject.com`, `lovableproject-dev.com`, `beta.lovable.dev`
   - URL contains `?sw=off` (kill switch)
4. Call the wrapper once from `RootComponent` in `src/routes/__root.tsx` inside a `useEffect`.
5. Add `src/components/offline-banner.tsx` — listens to `online`/`offline` events, renders a slim bar under the header when offline. Mount inside `AppShell`.
6. Add "Update available" toast via a small `onNeedRefresh` hook using `virtual:pwa-register` inside the same guarded wrapper.

## Files

New:
- `src/lib/pwa/register-sw.ts` — guarded registration + update prompt.
- `src/components/offline-banner.tsx` — online/offline indicator.

Modified:
- `vite.config.ts` — add `VitePWA` plugin with the config above.
- `src/routes/__root.tsx` — call `registerSw()` in a `useEffect`.
- `src/components/app-shell.tsx` — render `<OfflineBanner />`.
- `package.json` — add `vite-plugin-pwa` and `workbox-window` via `bun add`.

Not touched:
- Existing manifest, icons, splash screens (already correct).
- Any Supabase edge/RLS logic.
- `firebase-messaging-sw.js` — none present; nothing to preserve.

## Verification

- `bun run build` succeeds; `sw.js` emitted with the expected precache manifest.
- Local production build: DevTools → Application → Service Workers shows `/sw.js` activated only on the published-style origin; nothing registers under `id-preview--*`.
- Offline throttling in DevTools → dashboard, goalkeepers, calendar, reports remain viewable; login route falls back to network error (expected).
- `?sw=off` unregisters the worker cleanly.

## Risks / caveats

- Cached Supabase reads can be up to 24h stale on a fresh reconnect until the network-first refetch lands — acceptable for read-only glance use.
- Offline write queueing is deliberately out of scope; adding it later would use Workbox Background Sync on specific server-function endpoints.
- iOS PWA users won't see updates until the tab is closed and reopened after the new worker activates (standard PWA behavior).