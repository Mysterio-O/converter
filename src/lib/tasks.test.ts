import { describe, expect, it } from "vitest";
import {
  TASKS,
  TASK_ORDER,
  defaultOptionValues,
  getTask,
} from "@/lib/tasks";

describe("task registry", () => {
  it("exposes all six tasks in order", () => {
    expect(TASK_ORDER).toEqual([
      "imgconvert",
      "vidconvert",
      "trim",
      "audio",
      "gif",
      "poster",
    ]);
    for (const id of TASK_ORDER) {
      expect(getTask(id).id).toBe(id);
    }
  });

  it("each task has options, buildArgs, outExt and mediaTag", () => {
    for (const id of TASK_ORDER) {
      const t = getTask(id);
      expect(t.title.length).toBeGreaterThan(0);
      expect(t.desc.length).toBeGreaterThan(0);
      expect(t.options.length).toBeGreaterThan(0);
      expect(typeof t.buildArgs).toBe("function");
      expect(typeof t.outExt).toBe("function");
      expect(["img", "video", "audio"]).toContain(t.mediaTag);
    }
  });

  it("defaultOptionValues covers every option key", () => {
    for (const id of TASK_ORDER) {
      const t = getTask(id);
      const values = defaultOptionValues(t);
      for (const opt of t.options) {
        expect(values[opt.key]).toBeDefined();
      }
    }
  });
});

describe("imgconvert.buildArgs", () => {
  const t = TASKS.imgconvert;

  it("converts to webp with quality by default", () => {
    const args = t.buildArgs({ format: "webp", quality: 6 }, "input.png", "output.webp");
    expect(args).toEqual(["-i", "input.png", "-q:v", "6", "output.webp"]);
  });

  it("adds scale filter when width is set", () => {
    const args = t.buildArgs(
      { format: "jpg", quality: 4, width: "1600" },
      "input.png",
      "output.jpg"
    );
    expect(args).toContain("-vf");
    expect(args.join(" ")).toContain("scale='min(1600,iw)':-2");
  });

  it("skips quality for png", () => {
    const args = t.buildArgs({ format: "png", quality: 6 }, "input.jpg", "output.png");
    expect(args).not.toContain("-q:v");
    expect(t.outExt({ format: "png" })).toBe("png");
  });
});

describe("vidconvert.buildArgs", () => {
  const t = TASKS.vidconvert;

  it("encodes mp4 with libx264 and crf", () => {
    const args = t.buildArgs(
      { format: "mp4", res: "720p", crf: 26 },
      "input.mov",
      "output.mp4"
    );
    expect(args).toContain("libx264");
    expect(args).toContain("-crf");
    expect(args).toContain("26");
    expect(args.join(" ")).toContain("scale=-2:'min(720,ih)'");
  });

  it("encodes webm with vp9 and opus", () => {
    const args = t.buildArgs(
      { format: "webm", res: "original", crf: 30 },
      "input.mp4",
      "output.webm"
    );
    expect(args).toContain("libvpx-vp9");
    expect(args).toContain("libopus");
    expect(args.join(" ")).not.toContain("scale=");
  });
});

describe("trim.buildArgs", () => {
  it("uses stream copy with start and duration", () => {
    const args = TASKS.trim.buildArgs(
      { start: "00:00:05", duration: "00:00:10", format: "mp4" },
      "input.mp4",
      "output.mp4"
    );
    expect(args).toEqual([
      "-ss",
      "00:00:05",
      "-i",
      "input.mp4",
      "-t",
      "00:00:10",
      "-c",
      "copy",
      "output.mp4",
    ]);
  });
});

describe("audio.buildArgs", () => {
  it("extracts mp3 with bitrate", () => {
    const args = TASKS.audio.buildArgs(
      { format: "mp3", bitrate: "192k" },
      "input.mp4",
      "output.mp3"
    );
    expect(args).toEqual(["-i", "input.mp4", "-vn", "-b:a", "192k", "output.mp3"]);
  });

  it("omits bitrate for wav", () => {
    const args = TASKS.audio.buildArgs(
      { format: "wav", bitrate: "192k" },
      "input.mp4",
      "output.wav"
    );
    expect(args).not.toContain("-b:a");
    expect(args).toContain("-vn");
  });
});

describe("gif.buildArgs", () => {
  it("builds fps and scale filters", () => {
    const args = TASKS.gif.buildArgs(
      { start: "00:00:00", duration: "3", fps: "12", width: "480" },
      "input.mp4",
      "output.gif"
    );
    expect(args.join(" ")).toContain("fps=12,scale=480:-1:flags=lanczos");
    expect(TASKS.gif.outExt({})).toBe("gif");
  });
});
