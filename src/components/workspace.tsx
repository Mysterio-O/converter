"use client";

import { EngineGate } from "@/components/engine/engine-gate";
import { Header } from "@/components/layout/header";
import { InstallPrompt } from "@/components/layout/install-prompt";
import { StatusBar } from "@/components/layout/status-bar";
import { TaskNav } from "@/components/layout/task-nav";
import { PrivacyNote } from "@/components/privacy-note";
import { DropZone } from "@/components/task/drop-zone";
import { FileChip } from "@/components/task/file-chip";
import { LogPanel } from "@/components/task/log-panel";
import { OptionsForm } from "@/components/task/options-form";
import { ResultPanel } from "@/components/task/result-panel";
import { RunPanel } from "@/components/task/run-panel";
import {
  extractFrame,
  loadEngine,
  runFfmpeg,
  type EngineState,
} from "@/lib/ffmpeg";
import { toUserMessage } from "@/lib/errors";
import { fileExtension, outputFileName } from "@/lib/format";
import {
  composePoster,
  exportPosterBlob,
  posterConfigFromOptions,
} from "@/lib/poster";
import { defaultOptionValues, getTask } from "@/lib/tasks";
import {
  validateGifInputs,
  validatePosterInputs,
  validateTrimInputs,
  type ValidationIssue,
} from "@/lib/validate";
import type { AppStatus, MediaTag, OptionValues, TaskId } from "@/types/task";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't load the extracted frame into an image."));
    };
    img.src = url;
  });
}

interface ResultState {
  mediaTag: MediaTag;
  url: string;
  fileName: string;
  newSize: number;
  oldSize: number;
}

const STATUS_LABEL: Record<AppStatus, string> = {
  idle: "idle",
  downloading: "downloading ffmpeg core",
  processing: "processing",
  done: "done",
  failed: "failed — see log below",
};

