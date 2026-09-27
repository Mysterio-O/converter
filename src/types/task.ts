export type TaskId =
  | "imgconvert"
  | "vidconvert"
  | "trim"
  | "audio"
  | "gif"
  | "poster";

/** How a task produces its result. */
export type TaskMode = "ffmpeg" | "poster";

export type OptionType = "select" | "range" | "text";

export interface SelectOption {
  key: string;
  label: string;
  type: "select";
  options: string[];
  default: string;
  note?: string;
}

export interface RangeOption {
  key: string;
  label: string;
  type: "range";
  min: number;
  max: number;
  default: number;
  note?: string;
}

export interface TextOption {
  key: string;
  label: string;
  type: "text";
  placeholder?: string;
  default?: string;
  note?: string;
}

export type TaskOption = SelectOption | RangeOption | TextOption;

export type OptionValues = Record<string, string | number>;

export type MediaTag = "img" | "video" | "audio";

/** Keys resolved by <TaskIcon /> to Lucide icons — keeps sizes consistent. */
export type TaskIconName =
  | "image"
  | "video"
  | "scissors"
  | "music"
  | "clapperboard"
  | "image-plus";

export interface TaskDefinition {
  id: TaskId;
  title: string;
  desc: string;
  icon: TaskIconName;
  accept: string;
  hint: string;
  options: TaskOption[];
  buildArgs: (opts: OptionValues, inName: string, outName: string) => string[];
  outExt: (opts: OptionValues) => string;
  mediaTag: MediaTag;
  /** Defaults to "ffmpeg". "poster" extracts a frame then composites text on canvas. */
  mode?: TaskMode;
}

export type EngineState = "idle" | "loading" | "ready" | "busy" | "error";

export type AppStatus =
  | "idle"
  | "downloading"
  | "processing"
  | "done"
  | "failed";
