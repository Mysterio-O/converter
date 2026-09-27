"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export type InstallPlatform = "android" | "ios" | "desktop" | "unsupported";

export interface PwaInstallState {
  canInstall: boolean;
  isInstalled: boolean;
  platform: InstallPlatform;
  insecure: boolean;
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
  dismiss: () => void;
  dismissed: boolean;
}

function detectPlatform(): InstallPlatform {
  if (typeof navigator === "undefined") return "unsupported";
  const ua = navigator.userAgent || "";
  if (/iPad|iPhone|iPod/.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  if (/Windows|Mac|Linux|X11/i.test(ua)) return "desktop";
  return "unsupported";
}

function computeIsInstalled(): boolean {
  if (typeof window === "undefined") return false;
  const standalone = window.matchMedia?.("(display-mode: standalone)")?.matches ?? false;
  const iosStandalone =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window.navigator as any).standalone === true;
  return standalone || iosStandalone;
}

/**
 * PWA install state.
 *
 * Avoids useSyncExternalStore: snapshot identity checks in React 19 + Next 16
 * caused infinite update loops even with cached values.
 *
 * Effects only *subscribe*; setState runs inside event callbacks (lint-safe).
 */
export function usePwaInstall(): PwaInstallState {
  const [canInstall, setCanInstall] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  // Lazy initializers are fine for browser facts; InstallPrompt suppresses hydration warning.
  const [isInstalled, setIsInstalled] = useState(() => computeIsInstalled());
  const [platform] = useState(() => detectPlatform());
  const [insecure] = useState(
    () => typeof window !== "undefined" && window.isSecureContext === false
  );
  const deferredRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      deferredRef.current = event as BeforeInstallPromptEvent;
      setCanInstall(true);
    };
    const onInstalled = () => {
      deferredRef.current = null;
      setCanInstall(false);
      setIsInstalled(true);
    };
    const onModeChange = () => setIsInstalled(computeIsInstalled());

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    const mq = window.matchMedia?.("(display-mode: standalone)");
    mq?.addEventListener?.("change", onModeChange);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      mq?.removeEventListener?.("change", onModeChange);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const deferred = deferredRef.current;
    if (!deferred) return "unavailable";
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      deferredRef.current = null;
      if (choice.outcome === "accepted") {
        setCanInstall(false);
        return "accepted";
      }
      return "dismissed";
    } catch {
      return "unavailable";
    }
  }, []);

  const dismiss = useCallback(() => setDismissed(true), []);

  return {
    canInstall: canInstall && !isInstalled,
    isInstalled,
    platform,
    insecure,
    promptInstall,
    dismiss,
    dismissed,
  };
}
