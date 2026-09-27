"use client";

import { RangeSlider } from "@/components/ui/range-slider";
import { Select } from "@/components/ui/select";
import { TextInput } from "@/components/ui/text-input";
import type { OptionValues, TaskOption } from "@/types/task";

export interface OptionsFormProps {
  options: TaskOption[];
  values: OptionValues;
  onChange: (key: string, value: string | number) => void;
}

export function OptionsForm({ options, values, onChange }: OptionsFormProps) {
  return (
    <div className="mt-5 grid grid-cols-1 gap-x-5.5 gap-y-4.5 rounded-[10px] border border-line bg-panel p-5 sm:grid-cols-2 lg:grid-cols-3">
      {options.map((opt) => {
        const value = values[opt.key];

        if (opt.type === "select") {
          return (
            <Select
              key={opt.key}
              label={opt.label}
              options={opt.options}
              note={opt.note}
              value={String(value ?? opt.default)}
              onChange={(e) => onChange(opt.key, e.target.value)}
            />
          );
        }

        if (opt.type === "range") {
          return (
            <RangeSlider
              key={opt.key}
              label={opt.label}
              min={opt.min}
              max={opt.max}
              note={opt.note}
              defaultValue={Number(value ?? opt.default)}
              onValueChange={(v) => onChange(opt.key, v)}
            />
          );
        }

        return (
          <TextInput
            key={opt.key}
            label={opt.label}
            placeholder={opt.placeholder}
            note={opt.note}
            value={String(value ?? opt.default ?? "")}
            onChange={(e) => onChange(opt.key, e.target.value)}
          />
        );
      })}
    </div>
  );
}