export function Workspace() {
  const [engineState, setEngineState] = useState<EngineState>("idle");
  const [engineLabel, setEngineLabel] = useState("engine not loaded");
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadLabel, setLoadLabel] = useState("fetching core…");
  const [loadError, setLoadError] = useState<string | null>(null);

  const [taskId, setTaskId] = useState<TaskId>("imgconvert");
  const [file, setFile] = useState<File | null>(null);
  const [optionValues, setOptionValues] = useState<OptionValues>(() =>
    defaultOptionValues(getTask("imgconvert"))
  );
  const [status, setStatus] = useState<AppStatus>("idle");
  const [running, setRunning] = useState(false);
  const [runProgress, setRunProgress] = useState(0);
  const [runLabel, setRunLabel] = useState("processing…");
  const [logLines, setLogLines] = useState<string[]>([]);
  const [result, setResult] = useState<ResultState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldIssues, setFieldIssues] = useState<ValidationIssue[]>([]);
  const [perfNote, setPerfNote] = useState("");

  const resultUrlRef = useRef<string | null>(null);

  const task = useMemo(() => getTask(taskId), [taskId]);

  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.hardwareConcurrency) {
      setPerfNote(`${navigator.hardwareConcurrency} CPU threads available`);
    }
  }, []);

  // revoke object URLs when replaced / unmounted
  useEffect(() => {
    return () => {
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    };
  }, []);

  const handleLoadEngine = useCallback(async () => {
    setLoadError(null);
    setLoadProgress(0);
    try {
      await loadEngine({
        onLog: (msg) => setLogLines((prev) => [...prev, msg]),
        onProgress: (pct) => setRunProgress(pct),
        onStateChange: (state, label) => {
          setEngineState(state);
          setEngineLabel(label);
          if (state === "loading") {
            if (label.includes("wasm")) setLoadProgress(45);
            else if (label.includes("initializing")) setLoadProgress(85);
            else setLoadProgress(15);
            setLoadLabel(label);
          }
          if (state === "ready") {
            setLoadProgress(100);
            setStatus("idle");
          }
        },
      });
    } catch (err) {
      const msg = toUserMessage(err);
      setLoadError(msg);
      setEngineState("error");
      setEngineLabel("load failed");
      setStatus("failed");
    }
  }, []);

  const handleSelectTask = useCallback((id: TaskId) => {
    setTaskId(id);
    setOptionValues(defaultOptionValues(getTask(id)));
    setFile(null);
    setResult(null);
    setLogLines([]);
    setErrorMessage(null);
    setFieldIssues([]);
    setStatus("idle");
    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }
  }, []);

  const handleOptionChange = useCallback((key: string, value: string | number) => {
    setOptionValues((prev) => ({ ...prev, [key]: value }));
    setFieldIssues((prev) => prev.filter((i) => i.key !== key));
    setErrorMessage(null);
  }, []);

  const handleFile = useCallback((f: File) => {
    setFile(f);
    setResult(null);
    setErrorMessage(null);
  }, []);

  const handleClearFile = useCallback(() => {
    setFile(null);
    setResult(null);
  }, []);

  const handleRun = useCallback(async () => {
    if (!file || engineState !== "ready") return;

    // task-specific input validation
    let issues: ValidationIssue[] = [];
    if (taskId === "trim") {
      issues = validateTrimInputs(
        String(optionValues.start ?? ""),
        String(optionValues.duration ?? "")
      );
    } else if (taskId === "gif") {
      issues = validateGifInputs(String(optionValues.duration ?? ""));
    } else if (taskId === "poster") {
      issues = validatePosterInputs(
        String(optionValues.start ?? ""),
        String(optionValues.title ?? "")
      );
    }
    setFieldIssues(issues);
    if (issues.length > 0) {
      setStatus("failed");
      setErrorMessage(issues[0].message);
      return;
    }

    setRunning(true);
    setStatus("processing");
    setEngineState("busy");
    setEngineLabel("working…");
    setRunProgress(0);
    setRunLabel("processing…");
    setResult(null);
    setErrorMessage(null);
    setLogLines([]);

    if (resultUrlRef.current) {
      URL.revokeObjectURL(resultUrlRef.current);
      resultUrlRef.current = null;
    }

    try {
      if (task.mode === "poster") {
        setRunLabel("extracting frame…");
        setRunProgress(10);
        const config = posterConfigFromOptions(optionValues);
        const frameBlob = await extractFrame({
          file,
          inExt: fileExtension(file.name),
          timestamp: config.timestamp,
          onLog: (msg) => setLogLines((prev) => [...prev, msg]),
        });

        setRunLabel("compositing poster…");
        setRunProgress(50);

        const image = await loadImageFromBlob(frameBlob);
        const canvas = composePoster({
          image,
          config,
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
        });
        const blob = await exportPosterBlob(canvas, config.format, config.quality);
        const url = URL.createObjectURL(blob);
        const outName = outputFileName(file.name, config.format);

        resultUrlRef.current = url;
        setResult({
          mediaTag: "img",
          url,
          fileName: outName,
          newSize: blob.size,
          oldSize: frameBlob.size,
        });
        setRunProgress(100);
        setStatus("done");
        return;
      }

      const outExt = task.outExt(optionValues);
      const args = task.buildArgs(
        optionValues,
        `input.${fileExtension(file.name)}`,
        `output.${outExt}`
      );

      const runResult = await runFfmpeg({
        file,
        args,
        inExt: fileExtension(file.name),
        outExt,
        onLog: (msg) => setLogLines((prev) => [...prev, msg]),
        onProgress: (pct) => {
          setRunProgress(pct);
          setRunLabel(`processing… ${pct}%`);
        },
      });

      resultUrlRef.current = runResult.url;
      setResult({
        mediaTag: task.mediaTag,
        url: runResult.url,
        fileName: outputFileName(file.name, outExt),
        newSize: runResult.size,
        oldSize: file.size,
      });
      setStatus("done");
    } catch (err) {
      const msg = toUserMessage(err);
      setErrorMessage(msg);
      setStatus("failed");
      setLogLines((prev) => [
        ...prev,
        `error: ${err instanceof Error ? err.message : String(err)}`,
      ]);
    } finally {
      setRunning(false);
      setEngineState("ready");
      setEngineLabel("engine ready");
    }
  }, [file, engineState, task, optionValues, taskId]);

  const engineReady = engineState === "ready";

  return (
    <div className="flex min-h-full flex-col">
      <Header engineLabel={engineLabel} engineState={engineState} />

      <div className="flex flex-1 flex-col md:flex-row">
        <TaskNav activeTask={taskId} onSelect={handleSelectTask} />

        <main className="flex-1 overflow-y-auto px-4 pb-24 pt-5 sm:px-6 md:pb-10">
          <div className="mx-auto mb-4 max-w-3xl">
            <InstallPrompt />
          </div>
          {!engineReady && engineState !== "busy" ? (
            <EngineGate
              loaded={false}
              loading={engineState === "loading"}
              loadProgress={loadProgress}
              loadLabel={loadLabel}
              error={loadError}
              onLoad={handleLoadEngine}
            />
          ) : (
            <div className="mx-auto max-w-3xl">
              <div className="mb-5">
                <h2 className="mb-1 text-[22px] font-bold">{task.title}</h2>
                <p className="mb-4 max-w-[62ch] text-sm text-text-dim">
                  {task.desc}
                </p>
                <PrivacyNote compact />
              </div>

              <DropZone
                accept={task.accept}
                hint={task.hint}
                onFile={handleFile}
                disabled={running}
              />

              {file ? (
                <FileChip
                  name={file.name}
                  size={file.size}
                  onClear={handleClearFile}
                />
              ) : null}

              <OptionsForm
                options={task.options}
                values={optionValues}
                onChange={handleOptionChange}
              />

              <RunPanel
                disabled={!file || !engineReady}
                running={running}
                progress={runProgress}
                progressLabel={runLabel}
                onRun={handleRun}
              />

              {errorMessage ? (
                <div
                  role="alert"
                  className="mt-4 rounded-lg border border-danger/40 bg-danger/10 px-3.5 py-2.5 text-[13px] text-danger"
                >
                  {errorMessage}
                  {fieldIssues.length > 1 ? (
                    <ul className="mt-2 list-disc space-y-1 pl-5">
                      {fieldIssues.map((issue) => (
                        <li key={issue.key}>{issue.message}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ) : null}

              <LogPanel lines={logLines} />

              {result ? (
                <ResultPanel
                  mediaTag={result.mediaTag}
                  url={result.url}
                  fileName={result.fileName}
                  newSize={result.newSize}
                  oldSize={result.oldSize}
                />
              ) : null}
            </div>
          )}
        </main>
      </div>

      <StatusBar status={STATUS_LABEL[status]} perfNote={perfNote} />
    </div>
  );
}
