"use client";

import { usePwaInstall } from "@/lib/use-pwa-install";
import { useMounted } from "@/lib/use-mounted";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { Download, Share, X, AlertTriangle } from "lucide-react";

/**
 * Install banner (client-only after hydration to avoid SSR mismatch):
 * - Android/desktop: beforeinstallprompt → native install sheet
 * - iOS: "Add to Home Screen" steps (Safari has no install event)
 * - HTTP: explain that install needs HTTPS / localhost
 */
export function InstallPrompt({ className }: { className?: string }) {
  const mounted = useMounted();
  const { canInstall, isInstalled, platform, insecure, promptInstall, dismiss, dismissed } =
    usePwaInstall();

  // SSR + hydration render null so HTML matches; banner appears after mount.
  if (!mounted) return null;
  if (isInstalled || dismissed) return null;

  return (
    <>
      {insecure ? (
        <div
          role="note"
          className={cn(
            "flex items-start gap-3 rounded-[10px] border border-amber/40 bg-amber/10 px-3.5 py-3",
            className
          )}
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-amber" aria-hidden />
          <div className="flex-1 text-[12.5px] leading-relaxed text-text">
            <strong className="font-semibold">Install needs a secure connection.</strong>{" "}
            Open this app over <b>https://</b> or <b>localhost</b> to enable Add to
            Home Screen. On your phone, try the network URL with HTTPS or use
            <span className="mx-1 rounded bg-panel-2 px-1 font-mono text-[11px]">
              adb reverse
            </span>
            / a tunnel (e.g. ngrok).
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss install tip"
            className="cursor-pointer border-none bg-transparent text-text-dim hover:text-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : platform === "ios" && !canInstall ? (
        <div
          role="note"
          className={cn(
            "flex items-start gap-3 rounded-[10px] border border-teal/40 bg-teal/10 px-3.5 py-3",
            className
          )}
        >
          <Share className="mt-0.5 h-5 w-5 flex-none text-teal" aria-hidden />
          <div className="flex-1 text-[12.5px] leading-relaxed text-text">
            <strong className="font-semibold">Install MediaForge.</strong> Tap the
            <strong> Share</strong> button in Safari, then choose
            <strong> Add to Home Screen</strong> to get the full-screen app.
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss install tip"
            className="cursor-pointer border-none bg-transparent text-text-dim hover:text-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : canInstall ? (
        <div
          role="region"
          aria-label="Install app"
          className={cn(
            "flex flex-wrap items-center gap-3 rounded-[10px] border border-teal/40 bg-teal/10 px-3.5 py-3",
            className
          )}
        >
          <Download className="h-5 w-5 flex-none text-teal" aria-hidden />
          <div className="min-w-[160px] flex-1 text-[12.5px] leading-relaxed text-text">
            <strong className="font-semibold">Install MediaForge</strong> — keep it on
            your home screen and use it offline.
          </div>
          <Button size="sm" onClick={() => void promptInstall()}>
            Install
          </Button>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss install prompt"
            className="cursor-pointer border-none bg-transparent p-1 text-text-dim hover:text-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </>
  );
}
