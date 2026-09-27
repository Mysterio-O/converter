"use client";

import { cn } from "@/lib/cn";
import { useId, useState } from "react";
import type { InputHTMLAttributes } from "react";

export interface RangeSliderProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "value" | "onChange"> {
  label: string;
  min: number;
  max: number;
  defaultValue: number;
  note?: string;
  onValueChange?: (value: number) => void;
}

export function RangeSlider({
  label,
  min,
  max,
  defaultValue,
  note,
  onValueChange,
  className,
  id,
  ...props
}: RangeSliderProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const [value, setValue] = useState(defaultValue);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className="font-mono text-xs text-text-dim">
        {label}
      </label>
      <input
        id={inputId}
        type="range"
        min={min}
        max={max}
        value={value}
        className="w-full accent-amber"
        onChange={(e) => {
          const next = Number(e.target.value);
          setValue(next);
          onValueChange?.(next);
        }}
        {...props}
      />
      <div className="flex items-center justify-between font-mono text-[11px] text-text-dim">
        <span>{value}</span>
        {note ? <span>{note}</span> : null}
      </div>
    </div>
  );
}
