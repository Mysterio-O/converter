"use client";

import { cn } from "@/lib/cn";
import { Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";

export interface DropZoneProps {
  accept: string;
  hint: string;
  onFile: (file: File) => void;
  disabled?: boolean;
}

export function DropZone({ accept, hint, onFile, disabled }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hover, setHover] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      onFile(files[0]);
    },
    [onFile]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Drop a file here, or click to browse"
      aria-disabled={disabled}
      className={cn(
        "cursor-pointer rounded-[10px] border-[1.5px] border-dashed px-5 py-8 text-center transition-colors",
        hover
          ? "border-amber bg-panel-2"
          : "border-line bg-panel hover:border-amber/60",
        disabled && "pointer-events-none opacity-50"
      )}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        setHover(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setHover(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setHover(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setHover(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <div className="flex justify-center">
        <Upload className="h-7 w-7 text-text-dim" aria-hidden="true" />
      </div>
      <strong className="mt-2 block text-[14.5px]">
        Drop a file here, or click to browse
      </strong>
      <span className="mt-1 block font-mono text-[12.5px] text-text-dim">
        {hint}
      </span>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
