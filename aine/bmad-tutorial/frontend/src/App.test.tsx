// frontend/src/App.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { App } from "./App.js";

describe("App", () => {
  it("renders skip navigation link in the DOM", () => {
    render(<App />);
    const skipLink = screen.getByRole("link", { name: /skip to task input/i });
    expect(skipLink).toBeTruthy();
    expect(skipLink.getAttribute("href")).toBe("#task-input");
  });

  it("skip link has sr-only class (visually hidden by default)", () => {
    render(<App />);
    const skipLink = screen.getByRole("link", { name: /skip to task input/i });
    expect(skipLink.className).toContain("sr-only");
  });
});
