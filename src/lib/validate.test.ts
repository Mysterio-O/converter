import { describe, expect, it } from "vitest";
import {
  isValidSeconds,
  isValidTimecode,
  validateGifInputs,
  validateTrimInputs,
} from "@/lib/validate";

describe("isValidTimecode", () => {
  it("accepts hh:mm:ss", () => {
    expect(isValidTimecode("00:00:10")).toBe(true);
    expect(isValidTimecode("01:23:45")).toBe(true);
    expect(isValidTimecode("00:00:10.5")).toBe(true);
  });

  it("rejects malformed values", () => {
    expect(isValidTimecode("")).toBe(false);
    expect(isValidTimecode("10")).toBe(false);
    expect(isValidTimecode("00:00")).toBe(false);
    expect(isValidTimecode("aa:bb:cc")).toBe(false);
  });
});

describe("isValidSeconds", () => {
  it("accepts positive numbers", () => {
    expect(isValidSeconds("3")).toBe(true);
    expect(isValidSeconds("3.5")).toBe(true);
  });

  it("rejects zero and non-numbers", () => {
    expect(isValidSeconds("0")).toBe(false);
    expect(isValidSeconds("-1")).toBe(false);
    expect(isValidSeconds("abc")).toBe(false);
    expect(isValidSeconds("")).toBe(false);
  });
});

describe("validateTrimInputs", () => {
  it("passes with valid times", () => {
    expect(validateTrimInputs("00:00:00", "00:00:10")).toEqual([]);
  });

  it("reports both fields when invalid", () => {
    const issues = validateTrimInputs("bad", "also-bad");
    expect(issues).toHaveLength(2);
    expect(issues.map((i) => i.key)).toEqual(["start", "duration"]);
    expect(issues[0].message).toMatch(/Start time/);
    expect(issues[1].message).toMatch(/Duration/);
  });
});

describe("validateGifInputs", () => {
  it("passes with valid duration", () => {
    expect(validateGifInputs("3")).toEqual([]);
  });

  it("rejects invalid duration", () => {
    const issues = validateGifInputs("0");
    expect(issues).toHaveLength(1);
    expect(issues[0].message).toMatch(/positive number/);
  });
});
