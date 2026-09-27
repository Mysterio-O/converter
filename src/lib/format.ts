export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function sizeDeltaNote(newSize: number, oldSize: number): string {
  const delta = Math.round((1 - newSize / oldSize) * 100);
  if (delta >= 0) return `${delta}% smaller than original`;
  return `${Math.abs(delta)}% larger than original`;
}

export function guessMime(ext: string): string {
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    bmp: "image/bmp",
    gif: "image/gif",
    mp4: "video/mp4",
    webm: "video/webm",
    mov: "video/quicktime",
    mp3: "audio/mpeg",
    aac: "audio/aac",
    wav: "audio/wav",
    flac: "audio/flac",
  };
  return map[ext.toLowerCase()] ?? "application/octet-stream";
}

export function fileExtension(name: string): string {
  const parts = name.split(".");
  const ext = parts.length > 1 ? parts.pop() : undefined;
  return (ext ?? "dat").toLowerCase();
}

/** Base name without extension (keeps dots in the name: "a.b.c.mp4" → "a.b.c"). */
export function fileBaseName(name: string): string {
  const idx = name.lastIndexOf(".");
  if (idx > 0) return name.slice(0, idx);
  if (idx === 0) return ""; // e.g. ".mp4" — extension only, no stem
  return name;
}

/**
 * Download name that preserves the user's original file name,
 * only replacing the extension when the output format changes.
 * e.g. ("holiday.mov", "mp4") → "holiday.mp4"
 */
export function outputFileName(originalName: string, outExt: string): string {
  let base = fileBaseName(originalName).trim();
  // e.g. ".mp4" or "   " — no usable stem
  if (!base || /^\.+$/.test(base)) base = "media";
  return `${base}.${outExt}`;
}
