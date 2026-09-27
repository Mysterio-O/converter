import { describe, expect, it } from "vitest";
import { AppError, toUserMessage } from "@/lib/errors";

describe("toUserMessage", () => {
  it("returns AppError user message", () => {
    const err = new AppError("Custom friendly text");
    expect(toUserMessage(err)).toBe("Custom friendly text");
  });

  it("maps network errors", () => {
    expect(toUserMessage(new Error("Failed to fetch"))).toMatch(/internet connection/i);
  });

  it("maps memory errors", () => {
    expect(toUserMessage(new Error("Out of memory"))).toMatch(/too large/i);
  });

  it("maps codec errors", () => {
    expect(toUserMessage(new Error("Unsupported codec"))).toMatch(/isn't supported/i);
  });

  it("returns generic fallback", () => {
    expect(toUserMessage(new Error("???"))).toMatch(/Something went wrong/i);
  });
});

describe("AppError", () => {
  it("carries user and technical messages", () => {
    const err = new AppError("Friendly", { technical: "raw stack" });
    expect(err.userMessage).toBe("Friendly");
    expect(err.message).toBe("raw stack");
    expect(err.name).toBe("AppError");
  });
});
