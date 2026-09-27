"use client";

import { PrivacyNote } from "@/components/privacy-note";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";
import { cn } from "@/lib/cn";
import { Clapperboard } from "lucide-react";

export interface EngineGateProps {
  loaded: boolean;
  loading: boolean;
  loadProgress: number;
  loadLabel: string;
  error: string | null;
  onLoad: () => void;
}

export function EngineGate({
  loaded,
  loading,
  loadProgress,
  loadLabel,
  error,
  onLoad,
}: EngineGateProps) {
  if (loaded) return null;

  return (
    <div
      className={cn(
        "mx-auto max-w-[480px] rounded-[10px] border border-line bg-panel px-7 py-8 text-center",
        "my-10 sm:my-[60px]"
      )}
    >
      <div className="flex justify-center">
        <Clapperboard className="h-9 w-9 text-amber" aria-hidden="true" />
      </div>
      <h2 className="mt-3 mb-2 text-[19px] font-bold">
        Load the ffmpeg engine
      </h2>
      <p className="mb-5 text-[13.5px] leading-relaxed text-text-dim">
        One-time download (~30&nbsp;MB) of the ffmpeg core, cached in your browser
        afterwards. Nothing you process is ever sent anywhere — files stay on
        this device the whole time.
      </p>

      <PrivacyNote className="mb-5 text-left" />

      <Button size="lg" onClick={onLoad} disabled={loading}>
        {loading ? "Loading…" : "Load engine"}
      </Button>

      {loading ? (
        <div className="mt-4">
          <ProgressBar percent={loadProgress} label={loadLabel} />
        </div>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-[13px] text-danger"
        >
          {error}
        </p>
      ) : null}

      <p className="mt-5 font-mono text-[11px] text-text-dim">
        100% local · no uploads · works offline after first load
      </p>
    </div>
  );
}
