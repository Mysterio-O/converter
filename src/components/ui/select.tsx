import { cn } from "@/lib/cn";
import type { ReactNode, SelectHTMLAttributes } from "react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  note?: string;
  options: string[];
  children?: ReactNode;
}

export function Select({
  label,
  note,
  options,
  className,
  id,
  ...props
}: SelectProps) {
  const selectId = id ?? `sel-${label.replace(/\s+/g, "-").toLowerCase()}`;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label
        htmlFor={selectId}
        className="font-mono text-xs text-text-dim"
      >
        {label}
      </label>
      <select
        id={selectId}
        className="w-full rounded-[7px] border border-line bg-panel-2 px-2.5 py-2 text-sm text-text outline-none focus:border-amber focus:ring-1 focus:ring-amber/40"
        {...props}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {note ? (
        <span className="font-mono text-[11px] text-text-dim">{note}</span>
      ) : null}
    </div>
  );
}
