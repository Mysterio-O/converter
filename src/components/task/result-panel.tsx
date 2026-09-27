"use client";

import { formatBytes, sizeDeltaNote } from "@/lib/format";
import type { MediaTag } from "@/types/task";

export interface ResultPanelProps {
  mediaTag: MediaTag;
  url: string;
  fileName: string;
  newSize: number;
  oldSize: number;
}

export function ResultPanel({
  mediaTag,
  url,
  fileName,
  newSize,
  oldSize,
}: ResultPanelProps) {
  const note =
    oldSize > 0
      ? ` · ${sizeDeltaNote(newSize, oldSize)}`
      : "";

  return (
    <div className="mt-6">
      <div>
        {mediaTag === "img" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt="Conversion result"
            className="max-w-full rounded-lg border border-line bg-black"
          />
        ) : mediaTag === "video" ? (
          <video
            src={url}
            controls
            className="max-w-full rounded-lg border border-line bg-black"
          />
        ) : (
          <audio src={url} controls className="w-full" />
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <a
          href={url}
          download={fileName}
          className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-teal px-[18px] py-2.5 text-[13.5px] font-bold text-[#062421] no-underline hover:brightness-105"
        >
          Download result
        </a>
        <span className="font-mono text-xs text-text-dim">
          {formatBytes(newSize)}
          {note}
        </span>
      </div>
    </div>
  );
}
