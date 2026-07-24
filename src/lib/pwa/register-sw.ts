// Guarded service-worker registration. Follows the Lovable PWA skill rules:
// - never registers in dev, iframe, Lovable preview, or when ?sw=off is set
// - unregisters any stale matching /sw.js registration in those refused contexts
// - only imports virtual:pwa-register on the client, after the guard passes

const SW_URL = "/sw.js";

function isRefusedContext(): boolean {
  if (typeof window === "undefined") return true;
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function unregisterMatching(): Promise<void> {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      regs
        .filter((r) => {
          const url = r.active?.scriptURL || r.installing?.scriptURL || r.waiting?.scriptURL || "";
          return url.endsWith(SW_URL);
        })
        .map((r) => r.unregister()),
    );
  } catch {
    /* ignore */
  }
}

export function registerSw(onNeedRefresh?: (reload: () => void) => void): void {
  if (isRefusedContext()) {
    void unregisterMatching();
    return;
  }
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  // Dynamic import so vite-plugin-pwa's virtual module is only pulled in on the client
  // and never during SSR/prerender.
  void import("virtual:pwa-register")
    .then(({ registerSW }) => {
      const updateSW = registerSW({
        immediate: true,
        onNeedRefresh() {
          onNeedRefresh?.(() => updateSW(true));
        },
      });
    })
    .catch(() => {
      /* plugin not available (e.g. dev) — ignore */
    });
}
