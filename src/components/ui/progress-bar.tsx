import { cn } from "@/lib/cn";

export interface ProgressBarProps {
  percent: number;
  label?: string;
  className?: string;
}

export function ProgressBar({ percent, label, className }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, percent));
  return (
    <div className={cn("flex-1 min-w-[180px]", className)}>
      <div className="h-2 overflow-hidden rounded-full border border-line bg-panel-2">
        <div
          data-testid="progress-bar-fill"
          className="h-full rounded-full bg-gradient-to-r from-teal to-amber transition-[width] duration-150"
          style={{ width: `${pct}%` }}
        />
      </div>
      {label ? (
        <div className="mt-1.5 font-mono text-[11.5px] text-text-dim">{label}</div>
      ) : null}
    </div>
  );
}
