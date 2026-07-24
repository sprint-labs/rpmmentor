import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Download, Share, Plus, X, AlertTriangle, RefreshCw } from "lucide-react";
import { logInstallEvent } from "@/lib/install-analytics.functions";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const STATE_KEY = "rpm.pwaInstallState.v1";

type Outcome = "dismissed" | "failed" | "manual-close";

type InstallState = {
  snoozedUntil: number; // epoch ms
  declines: number; // count of user "not now" / dismissed outcomes
  failures: number; // count of prompt() errors
  lastOutcome?: Outcome;
};

// Graduated backoff so we re-prompt sooner after early declines and back off
// after repeated ones. Failures always come back fast — they usually mean the
// browser wasn't ready, not that the user said no.
function backoffMs(state: InstallState, reason: Outcome): number {
  if (reason === "failed") {
    // 5m, 30m, 2h, then 1d
    const steps = [5 * 60_000, 30 * 60_000, 2 * 60 * 60_000, 24 * 60 * 60_000];
    return steps[Math.min(state.failures, steps.length - 1)];
  }
  // dismissed / manual-close: 1d, 3d, 7d, 14d
  const days = [1, 3, 7, 14];
  return days[Math.min(state.declines, days.length - 1)] * 24 * 60 * 60_000;
}

function readState(): InstallState {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return { snoozedUntil: 0, declines: 0, failures: 0 };
    const parsed = JSON.parse(raw) as Partial<InstallState>;
    return {
      snoozedUntil: Number(parsed.snoozedUntil) || 0,
      declines: Number(parsed.declines) || 0,
      failures: Number(parsed.failures) || 0,
      lastOutcome: parsed.lastOutcome,
    };
  } catch {
    return { snoozedUntil: 0, declines: 0, failures: 0 };
  }
}

