import { describe, expect, it } from "vitest";
import {
  posterConfigFromOptions,
  posterMime,
} from "@/lib/poster";
import { TASKS, TASK_ORDER, defaultOptionValues } from "@/lib/tasks";
import { validatePosterInputs } from "@/lib/validate";

describe("poster task registry", () => {
  it("is registered and uses poster mode", () => {
    expect(TASK_ORDER).toContain("poster");
    const t = TASKS.poster;
    expect(t.mode).toBe("poster");
    expect(t.title).toBe("Create poster");
    expect(t.accept).toBe("video/*");
    expect(t.mediaTag).toBe("img");
  });

  it("exposes essential inputs", () => {
    const keys = TASKS.poster.options.map((o) => o.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        "start",
        "title",
        "subtitle",
        "style",
        "textColor",
        "accentColor",
        "format",
        "quality",
        "width",
      ])
    );
  });

  it("builds a single-frame ffmpeg extract", () => {
    const args = TASKS.poster.buildArgs(
      defaultOptionValues(TASKS.poster),
      "input.mp4",
      "frame.png"
    );
    expect(args).toContain("-frames:v");
    expect(args).toContain("1");
    expect(args[args.length - 1]).toBe("frame.png");
    expect(TASKS.poster.outExt({})).toBe("png");
  });
});

describe("posterConfigFromOptions", () => {
  it("parses defaults", () => {
    const cfg = posterConfigFromOptions({
      start: "00:00:07",
      title: "Hello",
      subtitle: "World",
      style: "bar",
      textColor: "amber",
      accentColor: "teal",
      format: "webp",
      quality: "75",
      width: "1920",
    });
    expect(cfg).toEqual({
      timestamp: "00:00:07",
      title: "Hello",
      subtitle: "World",
      style: "bar",
      textColor: "amber",
      accentColor: "teal",
      format: "webp",
      quality: 75,
      width: 1920,
    });
  });

  it("treats width 'original' as 0", () => {
    const cfg = posterConfigFromOptions({ width: "original", title: "x" });
    expect(cfg.width).toBe(0);
  });

  it("clamps quality and width", () => {
    const cfg = posterConfigFromOptions({ quality: "999", width: "50" });
    expect(cfg.quality).toBe(100);
    expect(cfg.width).toBe(320);
  });

  it("trims title and subtitle", () => {
    const cfg = posterConfigFromOptions({ title: "  Hi  ", subtitle: "  yo  " });
    expect(cfg.title).toBe("Hi");
    expect(cfg.subtitle).toBe("yo");
  });
});

describe("posterMime", () => {
  it("maps output formats", () => {
    expect(posterMime("jpg")).toBe("image/jpeg");
    expect(posterMime("png")).toBe("image/png");
    expect(posterMime("webp")).toBe("image/webp");
  });
});

describe("validatePosterInputs", () => {
  it("accepts a valid poster", () => {
    expect(validatePosterInputs("00:00:05", "My Title")).toEqual([]);
  });

  it("requires a title", () => {
    const issues = validatePosterInputs("00:00:05", "   ");
    expect(issues).toHaveLength(1);
    expect(issues[0].key).toBe("title");
    expect(issues[0].message).toMatch(/title/i);
  });

  it("requires a valid timestamp", () => {
    const issues = validatePosterInputs("nope", "Title");
    expect(issues).toHaveLength(1);
    expect(issues[0].key).toBe("start");
    expect(issues[0].message).toMatch(/Frame time/i);
  });
});
