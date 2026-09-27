import type { OptionValues } from "@/types/task";

export type PosterStyle = "gradient" | "bar" | "minimal" | "dark";
export type PosterTextColor = "white" | "black" | "amber" | "teal";
export type PosterAccentColor = "amber" | "teal" | "red" | "none";
export type PosterFormat = "jpg" | "png" | "webp";

export interface PosterConfig {
  timestamp: string;
  title: string;
  subtitle: string;
  style: PosterStyle;
  textColor: PosterTextColor;
  accentColor: PosterAccentColor;
  format: PosterFormat;
  /** 1-100, used for jpg/webp */
  quality: number;
  /** Target width in px, or 0 for original */
  width: number;
}

const TEXT_COLORS: Record<PosterTextColor, string> = {
  white: "#F7F5EF",
  black: "#12141A",
  amber: "#F5A623",
  teal: "#4FD1C5",
};

const ACCENT_COLORS: Record<Exclude<PosterAccentColor, "none">, string> = {
  amber: "#F5A623",
  teal: "#4FD1C5",
  red: "#E5674A",
};

export function posterConfigFromOptions(opts: OptionValues): PosterConfig {
  const widthRaw = String(opts.width ?? "1280");
  return {
    timestamp: String(opts.start ?? "00:00:05"),
    title: String(opts.title ?? "").trim(),
    subtitle: String(opts.subtitle ?? "").trim(),
    style: (String(opts.style ?? "gradient") as PosterStyle) || "gradient",
    textColor: (String(opts.textColor ?? "white") as PosterTextColor) || "white",
    accentColor:
      (String(opts.accentColor ?? "amber") as PosterAccentColor) || "amber",
    format: (String(opts.format ?? "jpg") as PosterFormat) || "jpg",
    quality: clamp(Number(opts.quality ?? 88), 1, 100),
    width: widthRaw === "original" ? 0 : clamp(Number(widthRaw) || 1280, 320, 4096),
  };
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export function posterMime(format: PosterFormat): string {
  switch (format) {
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    default:
      return "image/jpeg";
  }
}

export interface ComposeOptions {
  /** HTMLImageElement / ImageBitmap of the extracted frame */
  image: CanvasImageSource;
  config: PosterConfig;
  /** Optional font family; falls back to system sans */
  fontFamily?: string;
}

/**
 * Draw a poster: video frame + title/subtitle overlay on a canvas.
 * Returns the canvas so the caller can export a Blob.
 */
export function composePoster({ image, config, fontFamily }: ComposeOptions): HTMLCanvasElement {
  const srcW =
    (image as HTMLImageElement).naturalWidth ||
    (image as HTMLImageElement).width ||
    1280;
  const srcH =
    (image as HTMLImageElement).naturalHeight ||
    (image as HTMLImageElement).height ||
    720;

  const outW = config.width > 0 ? config.width : srcW;
  const outH = Math.round((srcH / srcW) * outW);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context is not available in this browser.");
  }

  // base frame (cover-fit if aspect drifted slightly)
  ctx.drawImage(image, 0, 0, outW, outH);

  const family = fontFamily ?? "system-ui, sans-serif";
  const textColor = TEXT_COLORS[config.textColor] ?? TEXT_COLORS.white;
  const accent =
    config.accentColor === "none"
      ? null
      : (ACCENT_COLORS[config.accentColor] ?? ACCENT_COLORS.amber);

  // overlay shading
  if (config.style === "gradient") {
    const grad = ctx.createLinearGradient(0, outH * 0.35, 0, outH);
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,0.78)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, outW, outH);
  } else if (config.style === "bar") {
    const barH = Math.max(140, Math.round(outH * 0.32));
    ctx.fillStyle = "rgba(12, 14, 18, 0.82)";
    ctx.fillRect(0, outH - barH, outW, barH);
    if (accent) {
      ctx.fillStyle = accent;
      ctx.fillRect(0, outH - barH - 6, outW, 6);
    }
  } else if (config.style === "dark") {
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(0, 0, outW, outH);
  }
  // "minimal" = no shading

  // text layout
  const padX = Math.round(outW * 0.06);
  const padBottom = Math.round(outH * 0.08);
  const hasSubtitle = config.subtitle.length > 0;
  const titleSize = Math.round(Math.min(outW * 0.075, outH * 0.12));
  const subSize = Math.round(titleSize * 0.42);

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = config.style === "minimal" ? "transparent" : "rgba(0,0,0,0.55)";
  ctx.shadowBlur = config.style === "minimal" ? 0 : 8;
  ctx.shadowOffsetY = 2;

  let cursorY = outH - padBottom;

  if (hasSubtitle) {
    ctx.font = `500 ${subSize}px ${family}`;
    ctx.fillStyle = textColor;
    ctx.globalAlpha = 0.92;
    wrapText(ctx, config.subtitle, padX, cursorY, outW - padX * 2, subSize * 1.25);
    ctx.globalAlpha = 1;
    cursorY -= subSize * 1.8;
  }

  if (config.title) {
    ctx.font = `700 ${titleSize}px ${family}`;
    ctx.fillStyle = textColor;
    const lineCount = wrapText(
      ctx,
      config.title,
      padX,
      cursorY,
      outW - padX * 2,
      titleSize * 1.12
    );
    cursorY -= titleSize * 1.25 * lineCount;
  }

  // accent underline
  if (accent && (config.title || hasSubtitle)) {
    const underlineW = Math.round(outW * 0.12);
    const underlineY = Math.max(12, cursorY + titleSize * 0.15);
    ctx.shadowColor = "transparent";
    ctx.fillStyle = accent;
    ctx.fillRect(padX, underlineY, underlineW, Math.max(4, Math.round(titleSize * 0.1)));
  }

  ctx.shadowColor = "transparent";
  return canvas;
}

/** Draw wrapped text bottom-anchored at (x, yBottom). Returns number of lines drawn. */
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  yBottom: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  const startY = yBottom - (lines.length - 1) * lineHeight;
  lines.forEach((line, i) => {
    ctx.fillText(line, x, startY + i * lineHeight);
  });
  return lines.length;
}

export async function exportPosterBlob(
  canvas: HTMLCanvasElement,
  format: PosterFormat,
  quality: number
): Promise<Blob> {
  const mime = posterMime(format);
  const q = format === "png" ? undefined : quality / 100;
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Couldn't encode the poster image. Try a different format."));
          return;
        }
        resolve(blob);
      },
      mime,
      q
    );
  });
}
