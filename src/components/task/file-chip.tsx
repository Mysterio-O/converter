"use client";

import { FileText, X } from "lucide-react";
import { formatBytes } from "@/lib/format";

export interface FileChipProps {
  name: string;
  size: number;
  onClear: () => void;
}

export function FileChip({ name, size, onClear }: FileChipProps) {
  return (
    <div className="mt-3.5 flex items-center gap-2.5 rounded-lg border border-line bg-panel px-3.5 py-2.5 font-mono text-[12.5px] text-text-dim">
      <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
      <b className="text-[13.5px] font-semibold text-text">{name}</b>
      <span>· {formatBytes(size)}</span>
      <button
        type="button"
        onClick={onClear}
        className="ml-auto inline-flex cursor-pointer items-center gap-1 border-none bg-transparent text-[13px] text-text-dim hover:text-text"
        aria-label={`Remove ${name}`}
      >
        remove
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
