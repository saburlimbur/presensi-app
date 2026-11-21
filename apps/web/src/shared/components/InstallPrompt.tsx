import { useEffect, useState } from "react";
import { Share, Plus, X } from "lucide-react";
import { Button } from "@ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) &&
  !/crios|fxios|edgios/i.test(navigator.userAgent);

export const InstallPrompt = () => {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [showIOS] = useState(() => isIOS() && !isStandalone());
  const [visible, setVisible] = useState(() => isIOS() && !isStandalone());

  useEffect(() => {
    if (isStandalone()) return;

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
  };

  const handleDismiss = () => {
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-50 px-3 pt-[max(env(safe-area-inset-top),0.75rem)] pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-md rounded-2xl border border-border bg-popover/95 backdrop-blur-md p-3 shadow-lg shadow-black/5 animate-in slide-in-from-top-4 fade-in duration-300">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 size-10 rounded-xl bg-brand flex items-center justify-center overflow-hidden">
            <img
              src="/pwa-192.png"
              alt=""
              className="size-7 object-contain"
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              Attendance System
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {showIOS ? "Tambahkan ke Home Screen" : "Pasang sebagai aplikasi"}
            </p>
          </div>

          {!showIOS && (
            <Button
              size="sm"
              onClick={handleInstall}
              className="rounded-full bg-brand text-white hover:bg-brand-bright px-4 h-8 font-semibold"
            >
              Install
            </Button>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Tutup"
            className="flex-shrink-0 size-7 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {showIOS && (
          <p className="mt-2.5 px-1 text-xs text-muted-foreground leading-relaxed">
            Tap <Share className="inline size-3 align-[-2px]" /> Share lalu
            pilih <span className="font-medium">Add to Home Screen</span>{" "}
            <Plus className="inline size-3 align-[-2px]" />.
          </p>
        )}
      </div>
    </div>
  );
};
