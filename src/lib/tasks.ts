import type {
  OptionValues,
  TaskDefinition,
  TaskId,
  TaskOption,
} from "@/types/task";

function optString(opts: OptionValues, key: string, fallback = ""): string {
  const v = opts[key];
  return v === undefined || v === null ? fallback : String(v);
}

export const TASKS: Record<TaskId, TaskDefinition> = {
  imgconvert: {
    id: "imgconvert",
    title: "Convert image",
    desc: "Change format, resize, and adjust quality — jpg, png, webp, bmp and gif in any direction.",
    icon: "image",
    accept: "image/*",
    hint: "accepts image files (jpg, png, webp, bmp, gif)",
    options: [
      {
        key: "format",
        label: "Output format",
        type: "select",
        options: ["jpg", "png", "webp", "bmp", "gif"],
        default: "webp",
      },
      {
        key: "quality",
        label: "Quality",
        type: "range",
        min: 1,
        max: 31,
        default: 6,
        note: "lower = better (ffmpeg qscale)",
      },
      {
        key: "width",
        label: "Max width (px, blank = original)",
        type: "text",
        placeholder: "e.g. 1600",
      },
    ],
    buildArgs(opts, inName, outName) {
      const args = ["-i", inName];
      const vf: string[] = [];
      const width = optString(opts, "width");
      if (width) vf.push(`scale='min(${parseInt(width, 10)},iw)':-2`);
      if (vf.length) args.push("-vf", vf.join(","));
      const format = optString(opts, "format", "webp");
      if (format === "jpg" || format === "webp") {
        args.push("-q:v", optString(opts, "quality", "6"));
      }
      args.push(outName);
      return args;
    },
    outExt(opts) {
      return optString(opts, "format", "webp") === "jpg" ? "jpg" : optString(opts, "format", "webp");
    },
    mediaTag: "img",
  },

  vidconvert: {
    id: "vidconvert",
    title: "Convert & compress video",
    desc: "Re-encode to a different container, cap the resolution, and dial in a quality/size trade-off with CRF.",
    icon: "video",
    accept: "video/*",
    hint: "accepts video files",
    options: [
      {
        key: "format",
        label: "Output format",
        type: "select",
        options: ["mp4", "webm", "mov"],
        default: "mp4",
      },
      {
        key: "res",
        label: "Max resolution",
        type: "select",
        options: ["original", "1080p", "720p", "480p"],
        default: "720p",
      },
      {
        key: "crf",
        label: "Quality (CRF)",
        type: "range",
        min: 18,
        max: 35,
        default: 26,
        note: "lower = better quality, bigger file",
      },
    ],
    buildArgs(opts, inName, outName) {
      const heights: Record<string, number> = { "1080p": 1080, "720p": 720, "480p": 480 };
      const args = ["-i", inName];
      const res = optString(opts, "res", "original");
      if (heights[res]) args.push("-vf", `scale=-2:'min(${heights[res]},ih)'`);
      const format = optString(opts, "format", "mp4");
      const codec = format === "webm" ? "libvpx-vp9" : "libx264";
      args.push("-c:v", codec, "-crf", optString(opts, "crf", "26"));
      if (format !== "webm") args.push("-preset", "veryfast", "-pix_fmt", "yuv420p");
      args.push("-c:a", format === "webm" ? "libopus" : "aac", "-b:a", "128k");
      args.push(outName);
      return args;
    },
    outExt(opts) {
      return optString(opts, "format", "mp4");
    },
    mediaTag: "video",
  },

  trim: {
    id: "trim",
    title: "Trim video",
    desc: "Cut a clip out of a longer video by start time and duration — fast, no re-encoding.",
    icon: "scissors",
    accept: "video/*",
    hint: "accepts video files",
    options: [
      {
        key: "start",
        label: "Start (hh:mm:ss)",
        type: "text",
        placeholder: "00:00:00",
        default: "00:00:00",
      },
      {
        key: "duration",
        label: "Duration (hh:mm:ss)",
        type: "text",
        placeholder: "00:00:10",
        default: "00:00:10",
      },
      {
        key: "format",
        label: "Output format",
        type: "select",
        options: ["mp4", "webm", "mov"],
        default: "mp4",
      },
    ],
    buildArgs(opts, inName, outName) {
      return [
        "-ss",
        optString(opts, "start", "00:00:00"),
        "-i",
        inName,
        "-t",
        optString(opts, "duration", "00:00:10"),
        "-c",
        "copy",
        outName,
      ];
    },
    outExt(opts) {
      return optString(opts, "format", "mp4");
    },
    mediaTag: "video",
  },

  audio: {
    id: "audio",
    title: "Extract audio",
    desc: "Pull the audio track out of a video as mp3, aac, wav or flac.",
    icon: "music",
    accept: "video/*",
    hint: "accepts video files",
    options: [
      {
        key: "format",
        label: "Output format",
        type: "select",
        options: ["mp3", "aac", "wav", "flac"],
        default: "mp3",
      },
      {
        key: "bitrate",
        label: "Bitrate (for mp3/aac)",
        type: "select",
        options: ["128k", "192k", "256k", "320k"],
        default: "192k",
      },
    ],
    buildArgs(opts, inName, outName) {
      const args = ["-i", inName, "-vn"];
      const format = optString(opts, "format", "mp3");
      if (format === "mp3" || format === "aac") {
        args.push("-b:a", optString(opts, "bitrate", "192k"));
      }
      args.push(outName);
      return args;
    },
    outExt(opts) {
      return optString(opts, "format", "mp3");
    },
    mediaTag: "audio",
  },

  gif: {
    id: "gif",
    title: "Video to GIF",
    desc: "Turn a short clip into a looping GIF. Keep clips brief — GIFs get large fast.",
    icon: "clapperboard",
    accept: "video/*",
    hint: "accepts video files",
    options: [
      {
        key: "start",
        label: "Start (hh:mm:ss)",
        type: "text",
        placeholder: "00:00:00",
        default: "00:00:00",
      },
      {
        key: "duration",
        label: "Duration (seconds)",
        type: "text",
        placeholder: "3",
        default: "3",
      },
      {
        key: "fps",
        label: "Frame rate",
        type: "select",
        options: ["8", "12", "15", "20"],
        default: "12",
      },
      {
        key: "width",
        label: "Width (px)",
        type: "select",
        options: ["320", "480", "640"],
        default: "480",
      },
    ],
    buildArgs(opts, inName, outName) {
      return [
        "-ss",
        optString(opts, "start", "00:00:00"),
        "-t",
        optString(opts, "duration", "3"),
        "-i",
        inName,
        "-vf",
        `fps=${optString(opts, "fps", "12")},scale=${optString(opts, "width", "480")}:-1:flags=lanczos`,
        outName,
      ];
    },
    outExt() {
      return "gif";
    },
    mediaTag: "img",
  },

  poster: {
    id: "poster",
    title: "Create poster",
    desc: "Grab a frame from a video and turn it into a poster with a title, subtitle and styled overlay — ready to share.",
    icon: "image-plus",
    accept: "video/*",
    hint: "accepts video files",
    mode: "poster",
    options: [
      {
        key: "start",
        label: "Frame at (hh:mm:ss)",
        type: "text",
        placeholder: "00:00:05",
        default: "00:00:05",
        note: "timestamp to grab the frame",
      },
      {
        key: "title",
        label: "Title",
        type: "text",
        placeholder: "e.g. Summer Trip",
        default: "",
        note: "big headline text",
      },
      {
        key: "subtitle",
        label: "Subtitle",
        type: "text",
        placeholder: "e.g. Episode 01 · 2026",
        default: "",
        note: "optional smaller text",
      },
      {
        key: "style",
        label: "Overlay style",
        type: "select",
        options: ["gradient", "bar", "minimal", "dark"],
        default: "gradient",
        note: "how the text area is shaded",
      },
      {
        key: "textColor",
        label: "Text color",
        type: "select",
        options: ["white", "black", "amber", "teal"],
        default: "white",
      },
      {
        key: "accentColor",
        label: "Accent color",
        type: "select",
        options: ["amber", "teal", "red", "none"],
        default: "amber",
        note: "small underline / edge accent",
      },
      {
        key: "format",
        label: "Output format",
        type: "select",
        options: ["jpg", "png", "webp"],
        default: "jpg",
      },
      {
        key: "quality",
        label: "Quality",
        type: "range",
        min: 1,
        max: 100,
        default: 88,
        note: "jpg/webp quality (higher = better)",
      },
      {
        key: "width",
        label: "Output width (px)",
        type: "select",
        options: ["1280", "1920", "1080", "original"],
        default: "1280",
      },
    ],
    buildArgs(opts, inName, outName) {
      // Extract a single high-quality frame; compositing happens on canvas.
      return [
        "-ss",
        optString(opts, "start", "00:00:05"),
        "-i",
        inName,
        "-frames:v",
        "1",
        "-q:v",
        "2",
        outName,
      ];
    },
    outExt() {
      // intermediate frame is always png; final format is chosen after compositing
      return "png";
    },
    mediaTag: "img",
    // final extension comes from the "format" option after canvas export
  },
};

export const TASK_ORDER: TaskId[] = [
  "imgconvert",
  "vidconvert",
  "trim",
  "audio",
  "gif",
  "poster",
];

export function getTask(id: TaskId): TaskDefinition {
  return TASKS[id];
}

export function defaultOptionValues(task: TaskDefinition): OptionValues {
  const values: OptionValues = {};
  for (const opt of task.options) {
    values[opt.key] = opt.default ?? "";
  }
  return values;
}

export function isSelectOption(opt: TaskOption): opt is Extract<TaskOption, { type: "select" }> {
  return opt.type === "select";
}

export function isRangeOption(opt: TaskOption): opt is Extract<TaskOption, { type: "range" }> {
  return opt.type === "range";
}

export function isTextOption(opt: TaskOption): opt is Extract<TaskOption, { type: "text" }> {
  return opt.type === "text";
}
