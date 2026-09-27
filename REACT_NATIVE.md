# MediaForge — React Native Mobile App Guide

Instructions for porting MediaForge to a **React Native** (or Flutter) mobile app. This document is the handoff spec: what to keep, what to replace, and how to structure the native version.

> **Goal:** same 6 tools, same privacy promise (100% on-device), same mental model — as an installable iOS/Android app.

---

## Table of contents

1. [Why React Native](#why-react-native)
2. [Recommended stack](#recommended-stack)
3. [What transfers as-is](#what-transfers-as-is)
4. [What must change](#what-must-change)
5. [Project structure](#project-structure)
6. [Core modules to port](#core-modules-to-port)
7. [UI / UX plan](#ui--ux-plan)
8. [Task definitions (shared contract)](#task-definitions-shared-contract)
9. [FFmpeg on mobile](#ffmpeg-on-mobile)
10. [Poster pipeline on mobile](#poster-pipeline-on-mobile)
11. [File access & storage](#file-access--storage)
12. [Permissions](#permissions)
13. [Theming](#theming)
14. [Error handling](#error-handling)
15. [Testing strategy](#testing-strategy)
16. [Implementation phases](#implementation-phases)
17. [Flutter alternative](#flutter-alternative)
18. [Checklist](#checklist)

---

## Why React Native

| Factor | Detail |
|---|---|
| **Shared language** | Web app is TypeScript + React — RN reuses types, task registry, validators |
| **One codebase** | iOS + Android from one project |
| **Expo** | Fast start, managed builds, OTA updates |
| **Native ffmpeg** | Mature libraries (ffmpeg-kit) with real codecs |

If you prefer Dart, see [Flutter alternative](#flutter-alternative) at the end — the phases below still apply, only the API surface changes.

---

## Recommended stack

| Concern | Recommendation | Notes |
|---|---|---|
| Framework | **React Native + Expo** (SDK 52+) or bare RN | Expo preferred for velocity |
| Language | **TypeScript** | Copy `types/` + `lib/` from web |
| Navigation | **Expo Router** or **React Navigation** | File-based (Expo Router) maps well to our screens |
| UI | **NativeWind** (Tailwind for RN) or plain StyleSheet | NativeWind keeps class names from web |
| State | **Zustand** or React context | Small; no Redux needed |
| File pick | **expo-document-picker** / **expo-image-picker** | Replaces drag & drop |
| Share / save | **expo-sharing** / **expo-media-library** | Download = save to Photos/Files |
| Haptics / icons | `@expo/vector-icons` | Task icons |
| Tests | **Jest + React Native Testing Library** | Mirror web `*.test.ts` |

---

## What transfers as-is

Copy these from `mediaforge/src` with little or no change:

| Module | Why it ports cleanly |
|---|---|
| `types/task.ts` | Pure TypeScript contracts |
| `lib/tasks.ts` | `buildArgs` / `outExt` / options metadata is platform-agnostic |
| `lib/format.ts` | Pure helpers |
| `lib/errors.ts` | `AppError` + `toUserMessage` mapping |
| `lib/validate.ts` | Pure validators |
| `lib/poster.ts` *(logic only)* | `posterConfigFromOptions`, mime helpers — keep. Canvas drawing is web-only |
| Unit tests for the above | Run under Jest with minor config |

Suggested approach: extract these into a shared package or folder:

```
packages/
  mediaforge-core/     # types + tasks + validate + format + errors
  mediaforge-web/      # current Next.js app
  mediaforge-mobile/   # React Native app
```

If you want to stay in one repo without monorepo tooling, just `cp -r src/lib src/types` into the RN project and fix imports.

---

## What must change

| Web | Mobile replacement |
|---|---|
| `@ffmpeg/ffmpeg` (WASM) | `ffmpeg-kit-react-native` (or `react-native-ffmpeg`) |
| Canvas poster compositing | Skia (`@shopify/react-native-skia`) or `react-native-view-shot` of a styled view |
| Drag & drop | Document / image picker |
| `<a download>` | `expo-file-system` + `expo-sharing` / MediaLibrary |
| Service worker offline | N/A — app is offline by default (native binary) |
| `next/font` | `expo-font` / `expo-google-fonts` |
| PWA manifest | Store listings (App Store / Play Store) |
| Bottom nav | `React Navigation` bottom tabs (same UX) |
| Theme toggle | `useColorScheme` + stored override |

---

## Project structure

```
mediaforge-mobile/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # theme, fonts, providers
│   ├── (tabs)/
│   │   ├── _layout.tsx           # bottom tab navigator
│   │   ├── convert-image.tsx
│   │   ├── compress-video.tsx
│   │   ├── trim.tsx
│   │   ├── extract-audio.tsx
│   │   ├── gif.tsx
│   │   └── poster.tsx
│   └── result.tsx                # optional dedicated result screen
│
├── src/
│   ├── core/                     # SHARED WITH WEB
│   │   ├── types/task.ts
│   │   ├── lib/tasks.ts
│   │   ├── lib/format.ts
│   │   ├── lib/errors.ts
│   │   └── lib/validate.ts
│   │
│   ├── native/
│   │   ├── ffmpeg.ts             # wrap ffmpeg-kit (run, progress, cancel)
│   │   ├── poster.ts             # Skia / view-shot compositor
│   │   └── files.ts              # pick, copy, save, share, cleanup
│   │
│   ├── components/
│   │   ├── ui/                   # Button, Select, Slider, TextInput
│   │   ├── layout/               # Header, StatusBadge, ThemeToggle
│   │   ├── task/                 # FileChip, OptionsForm, RunButton, ResultPreview
│   │   └── privacy-note.tsx
│   │
│   ├── screens/                  # presentational screen bodies
│   └── store/                    # zustand: engine status, active task, run state
│
├── assets/fonts/
├── app.json / app.config.ts
├── package.json
└── __tests__/
```

---

## Core modules to port

### 1. `ffmpeg.ts` (native wrapper)

Web API to mirror:

```ts
loadEngine(cb): Promise<void>          // may be a no-op or preload on native
runFfmpeg({ file, args, onLog, onProgress }): Promise<RunResult>
extractFrame({ file, timestamp }): Promise<Blob>
```

Native sketch (ffmpeg-kit):

```ts
import { FFmpegKit, FFmpegKitConfig, Statistics } from 'ffmpeg-kit-react-native';

export async function runFfmpeg(opts: RunOptions): Promise<RunResult> {
  const inPath = await copyToCache(opts.file, `input.${opts.inExt}`);
  const outPath = `${cacheDir()}/output.${opts.outExt}`;

  FFmpegKitConfig.enableStatisticsCallback((stats: Statistics) => {
    opts.onProgress?.(progressFrom(stats));
  });
  FFmpegKitConfig.enableLogCallback(({ message }) => opts.onLog?.(message));

  const session = await FFmpegKit.execute(
    ['-y', '-i', inPath, ...opts.args, outPath].join(' ')
  );
  const code = await session.getReturnCode();
  if (!code.isValueSuccess()) {
    throw new AppError(friendlyFromLogs(await session.getAllLogs()));
  }
  return { path: outPath, size: await fileSize(outPath) };
};
```

**Notes**
- Use absolute file paths (not WASM virtual FS).
- Pass `-y` to overwrite outputs in cache.
- Map `ReturnCode` failures into the same `toUserMessage()` categories.

### 2. Task registry

Reuse `buildArgs` unchanged. Output paths are native absolute paths.

### 3. Poster compositor

Replace `canvas` with one of:

| Option | Pros | Cons |
|---|---|---|
| **@shopify/react-native-skia** | Full control, close to canvas API | Extra native dep |
| **react-native-view-shot** | Simple: render styled RN view → PNG | Less pixel-precise control |
| **ffmpeg `drawtext`** | No extra UI layer | Needs bundled font file, harder styling |

Recommended: **Skia** for parity with web canvas (gradient, wrap, accent).

---

## UI / UX plan

Keep the web mental model:

| Screen piece | Mobile |
|---|---|
| Side rail / bottom tabs | **Bottom tab bar** (6 tools) — matches web mobile layout |
| Engine gate | Optional preloader or first-run tip (ffmpeg-kit is bundled; no 30MB download) |
| Drop zone | Full-width **“Choose video / image”** button → document picker |
| Options form | Same field types: select (action sheet), slider, text |
| Run | Sticky **Run** button at bottom + progress bar |
| Result | Image / video preview + **Save to Photos** + **Share** |
| Status bar | Subtle footer text: idle / processing / done |
| Theme | System + manual override in header |

Navigation example (Expo Router bottom tabs):

```
Tabs: Image | Video | Trim | Audio | GIF | Poster
```

Each tab screen = task id + shared `TaskWorkspace` component with that task’s options.

---

## Task definitions (shared contract)

Keep the web shape so logic stays identical:

```ts
export type TaskId =
  | "imgconvert" | "vidconvert" | "trim" | "audio" | "gif" | "poster";

export interface TaskDefinition {
  id: TaskId;
  title: string;
  desc: string;
  icon: string;
  accept: string;          // mime filter for picker
  hint: string;
  options: TaskOption[];   // select | range | text
  buildArgs(opts, inName, outName): string[];
  outExt(opts): string;
  mediaTag: "img" | "video" | "audio";
  mode?: "ffmpeg" | "poster";
}
```

Option examples (must match web for consistency):

- **imgconvert** — format, quality (1–31 qscale), max width  
- **vidconvert** — format, res, crf (18–35)  
- **trim** — start, duration, format  
- **audio** — format, bitrate  
- **gif** — start, duration, fps, width  
- **poster** — start, title, subtitle, style, textColor, accentColor, format, quality, width  

---

## FFmpeg on mobile

### Library

**`ffmpeg-kit-react-native`** (successor to `react-native-ffmpeg`):

- Full / min / https packages per platform  
- GPL vs LGPL codec builds — **check license before shipping** (libx264 is GPL)  
- iOS: increased binary size; strip unused archs  

### Codec parity with web

| Task | Web encoders | Mobile availability |
|---|---|---|
| Image | mjpeg / png / webp / bmp / gif | Confirm webp in the chosen kit build |
| Video | libx264, libvpx-vp9, aac, libopus | x264 needs GPL build; vp9/opus need full package |
| Trim | stream copy | Always available |
| Audio | mp3, aac, wav, flac | Usually in full package |
| GIF | gif + lanczos | Available |
| Poster | frame extract (png) | Always available |

**Tip:** pick the **full** ffmpeg-kit package and document the GPL implication in the store listing / LICENSE.

### Progress & cancel

ffmpeg-kit supports statistics callbacks and `FFmpegKit.cancel()`. Wire Cancel into the Run button while processing.

---

## Poster pipeline on mobile

```
1. Pick video
2. ffmpeg -ss <ts> -i <in> -frames:v 1 frame.png
3. Load frame into Skia
4. Draw:
     - image (cover fit to target width)
     - style overlay (gradient / bar / dark / none)
     - title (bold, wrapped)
     - subtitle (smaller, wrapped)
     - accent underline
5. encode JPEG / PNG / WebP
6. Save + share
```

Reuse `posterConfigFromOptions` and style/color token maps from web `lib/poster.ts`.

Font: load **Space Grotesk** via `expo-font` and pass the family name into Skia.

---

## File access & storage

| Action | API |
|---|---|
| Pick video/image | `expo-document-picker` (or `expo-image-picker` for photos) |
| Read into ffmpeg | Copy into `FileSystem.cacheDirectory` first |
| Output | Write to cache, then save/share |
| Save to gallery | `expo-media-library` (needs permission) |
| Share | `expo-sharing` |
| Cleanup | Delete cache files older than N hours on launch |

**Privacy line for the app store:**  
> “All media processing happens on your device. We never upload your videos or images to any server.”

---

## Permissions

| Platform | Permission | When | Purpose |
|---|---|---|---|
| iOS | Photo Library (Add) | Save result | Write poster/video |
| iOS | Photo Library Read | Optional import | Pick from Photos |
| Android | `READ_MEDIA_VIDEO` / `READ_MEDIA_IMAGES` | Pick | Import media |
| Android | `WRITE_EXTERNAL_STORAGE` (≤28) | Save | Legacy save |

- Use **system pickers** whenever possible to avoid broad storage permissions.  
- Request **only on action** (when user taps Save / Pick).  
- Explain the reason in a pre-prompt, matching the privacy note.

---

## Theming

Mirror web tokens in a `theme.ts`:

```ts
export const tokens = {
  dark: {
    bg: "#14171C", panel: "#1A1E25", panel2: "#20242C",
    line: "#2B3038", text: "#E8E6DE", textDim: "#8B93A1",
    amber: "#F5A623", teal: "#4FD1C5", danger: "#E5674A",
  },
  light: {
    bg: "#EDEBE4", panel: "#F7F5EF", panel2: "#FFFFFF",
    line: "#D8D4C8", text: "#1B1D22", textDim: "#6A6F79",
    amber: "#F5A623", teal: "#4FD1C5", danger: "#E5674A",
  },
};
```

- `useColorScheme()` for system default  
- Persist override with AsyncStorage (`Auto | Light | Dark`)  
- NativeWind users: map the same names (`bg-panel`, `text-text-dim`)

---

## Error handling

Port `toUserMessage()` unchanged. Add mobile-specific cases:

| Condition | Message |
|---|---|
| Out of storage | “Your device is low on storage. Free some space and try again.” |
| Interrupted / backgrounded | “Processing stopped because the app went to the background.” |
| Permission denied | “MediaForge needs permission to save this file to your Photos.” |
| Codec not in build | “This format isn’t supported by the mobile engine build.” |

Never show raw ffmpeg log dumps in the primary alert — put them in an expandable **Details** panel (like the web log).

---

## Testing strategy

| Layer | Tool | What |
|---|---|---|
| Core logic | **Jest** | port `tasks`, `validate`, `format`, `errors`, `posterConfig` tests from web |
| Components | **RNTL** | OptionsForm, FileChip, RunButton states |
| Native ffmpeg | **Integration** (device/simulator) | one real mp4 → each task golden path |
| Poster | Snapshot / pixel sample | title placement, accent present |
| E2E | **Maestro** or **Detox** | pick file → run → see result |

CI: run Jest on every PR; run Detox/Maestro on nightly or pre-release.

---

## Implementation phases

Same style as the web project — implement one phase at a time.

### Phase 1 — Scaffold
- Create Expo (TypeScript) app `mediaforge-mobile`
- Install navigation (bottom tabs), theming, fonts
- Copy `src/lib` + `src/types` from web; get Jest green on core tests

### Phase 2 — Native engine
- Integrate `ffmpeg-kit-react-native`
- Implement `runFfmpeg` / `extractFrame` with progress + cancel + friendly errors
- Smoke test: extract frame from a sample mp4 on device

### Phase 3 — Shared task UI
- `OptionsForm` (select / slider / text)
- File pick + FileChip + Run + progress + Result preview
- Wire **Convert image** and **Trim** first (simplest paths)

### Phase 4 — Remaining tools
- Convert/compress video, Extract audio, GIF
- Parity checklist vs web `buildArgs` tests

### Phase 5 — Poster
- Skia compositor (or view-shot)
- Save + share poster images

### Phase 6 — Polish & ship
- Theme toggle, privacy note, error details panel
- Permissions copy, App Store / Play listing
- E2E + performance pass (large files, low storage)
- Production builds

---

## Flutter alternative

If you choose Flutter instead of RN, map as follows:

| RN | Flutter |
|---|---|
| Expo / RN | Flutter + Dart |
| ffmpeg-kit-react-native | `ffmpeg_kit_flutter` (same FFmpegKit family) |
| expo-document-picker | `file_picker` |
| expo-media-library | `gal` / `image_gallery_saves` |
| expo-sharing | `share_plus` |
| React Native Skia | `CustomPainter` / `RepaintBoundary.toImage` |
| NativeWind | `ThemeExtension` + shared color tokens |
| Zustand | `riverpod` / `provider` |
| Jest | `flutter_test` |
| Expo Router tabs | `NavigationBar` + `go_router` |

Keep the same **task registry + buildArgs + validators** by rewriting them in Dart (or use `flutter_rust_bridge` / platform channels if you want a single native ffmpeg wrapper).

The phases, privacy model, and UX plan above stay valid.

---

## Checklist

**Before coding**
- [ ] Choose RN+Expo or Flutter
- [ ] Choose ffmpeg package + license (LGPL vs GPL build)
- [ ] Decide monorepo (shared core) vs copy-paste of `lib/`

**Parity**
- [ ] All 6 tasks produce correct output vs web
- [ ] Same option labels, defaults, and validation messages
- [ ] Poster styles: gradient, bar, minimal, dark
- [ ] Friendly errors (no raw logs in alerts)
- [ ] Theme: Auto / Light / Dark

**Privacy & store**
- [ ] No network calls with user media
- [ ] Privacy string on first run + store listing
- [ ] Only request permissions on action
- [ ] Clear cache policy

**Quality**
- [ ] Unit tests for core ported modules
- [ ] Device test with large video
- [ ] Cancel mid-run works
- [ ] Offline works (it should, by default)
- [ ] iOS + Android production builds

---

## Questions to decide early

1. **Expo managed vs bare** — need custom native ffmpeg? (usually fine with a dev build / prebuild)  
2. **GPL codecs** — do you need libx264 / mp3?  
3. **Shared core package** — monorepo or duplicate?  
4. **Max input size** — any guardrails for low-end devices?  
5. **Cloud sync?** — out of scope for v1 (keep 100% local).

---

*This guide assumes the web app in `mediaforge/` is the source of truth. Keep `README.md` and this file in sync when tasks or options change.*
