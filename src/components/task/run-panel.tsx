"use client";

import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";

export interface RunPanelProps {
  disabled: boolean;
  running: boolean;
  progress: number;
  progressLabel: string;
  onRun: () => void;
}

export function RunPanel({
  disabled,
  running,
  progress,
  progressLabel,
  onRun,
}: RunPanelProps) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-4">
      <Button size="lg" onClick={onRun} disabled={disabled || running}>
        {running ? "Processing…" : "Run"}
      </Button>
      {running ? (
        <ProgressBar percent={progress} label={progressLabel} />
      ) : null}
    </div>
  );
}
