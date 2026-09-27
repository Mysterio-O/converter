import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PrivacyNote } from "@/components/privacy-note";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Button } from "@/components/ui/button";

describe("PrivacyNote", () => {
  it("highlights local-only processing", () => {
    render(<PrivacyNote />);
    expect(screen.getByText(/100% private/i)).toBeDefined();
    expect(screen.getByText(/never leave this device/i)).toBeDefined();
  });

  it("renders compact variant", () => {
    render(<PrivacyNote compact />);
    expect(screen.getByText(/Nothing is uploaded/i)).toBeDefined();
  });
});

describe("ProgressBar", () => {
  it("renders label and clamps width", () => {
    render(<ProgressBar percent={150} label="processing… 100%" />);
    expect(screen.getByText("processing… 100%")).toBeDefined();
    const fill = screen.getByTestId("progress-bar-fill");
    expect(fill.getAttribute("style")).toContain("width: 100%");
  });
});

describe("Button", () => {
  it("renders children and respects disabled", () => {
    render(<Button disabled>Run</Button>);
    const btn = screen.getByRole("button", { name: "Run" });
    expect(btn).toBeDefined();
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });
});
