import { useEffect, useState } from "react";
import { Download, Share, Plus, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "rpm.pwaInstallDismissedAt";
const DISMISS_DAYS = 14;

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  // iOS Safari
  return (window.navigator as unknown as { standalone?: boolean }).standalone === true;
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
  // iPadOS 13+ reports as Mac; detect touch
  const iPadOS = navigator.platform === "MacIntel" && (navigator.maxTouchPoints ?? 0) > 1;
  return iOS || iPadOS;
}

function isSafari(): boolean {
  const ua = navigator.userAgent;
  return /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

function recentlyDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const then = Number(raw);
    if (!Number.isFinite(then)) return false;
    return Date.now() - then < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;
    if (recentlyDismissed()) { setDismissed(true); return; }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);

    const onInstalled = () => {
      setDeferred(null);
      setShowIos(false);
    };
    window.addEventListener("appinstalled", onInstalled);

    // iOS Safari never fires beforeinstallprompt — show manual card after a short delay
    let t: ReturnType<typeof setTimeout> | undefined;
    if (isIos() && isSafari()) {
      t = setTimeout(() => setShowIos(true), 4000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
      if (t) clearTimeout(t);
    };
  }, []);

  function dismiss() {
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* ignore */ }
    setDismissed(true);
    setDeferred(null);
    setShowIos(false);
  }

  async function install() {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") {
        setDeferred(null);
      } else {
        dismiss();
      }
    } catch {
      dismiss();
    }
  }

  if (dismissed) return null;

  // Android / Chromium — native prompt
  if (deferred) {
    return (
      <Card onClose={dismiss}>
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Download className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground">Install Mentor Hub</p>
            <p className="text-[11px] text-muted-foreground">Add to your home screen for a fullscreen app experience.</p>
          </div>
          <button
            type="button"
            onClick={install}
            className="h-8 shrink-0 rounded-md bg-primary px-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-primary-foreground hover:opacity-90"
          >
            Install
          </button>
        </div>
      </Card>
    );
  }

  // iOS Safari — manual instructions
  if (showIos) {
    return (
      <Card onClose={dismiss}>
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Download className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground">Add Mentor Hub to Home Screen</p>
            <p className="mt-1 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
              Tap
              <Share className="inline size-3.5" aria-label="Share" />
              then
              <span className="inline-flex items-center gap-1 rounded border border-border px-1.5 py-0.5 text-foreground">
                <Plus className="size-3" /> Add to Home Screen
              </span>
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return null;
}

function Card({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-md rounded-lg border border-border bg-card/95 p-3 shadow-2xl backdrop-blur md:left-auto md:right-4 md:mx-0">
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss install prompt"
        className="absolute right-1.5 top-1.5 inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>
      {children}
    </div>
  );
}
