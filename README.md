# MediaForge

Local-first media toolkit. Convert, compress, trim, extract audio, make GIFs, and design posters — entirely in your browser with [ffmpeg.wasm](https://ffmpegwasm.netlify.app/).

> **Your files never leave your device.** All processing happens on-device in a WebAssembly sandbox. Nothing is uploaded to any server.

---

## Table of contents

1. [Features](#features)
2. [How it works](#how-it-works)
3. [Tech stack](#tech-stack)
4. [Project structure](#project-structure)
5. [Architecture](#architecture)
6. [Task pipeline](#task-pipeline)
7. [Privacy model](#privacy-model)
8. [PWA & offline](#pwa--offline)
9. [Theming](#theming)
10. [Error handling](#error-handling)
11. [Getting started](#getting-started)
12. [Scripts](#scripts)
13. [Testing](#testing)
14. [Project layout conventions](#project-layout-conventions)
15. [Mobile app port](#mobile-app-port)

---

## Features

### Media tools (6 tasks)

| Task | Inputs | Output | Notes |
|---|---|---|---|
| **Convert image** | jpg/png/webp/bmp/gif · format · quality · max width | jpg/png/webp/bmp/gif | ffmpeg qscale for jpg/webp |
| **Convert & compress video** | mp4/webm/mov · resolution cap · CRF | mp4/webm/mov | libx264 or vp9 + opus |
| **Trim video** | start + duration (hh:mm:ss) · format | mp4/webm/mov | stream copy (`-c copy`), no re-encode |
| **Extract audio** | video · mp3/aac/wav/flac · bitrate | mp3/aac/wav/flac | `-vn` strip video |
| **Video to GIF** | start · duration · fps · width | gif | lanczos scale |
| **Create poster** | frame timestamp · title · subtitle · style · colors · format · quality · width | jpg/png/webp | frame extract + canvas compositing |

### App capabilities

- **100% on-device processing** — no uploads, no accounts, no server calls for media
- **PWA** — installable, offline after first engine load
- **Mobile-first UI** — bottom navigation on small screens, side rail on desktop
- **Dark / light theme** — follow system, or force Light / Dark (persisted)
- **Drag & drop** file input with click-to-browse fallback
- **Live progress** during engine load and processing
- **ffmpeg log panel** for debugging
- **Result preview + download** with size delta vs original
- **Friendly error messages** (never raw stack traces)
- **Input validation** before running (timestamps, required title, etc.)
- **SEO / metadata** — Open Graph, Twitter cards, manifest, robots
- **Security headers** — `X-Content-Type-Options`, `Referrer-Policy`, SW scope

---

## How it works

```
┌─────────────────────────────────────────────────────────────┐
│  Browser (Next.js / React)                                  │
│                                                             │
│  1. User drops a file          (stays in memory / FS API)   │
│  2. User picks a task + options                             │
│  3. Workspace builds ffmpeg args (or poster pipeline)       │
│  4. @ffmpeg/wasm runs the command in a Web Worker           │
│  5. Result Blob → object URL → preview + download           │
│                                                             │
│  Nothing is sent to a backend. Ever.                        │
└─────────────────────────────────────────────────────────────┘
```

### Engine load (one-time)

On first visit the app shows an **engine gate**. Pressing *Load engine*:

1. Downloads `ffmpeg-core.js` + `ffmpeg-core.wasm` (~30 MB) from jsDelivr
2. Converts both to blob URLs and boots the WASM module
3. Registers a service worker that caches the core for offline use
4. Unlocks the task UI

Subsequent visits load the engine from cache.

### Poster pipeline (special case)

Poster is the only task that is not a pure ffmpeg in→out transform:

1. ffmpeg extracts **one PNG frame** at the given timestamp
2. An HTML `<canvas>` draws the frame + title/subtitle + style overlay
3. `canvas.toBlob()` exports jpg / png / webp

Text is drawn on canvas (not `drawtext`) so typography matches the app font and works reliably in ffmpeg.wasm.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16** (App Router) | SSR/SEO, file conventions, PWA metadata |
| Language | **TypeScript** | Typed task registry + safe option plumbing |
| Styling | **Tailwind CSS v4** | Utility-first, design tokens via `@theme` |
| Class merge | **clsx + tailwind-merge** (`cn`) | Conditional classes without conflicts |
| Media engine | **@ffmpeg/ffmpeg 0.12** (WASM) | Real ffmpeg in a worker, no server |
| Fonts | **Space Grotesk + JetBrains Mono** via `next/font` | Matches design, zero layout shift |
| Tests | **Vitest + React Testing Library + jsdom** | Fast unit + component tests |
| Lint | **ESLint 9** (`eslint-config-next`) | Consistent style / hooks rules |

---

## Project structure

```
mediaforge/
├── package.json                 # scripts + dependencies
├── tsconfig.json                # path alias @/* → src/*
├── next.config.ts               # security headers, SW cache rules
├── vitest.config.mts            # test runner (jsdom + tsconfig paths)
├── vitest.setup.ts              # RTL cleanup after each test
├── eslint.config.mjs
├── README.md                    # ← you are here
├── REACT_NATIVE.md              # mobile port guide
│
├── public/
│   ├── sw.js                    # service worker (shell + CDN cache)
│   ├── icon.svg                 # PWA / app icon (source)
│   ├── icon-192.png             # PWA icon 192
│   └── icon-512.png             # PWA icon 512
│
└── src/
    ├── app/                     # Next.js App Router
    │   ├── layout.tsx           # fonts, metadata, theme init, SW register
    │   ├── page.tsx             # renders <Workspace />
    │   ├── globals.css          # design tokens, Tailwind theme, base styles
    │   ├── manifest.ts          # PWA web manifest (MetadataRoute)
    │   ├── icon.svg             # Next.js favicon convention
    │   └── favicon.ico
    │
    ├── types/
    │   └── task.ts              # TaskId, TaskOption, TaskDefinition, statuses
    │
    ├── lib/                     # pure logic (unit-tested)
    │   ├── cn.ts                # clsx + tailwind-merge helper
    │   ├── tasks.ts             # task registry (options + buildArgs + outExt)
    │   ├── ffmpeg.ts            # engine load, run, extractFrame
    │   ├── poster.ts            # poster config, canvas compose, export
    │   ├── format.ts            # formatBytes, guessMime, fileExtension
    │   ├── errors.ts            # AppError + toUserMessage (friendly errors)
    │   ├── validate.ts          # trim / gif / poster input validation
    │   └── *.test.ts            # unit tests alongside sources
    │
    └── components/
        ├── workspace.tsx        # main client shell: state + task run loop
        ├── privacy-note.tsx     # "100% private" callout
        │
        ├── layout/
        │   ├── header.tsx       # brand + engine pill + theme toggle
        │   ├── brand-mark.tsx   # SVG logo
        │   ├── task-nav.tsx     # side rail (desktop) + bottom nav (mobile)
        │   ├── status-bar.tsx   # footer status + CPU threads
        │   ├── theme-toggle.tsx # Auto / Light / Dark
        │   └── sw-register.tsx  # registers /sw.js on mount
        │
        ├── engine/
        │   └── engine-gate.tsx  # one-time load screen + progress + errors
        │
        ├── task/
        │   ├── drop-zone.tsx    # drag & drop + file input
        │   ├── file-chip.tsx    # selected file name/size + clear
        │   ├── options-form.tsx # dynamic form from task.options
        │   ├── run-panel.tsx    # Run button + progress bar
        │   ├── result-panel.tsx # preview (img/video/audio) + download
        │   └── log-panel.tsx    # ffmpeg stdout/stderr log
        │
        └── ui/                  # shared primitives
            ├── button.tsx       # primary / secondary / ghost / danger
            ├── select.tsx
            ├── text-input.tsx
            ├── range-slider.tsx
            ├── progress-bar.tsx
            └── ui.test.tsx
```

---

## Architecture

### Layering

| Layer | Responsibility | Examples |
|---|---|---|
| **Types** | Shared contracts | `TaskDefinition`, `OptionValues` |
| **Lib (pure)** | Business logic, no React | `tasks.ts`, `poster.ts`, `validate.ts` |
| **Components (UI)** | Render + local UI state | `DropZone`, `OptionsForm` |
| **Workspace** | Orchestrates task run loop | `workspace.tsx` |

### Task registry

Every tool is a **declarative task** in `src/lib/tasks.ts`:

```ts
{
  id: "vidconvert",
  title: "Convert & compress video",
  desc: "…",
  accept: "video/*",
  options: [ /* select | range | text fields */ ],
  buildArgs(opts, inName, outName) { return ["-i", inName, …]; },
  outExt(opts) { return "mp4" | "webm" | "mov"; },
  mediaTag: "video",   // preview element
  mode?: "ffmpeg" | "poster",
}
```

`OptionsForm` renders any task from its `options` array — no per-task UI code. Adding a new task is mostly data.

### State flow (`workspace.tsx`)

```
engineState ──► EngineGate  |  Task UI
taskId ──► task = getTask(taskId) ──► options form
file ──► DropZone / FileChip
handleRun()
  ├─ validate inputs (trim / gif / poster)
  ├─ if mode === "poster": extractFrame → composePoster → exportPosterBlob
  └─ else: buildArgs → runFfmpeg → Blob URL
result ──► ResultPanel (preview + download)
```

Object URLs are revoked on task switch and unmount to avoid memory leaks.

---

## Task pipeline

### Standard ffmpeg tasks

1. Read options from the form into `OptionValues`
2. `task.buildArgs(...)` produces the CLI argv
3. `runFfmpeg()` writes `input.<ext>` into the WASM FS, `exec`, reads `output.<ext>`
4. Blob + object URL → result panel
5. Virtual FS files deleted (best-effort)

### Poster task

1. `extractFrame()` — ffmpeg `-ss <ts> -frames:v 1` → PNG blob
2. `loadImageFromBlob()` — decode into `HTMLImageElement`
3. `composePoster()` — canvas drawImage + gradient/bar/dark overlay + wrapped title/subtitle + accent underline
4. `exportPosterBlob()` — `canvas.toBlob` with format + quality

---

## Privacy model

| Guarantee | How |
|---|---|
| No media uploads | All work in WASM worker + canvas |
| No analytics / tracking | None installed |
| Minimal network | First load: app shell + engine core + fonts. Later: cached. |
| On-device cache | Service worker (shell + CDN assets) |
| Clear messaging | Privacy note on load screen and every task |

The only outbound requests are for **static assets** (app shell, fonts, ffmpeg core). User files are never transmitted.

---

## PWA & offline

| Piece | File | Role |
|---|---|---|
| Manifest | `src/app/manifest.ts` | name, icons, colors, standalone display |
| Icons | `public/icon.svg`, `icon-192.png`, `icon-512.png` | install / splash |
| Service worker | `public/sw.js` | cache-first for CDN/static, network-first for navigations |
| Register | `src/components/layout/sw-register.tsx` | registers SW after load |
| Headers | `next.config.ts` | `Service-Worker-Allowed`, no-cache on `/sw.js` |

After the engine has been fetched once, the app + core work offline.

---

## Theming

Design tokens live in `src/app/globals.css`:

| Token | Dark | Light |
|---|---|---|
| `--bg` | `#14171C` | `#EDEBE4` |
| `--panel` | `#1A1E25` | `#F7F5EF` |
| `--panel-2` | `#20242C` | `#FFFFFF` |
| `--line` | `#2B3038` | `#D8D4C8` |
| `--text` | `#E8E6DE` | `#1B1D22` |
| `--amber` | `#F5A623` | (accent, shared) |
| `--teal` | `#4FD1C5` | (accent, shared) |

Exposed to Tailwind via `@theme inline` (`bg-panel`, `text-text-dim`, `border-line`, …).

Theme resolution order:

1. Inline `theme-init` script sets `data-theme` from `localStorage` (no FOUC)
2. `ThemeToggle` cycles **Auto → Light → Dark** via `useSyncExternalStore`
3. Auto uses `prefers-color-scheme`

---

## Error handling

`src/lib/errors.ts` maps raw errors to **user-facing** messages:

| Detected cause | User sees |
|---|---|
| network / fetch / load fail | "Couldn't download the ffmpeg engine. Check your internet connection…" |
| memory / allocation | "This file is too large for the browser tab…" |
| codec / decoder / unsupported | "This file format or codec isn't supported…" |
| abort / cancel | "Processing was cancelled." |
| anything else | Generic "Something went wrong… check the log panel" |

Input validation (`src/lib/validate.ts`) runs **before** ffmpeg:

- Trim: `hh:mm:ss` start + duration
- GIF: positive seconds
- Poster: valid timestamp + non-empty title

Field-level issues are collected and shown in an alert region.

---

## Getting started

### Prerequisites

- **Node.js 20+** (tested on 24)
- **npm 10+**

> Install uses `--legacy-peer-deps` because `@testing-library/react` peer-range does not yet list React 19.

### Install & run

```powershell
cd E:\converter\mediaforge
npm install --legacy-peer-deps
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production

```powershell
npm run build
npm run start
```

---

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server (Turbopack) |
| `npm run build` | Production build + typecheck |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm test` | Vitest once (CI-friendly) |
| `npm run test:watch` | Vitest watch mode |

---

## Testing

**51 tests / 6 files** (as of this writing).

| File | Covers |
|---|---|
| `src/lib/format.test.ts` | bytes, mime, extension helpers |
| `src/lib/errors.test.ts` | `AppError`, `toUserMessage` mapping |
| `src/lib/tasks.test.ts` | registry shape + `buildArgs` for every task |
| `src/lib/poster.test.ts` | poster config parsing, mime, validation |
| `src/lib/validate.test.ts` | timecode / seconds / trim / gif / poster |
| `src/components/ui/ui.test.tsx` | Button, ProgressBar, PrivacyNote |

Run:

```powershell
npm test
```

Verified pipeline: **tests → lint → `next build` → SSR smoke test**.

---

## Project layout conventions

- **`src/lib`** — pure functions only; unit-test these first
- **`src/components/ui`** — dumb primitives, no business logic
- **`src/components/task`** — file/options/result widgets shared by tools
- **`src/components/workspace.tsx`** — the only place that talks to the engine for a full run
- **Colocated tests** — `foo.ts` lives next to `foo.test.ts`
- **Path alias** — `@/…` maps to `src/…`

---

## Mobile app port

A full guide for building a React Native version is in **[REACT_NATIVE.md](./REACT_NATIVE.md)**.

Short version: keep the same task registry and validation logic; swap WASM ffmpeg for a native ffmpeg kit (`ffmpeg-kit-react-native` or similar); re-implement UI with React Native / Expo.

---

## License

Private / unlicensed (add one if you open-source this).
