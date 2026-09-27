import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { AppError } from "@/lib/errors";
import { guessMime } from "@/lib/format";

export type EngineState = "idle" | "loading" | "ready" | "busy" | "error";

export interface EngineCallbacks {
  onLog?: (message: string) => void;
  onProgress?: (percent: number) => void;
  onStateChange?: (state: EngineState, label: string) => void;
}

const BASE_URL = "https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd";

let instance: FFmpeg | null = null;
let loadingPromise: Promise<FFmpeg> | null = null;

export function getFfmpeg(): FFmpeg | null {
  return instance;
}

export function isEngineReady(): boolean {
  return instance !== null;
}

export async function loadEngine(callbacks: EngineCallbacks = {}): Promise<FFmpeg> {
  if (instance) return instance;
  if (loadingPromise) return loadingPromise;

  callbacks.onStateChange?.("loading", "loading engine…");

  loadingPromise = (async () => {
    try {
      const ffmpeg = new FFmpeg();

      if (callbacks.onLog) {
        ffmpeg.on("log", ({ message }) => callbacks.onLog?.(message));
      }
      if (callbacks.onProgress) {
        ffmpeg.on("progress", ({ progress }) => {
          const pct = Math.min(100, Math.max(0, Math.round(progress * 100)));
          callbacks.onProgress?.(pct);
        });
      }

      callbacks.onStateChange?.("loading", "fetching ffmpeg-core.js…");
      const coreURL = await toBlobURL(`${BASE_URL}/ffmpeg-core.js`, "text/javascript");
      callbacks.onStateChange?.("loading", "fetching ffmpeg-core.wasm…");
      const wasmURL = await toBlobURL(`${BASE_URL}/ffmpeg-core.wasm`, "application/wasm");
      callbacks.onStateChange?.("loading", "initializing…");
      await ffmpeg.load({ coreURL, wasmURL });

      instance = ffmpeg;
      callbacks.onStateChange?.("ready", "engine ready");
      return ffmpeg;
    } catch (err) {
      loadingPromise = null;
      callbacks.onStateChange?.("error", "load failed");
      throw new AppError(
        "Couldn't download the ffmpeg engine. Check your internet connection and try again.",
        { cause: err }
      );
    }
  })();

  return loadingPromise;
}

export interface RunOptions {
  file: File;
  args: string[];
  inExt: string;
  outExt: string;
  onLog?: (message: string) => void;
  onProgress?: (percent: number) => void;
}

export interface RunResult {
  data: Uint8Array;
  outName: string;
  blob: Blob;
  url: string;
  size: number;
}

export async function runFfmpeg(opts: RunOptions): Promise<RunResult> {
  const ffmpeg = instance;
  if (!ffmpeg) {
    throw new AppError("The ffmpeg engine isn't loaded yet. Load the engine first.");
  }

  const inName = `input.${opts.inExt}`;
  const outName = `output.${opts.outExt}`;

  try {
    await ffmpeg.writeFile(inName, await fetchFile(opts.file));

    opts.onLog?.(`$ ffmpeg ${opts.args.join(" ")}`);
    await ffmpeg.exec(opts.args);

    const data = (await ffmpeg.readFile(outName)) as Uint8Array;
    const mime = guessMime(opts.outExt);
    const blob = new Blob([data.buffer as ArrayBuffer], { type: mime });
    const url = URL.createObjectURL(blob);

    try {
      await ffmpeg.deleteFile(inName);
      await ffmpeg.deleteFile(outName);
    } catch {
      /* cleanup is best-effort */
    }

    return { data, outName, blob, url, size: blob.size };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      "Something went wrong processing this file. Check the log panel for details — common causes are an unsupported input codec or an out-of-memory browser tab on very large files.",
      { cause: err, technical: err instanceof Error ? err.message : String(err) }
    );
  }
}

export { fetchFile };

/**
 * Extract a single PNG frame from a video at the given ffmpeg timestamp.
 * Returns a Blob of the frame image.
 */
export async function extractFrame(opts: {
  file: File;
  inExt: string;
  timestamp: string;
  onLog?: (message: string) => void;
}): Promise<Blob> {
  const ffmpeg = instance;
  if (!ffmpeg) {
    throw new AppError("The ffmpeg engine isn't loaded yet. Load the engine first.");
  }

  const inName = `input.${opts.inExt}`;
  const outName = "frame.png";

  try {
    await ffmpeg.writeFile(inName, await fetchFile(opts.file));

    const args = [
      "-ss",
      opts.timestamp || "00:00:05",
      "-i",
      inName,
      "-frames:v",
      "1",
      "-q:v",
      "2",
      outName,
    ];
    opts.onLog?.(`$ ffmpeg ${args.join(" ")}`);
    await ffmpeg.exec(args);

    const data = (await ffmpeg.readFile(outName)) as Uint8Array;
    const blob = new Blob([data.buffer as ArrayBuffer], { type: "image/png" });

    try {
      await ffmpeg.deleteFile(inName);
      await ffmpeg.deleteFile(outName);
    } catch {
      /* cleanup is best-effort */
    }

    return blob;
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(
      "Couldn't grab a frame from this video. Check the timestamp and try again.",
      { cause: err, technical: err instanceof Error ? err.message : String(err) }
    );
  }
}
