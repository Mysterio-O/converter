import { cn } from "@/lib/cn";

export interface PrivacyNoteProps {
  className?: string;
  compact?: boolean;
}

export function PrivacyNote({ className, compact }: PrivacyNoteProps) {
  return (
    <div
      className={cn(
        "rounded-[10px] border border-teal/30 bg-teal/10 px-3.5 py-2.5",
        className
      )}
    >
      <p
        className={cn(
          "text-teal",
          compact ? "text-[12px] leading-snug" : "text-[13px] leading-relaxed"
        )}
      >
        <strong className="font-semibold">100% private.</strong>{" "}
        {compact
          ? "All processing happens on your device. Nothing is uploaded."
          : "Everything runs locally in your browser. Your files never leave this device and are never sent to any server."}
      </p>
    </div>
  );
}
