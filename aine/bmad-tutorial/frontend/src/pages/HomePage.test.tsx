// frontend/src/pages/HomePage.test.tsx
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { HomePage } from "./HomePage.js";

afterEach(() => {
  vi.unstubAllGlobals();
  sessionStorage.clear();
  localStorage.clear();
});

describe("HomePage", () => {
  it("renders without throwing", () => {
    render(<HomePage />);
  });

  it("displays the MotivaTodo heading", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { name: /motivatodo/i }),
    ).toBeInTheDocument();
  });

  it("shows 📭 emoji when no userId is set", () => {
    render(<HomePage />);
    const heading = screen.getByRole("heading", { name: /motivatodo/i });
    expect(heading.textContent).toContain("📭");
  });

  it("shows 📫 emoji when userId is set", () => {
    localStorage.setItem("motivatodo_user_id", "test-user-123");
    render(<HomePage />);
    const heading = screen.getByRole("heading", { name: /motivatodo/i });
    expect(heading.textContent).toContain("📫");
  });

  it("applies mobile-first responsive wrapper classes", () => {
    const { container } = render(<HomePage />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.className).toContain("w-full");
    expect(wrapper.className).toContain("px-4");
    expect(wrapper.className).toContain("lg:max-w-lg");
    expect(wrapper.className).toContain("lg:mx-auto");
  });

  it("shows error banner with role=alert when the API call fails", async () => {
    // Pre-seed identity so useGuestIdentity reads from cache and useTodos fires
    localStorage.setItem("motivatodo_user_id", "test-user-123");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503 }),
    );
    render(<HomePage />);
    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
    expect(screen.getByRole("alert").textContent).toMatch(/couldn.*t connect/i);
  });

  it("shows a Retry button in the error banner", async () => {
    localStorage.setItem("motivatodo_user_id", "test-user-123");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 503 }),
    );
    render(<HomePage />);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /retry/i }),
      ).toBeInTheDocument(),
    );
  });
});
