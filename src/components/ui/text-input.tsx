import { cn } from "@/lib/cn";
import type { InputHTMLAttributes } from "react";

export interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  note?: string;
}

export function TextInput({ label, note, className, id, ...props }: TextInputProps) {
  const inputId = id ?? `txt-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className="font-mono text-xs text-text-dim">
        {label}
      </label>
      <input
        id={inputId}
        type="text"
        className="w-full rounded-[7px] border border-line bg-panel-2 px-2.5 py-2 text-sm text-text outline-none placeholder:text-text-dim/70 focus:border-amber focus:ring-1 focus:ring-amber/40"
        {...props}
      />
      {note ? (
        <span className="font-mono text-[11px] text-text-dim">{note}</span>
      ) : null}
    </div>
  );
}
