import { cn } from "@/lib/cn";

export interface StatusBarProps {
  status: string;
  perfNote?: string;
  className?: string;
}

export function StatusBar({ status, perfNote, className }: StatusBarProps) {
  return (
    <footer
      className={cn(
        "safe-b flex flex-wrap gap-5 border-t border-line px-5 py-2 pb-[calc(8px+env(safe-area-inset-bottom,0px))] font-mono text-[11.5px] text-text-dim md:pb-2",
        // leave room for mobile bottom nav
        "mb-[76px] md:mb-0",
        className
      )}
    >
      <span>
        status: <b className="font-semibold text-text">{status}</b>
      </span>
      {perfNote ? <span>{perfNote}</span> : null}
    </footer>
  );
}
