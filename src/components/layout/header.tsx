import { cn } from "@/lib/cn";
import { BrandMark } from "./brand-mark";
import { ThemeToggle } from "./theme-toggle";

export interface HeaderProps {
  engineLabel: string;
  engineState: "idle" | "loading" | "ready" | "busy" | "error";
}

const dotClass: Record<HeaderProps["engineState"], string> = {
  idle: "bg-text-dim",
  loading: "bg-amber dot-busy",
  ready: "bg-teal shadow-[0_0_0_3px_rgba(79,209,197,0.15)]",
  busy: "bg-amber dot-busy shadow-[0_0_0_3px_rgba(245,166,35,0.18)]",
  error: "bg-danger",
};

export function Header({ engineLabel, engineState }: HeaderProps) {
  return (
    <header className="safe-area-inset-header flex flex-wrap items-center justify-between gap-4 border-b border-line px-4 py-4 sm:px-6">
      <div className="flex items-center gap-3">
        <BrandMark className="h-[30px] w-[30px]" />
        <div>
          <h1 className="text-[19px] font-bold leading-tight tracking-[0.2px]">
            MediaForge
          </h1>
          <p className="font-mono text-[12.5px] text-text-dim">
            ffmpeg, running in your browser
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <div
          className={cn(
            "flex items-center gap-2 whitespace-nowrap rounded-full border border-line px-3 py-1.5 font-mono text-xs text-text-dim"
          )}
          aria-live="polite"
        >
          <span className={cn("h-[7px] w-[7px] flex-none rounded-full", dotClass[engineState])} />
          <span>{engineLabel}</span>
        </div>
      </div>
    </header>
  );
}
