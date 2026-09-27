export class AppError extends Error {
  readonly userMessage: string;
  override readonly cause?: unknown;

  constructor(userMessage: string, options?: { cause?: unknown; technical?: string }) {
    super(options?.technical ?? userMessage);
    this.name = "AppError";
    this.userMessage = userMessage;
    this.cause = options?.cause;
  }
}

export function toUserMessage(err: unknown): string {
  if (err instanceof AppError) return err.userMessage;

  const raw =
    err && typeof err === "object" && "message" in err && typeof err.message === "string"
      ? err.message
      : String(err);

  const lower = raw.toLowerCase();

  if (lower.includes("network") || lower.includes("fetch") || lower.includes("failed to load")) {
    return "Couldn't download the ffmpeg engine. Check your internet connection and try again.";
  }
  if (lower.includes("memory") || lower.includes("allocation") || lower.includes("out of bounds")) {
    return "This file is too large for the browser tab to handle. Try a smaller file or split it first.";
  }
  if (
    lower.includes("invalid") ||
    lower.includes("unsupported") ||
    lower.includes("codec") ||
    lower.includes("decoder")
  ) {
    return "This file format or codec isn't supported. Try converting it to a common format first.";
  }
  if (lower.includes("abort") || lower.includes("cancel")) {
    return "Processing was cancelled.";
  }

  return "Something went wrong processing this file. Check the log panel for details — common causes are an unsupported input codec or an out-of-memory browser tab on very large files.";
}
