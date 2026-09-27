"use client";

import { cn } from "@/lib/cn";

export interface LogPanelProps {
  lines: string[];
  className?: string;
}

export function LogPanel({ lines, className }: LogPanelProps) {
  if (lines.length === 0) return null;

  return (
    <div
      className={cn(
        "log-scroll mt-5 max-h-[120px] overflow-y-auto whitespace-pre-wrap rounded-lg border border-line bg-[#0F1216] px-3.5 py-3 font-mono text-[11.5px] text-text-dim",
        className
      )}
      role="log"
      aria-label="ffmpeg log"
    >
      {lines.join("\n")}
    </div>
  );
}