function writeState(next: InstallState) {
  try { localStorage.setItem(STATE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
}

// Display-mode media queries that indicate the app is running as an installed
// PWA rather than a normal browser tab. Covers Chrome/Edge desktop windowing
// modes too (`window-controls-overlay`, `minimal-ui`) and Samsung Internet's
// Fullscreen shortcut launches.
const STANDALONE_QUERIES = [
  "(display-mode: standalone)",
  "(display-mode: fullscreen)",
  "(display-mode: minimal-ui)",
  "(display-mode: window-controls-overlay)",
];

function matchesStandaloneMedia(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return STANDALONE_QUERIES.some((q) => {
    try { return window.matchMedia(q).matches; } catch { return false; }
  });
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  // iOS Safari legacy flag — set true only when launched from Home Screen.
  if ((window.navigator as unknown as { standalone?: boolean }).standalone === true) return true;
  if (matchesStandaloneMedia()) return true;
  // Android TWA / WebAPK launches document with this referrer.
  if (typeof document !== "undefined" && document.referrer.startsWith("android-app://")) return true;
  return false;
}

// Async signal: on Android Chrome/Edge, a related PWA already installed for
// this origin can be discovered without waiting for beforeinstallprompt.
async function hasRelatedInstalledApp(): Promise<boolean> {
  const nav = navigator as unknown as {
    getInstalledRelatedApps?: () => Promise<Array<{ platform?: string; id?: string; url?: string }>>;
  };
  if (typeof nav.getInstalledRelatedApps !== "function") return false;
  try {
    const apps = await nav.getInstalledRelatedApps();
    return Array.isArray(apps) && apps.some((a) => a.platform === "webapp" || a.platform === "play");
  } catch {
    return false;
  }
}

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
  const iPadOS = navigator.platform === "MacIntel" && (navigator.maxTouchPoints ?? 0) > 1;
  return iOS || iPadOS;
}

function isSafari(): boolean {
  const ua = navigator.userAgent;
  // Exclude every in-app browser variant that reports as Safari but can't
  // Add to Home Screen (Chrome iOS, Firefox iOS, Edge iOS, Opera iOS, plus
  // the common social webviews which we don't want prompting either).
  return (
    /Safari/.test(ua) &&
    !/CriOS|FxiOS|EdgiOS|OPiOS|GSA\/|YaBrowser|DuckDuckGo|FBAN|FBAV|Instagram|Line\/|Twitter|LinkedInApp|Snapchat/.test(ua)
  );
}


export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [snoozed, setSnoozed] = useState(false);
  const [failure, setFailure] = useState<null | { reason: string }>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Never prompt inside an iframe (Lovable preview, embeds, OAuth popups).
    if (window.top !== window.self) return;
    if (isStandalone()) return;

    let cancelled = false;

    const state = readState();
    if (state.snoozedUntil && Date.now() < state.snoozedUntil) {
      setSnoozed(true);
      const t = window.setTimeout(() => setSnoozed(false), Math.min(state.snoozedUntil - Date.now(), 2_147_483_000));
      return () => window.clearTimeout(t);
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setFailure(null);
    };
    window.addEventListener("beforeinstallprompt", onBip);

    const onInstalled = () => {
      setDeferred(null);
      setShowIos(false);
      setFailure(null);
      writeState({ snoozedUntil: 0, declines: 0, failures: 0, lastOutcome: undefined });
    };
    window.addEventListener("appinstalled", onInstalled);

    // Live-track display-mode: user may launch the installed app while this
    // tab is open, or resize into a WCO window. Hide immediately when that
    // happens so we never double-prompt.
    const mqls = STANDALONE_QUERIES.map((q) => {
      try { return window.matchMedia(q); } catch { return null; }
    }).filter((m): m is MediaQueryList => m !== null);
    const onModeChange = () => {
      if (matchesStandaloneMedia()) {
        setDeferred(null);
        setShowIos(false);
        setFailure(null);
      }
    };
    mqls.forEach((m) => m.addEventListener?.("change", onModeChange));

    // Chromium: if the site is already installed as a related app, don't prompt.
    void hasRelatedInstalledApp().then((installed) => {
      if (installed && !cancelled) {
        setDeferred(null);
        setShowIos(false);
      }
    });

    let t: ReturnType<typeof setTimeout> | undefined;
    // iOS Safari never fires beforeinstallprompt. Only show the manual card
    // in real Safari (not Chrome iOS / in-app webviews) and never when the
    // page is already home-screen-launched.
    if (isIos() && isSafari()) {
      t = setTimeout(() => { if (!isStandalone()) setShowIos(true); }, 4000);
    }

    return () => {
      cancelled = true;
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
      mqls.forEach((m) => m.removeEventListener?.("change", onModeChange));
      if (t) clearTimeout(t);
    };
  }, []);


  function snooze(reason: Outcome) {
    const prev = readState();
    const next: InstallState = {
      ...prev,
      declines: reason === "failed" ? prev.declines : prev.declines + 1,
      failures: reason === "failed" ? prev.failures + 1 : prev.failures,
      lastOutcome: reason,
      snoozedUntil: 0,
    };
    next.snoozedUntil = Date.now() + backoffMs(next, reason);
    writeState(next);
    setSnoozed(true);
    setDeferred(null);
    setShowIos(false);
    setFailure(null);
  }

  async function install() {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") {
        setDeferred(null);
        // appinstalled handler will clear state.
      } else {
        // User picked "not now" — re-prompt sooner than a hard dismiss.
        snooze("dismissed");
      }
    } catch (err) {
      // Prompt threw (already used, user-gesture missing, browser refused).
      // Show a fallback card with retry + manual guide.
      setDeferred(null);
      setFailure({ reason: err instanceof Error ? err.message : "The browser refused the install prompt." });
    }
  }

  function retryFromFailure() {
    setFailure(null);
    // The captured event is single-use; nudge the browser to fire a fresh one.
    // Most browsers refire on the next user gesture / navigation.
    window.dispatchEvent(new Event("pointerdown"));
  }

  if (snoozed) return null;

  // Fallback: prompt() failed — offer retry + link to the manual guide.
  if (failure) {
    return (
      <Card onClose={() => snooze("failed")}>
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-amber-500/15 text-amber-300">
            <AlertTriangle className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground">Install didn’t start</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Your browser blocked the install prompt. Try again, or follow the manual steps.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={retryFromFailure}
                className="inline-flex items-center gap-1 h-7 rounded-md border border-border px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-foreground hover:bg-accent"
              >
                <RefreshCw className="size-3" /> Try again
              </button>
              <Link
                to="/install"
                className="inline-flex items-center h-7 rounded-md bg-primary px-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-primary-foreground hover:opacity-90"
              >
                Manual steps
              </Link>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (deferred) {
    return (
      <Card onClose={() => snooze("manual-close")}>
        <div className="flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Download className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-foreground">Install Mentor Hub</p>
            <p className="text-[11px] text-muted-foreground">
              Add to your home screen for a fullscreen app experience.{" "}
              <Link to="/install" className="text-primary hover:underline">Learn how</Link>
            </p>
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

  if (showIos) {
    return (
      <Card onClose={() => snooze("manual-close")}>
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
            <Link to="/install" className="mt-1 inline-block text-[11px] text-primary hover:underline">
              Step-by-step guide
            </Link>
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
