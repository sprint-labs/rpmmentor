import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (typeof navigator === "undefined") return;
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-30 flex items-center justify-center gap-2 border-b border-amber-500/40 bg-amber-500/10 px-4 py-1.5 text-[11px] uppercase tracking-[0.08em] font-semibold text-amber-200"
    >
      <WifiOff className="size-3.5" />
      Offline — showing last synced data
    </div>
  );
}
