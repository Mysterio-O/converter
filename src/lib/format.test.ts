import { describe, expect, it } from "vitest";
import {
  formatBytes,
  fileBaseName,
  fileExtension,
  guessMime,
  outputFileName,
  sizeDeltaNote,
} from "@/lib/format";

describe("formatBytes", () => {
  it("formats bytes", () => {
    expect(formatBytes(512)).toBe("512 B");
  });

  it("formats kilobytes", () => {
    expect(formatBytes(2048)).toBe("2.0 KB");
  });

  it("formats megabytes", () => {
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.00 MB");
  });
});

describe("sizeDeltaNote", () => {
  it("reports smaller output", () => {
    expect(sizeDeltaNote(50, 100)).toBe("50% smaller than original");
  });

  it("reports larger output", () => {
    expect(sizeDeltaNote(150, 100)).toBe("50% larger than original");
  });
});

describe("guessMime", () => {
  it("maps common image types", () => {
    expect(guessMime("jpg")).toBe("image/jpeg");
    expect(guessMime("PNG")).toBe("image/png");
    expect(guessMime("webp")).toBe("image/webp");
  });

  it("maps video and audio types", () => {
    expect(guessMime("mp4")).toBe("video/mp4");
    expect(guessMime("mp3")).toBe("audio/mpeg");
  });

  it("falls back for unknown types", () => {
    expect(guessMime("xyz")).toBe("application/octet-stream");
  });
});

describe("fileExtension", () => {
  it("extracts extension", () => {
    expect(fileExtension("photo.JPEG")).toBe("jpeg");
  });

  it("falls back to dat", () => {
    expect(fileExtension("noext")).toBe("dat");
  });
});

describe("fileBaseName", () => {
  it("strips only the last extension", () => {
    expect(fileBaseName("my.video.final.mp4")).toBe("my.video.final");
  });

  it("returns full name when there is no extension", () => {
    expect(fileBaseName("noext")).toBe("noext");
  });

  it("returns empty when the name is only an extension", () => {
    expect(fileBaseName(".mp4")).toBe("");
  });
});

describe("outputFileName", () => {
  it("keeps the original name and swaps the extension", () => {
    expect(outputFileName("holiday.mov", "mp4")).toBe("holiday.mp4");
    expect(outputFileName("photo.png", "webp")).toBe("photo.webp");
  });

  it("keeps the same name when format is unchanged", () => {
    expect(outputFileName("clip.mp4", "mp4")).toBe("clip.mp4");
  });

  it("preserves dots in the base name", () => {
    expect(outputFileName("my.video.final.mp4", "webm")).toBe("my.video.final.webm");
  });

  it("falls back to media when the name is empty", () => {
    expect(outputFileName(".mp4", "jpg")).toBe("media.jpg");
  });
});
