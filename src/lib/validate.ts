const TIME_RE = /^\d{1,2}:\d{2}:\d{2}(\.\d+)?$/;
const SECONDS_RE = /^\d+(\.\d+)?$/;

export function isValidTimecode(value: string): boolean {
  return TIME_RE.test(value.trim());
}

export function isValidSeconds(value: string): boolean {
  return SECONDS_RE.test(value.trim()) && Number(value) > 0;
}

export interface ValidationIssue {
  key: string;
  message: string;
}

export function validateTrimInputs(
  start: string,
  duration: string
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!isValidTimecode(start)) {
    issues.push({
      key: "start",
      message: "Start time must look like 00:00:05 (hh:mm:ss).",
    });
  }
  if (!isValidTimecode(duration)) {
    issues.push({
      key: "duration",
      message: "Duration must look like 00:00:10 (hh:mm:ss) and be greater than zero.",
    });
  }
  return issues;
}

export function validateGifInputs(duration: string): ValidationIssue[] {
  if (!isValidSeconds(duration)) {
    return [
      {
        key: "duration",
        message: "Duration must be a positive number of seconds (e.g. 3).",
      },
    ];
  }
  return [];
}

export function validatePosterInputs(
  timestamp: string,
  title: string
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!isValidTimecode(timestamp)) {
    issues.push({
      key: "start",
      message: "Frame time must look like 00:00:05 (hh:mm:ss).",
    });
  }
  if (!title.trim()) {
    issues.push({
      key: "title",
      message: "Add a title so the poster has a headline (e.g. Summer Trip).",
    });
  }
  return issues;
}
