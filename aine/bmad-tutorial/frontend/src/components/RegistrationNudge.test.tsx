// frontend/src/components/RegistrationNudge.test.tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RegistrationNudge } from "./RegistrationNudge.js";

beforeEach(() => {
  sessionStorage.clear();
});

describe("RegistrationNudge", () => {
  it("renders nothing when todoCount is below threshold (< 5)", () => {
    const { container } = render(<RegistrationNudge todoCount={4} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when todoCount is 0", () => {
    const { container } = render(<RegistrationNudge todoCount={0} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the nudge when todoCount is exactly 5", () => {
    render(<RegistrationNudge todoCount={5} />);
    expect(
      screen.getByText(/register to keep your tasks forever/i),
    ).toBeInTheDocument();
  });

  it("renders the nudge when todoCount is greater than 5", () => {
    render(<RegistrationNudge todoCount={10} />);
    expect(
      screen.getByText(/register to keep your tasks forever/i),
    ).toBeInTheDocument();
  });

  it("has a dismiss button with correct aria-label", () => {
    render(<RegistrationNudge todoCount={5} />);
    const btn = screen.getByRole("button", {
      name: /dismiss registration prompt/i,
    });
    expect(btn).toBeInTheDocument();
  });

  it("dismisses the nudge when the dismiss button is clicked", () => {
    render(<RegistrationNudge todoCount={5} />);
    const btn = screen.getByRole("button", {
      name: /dismiss registration prompt/i,
    });
    fireEvent.click(btn);
    expect(
      screen.queryByText(/register to keep your tasks forever/i),
    ).not.toBeInTheDocument();
  });

  it("stores dismissal in sessionStorage when dismissed", () => {
    render(<RegistrationNudge todoCount={5} />);
    const btn = screen.getByRole("button", {
      name: /dismiss registration prompt/i,
    });
    fireEvent.click(btn);
    expect(sessionStorage.getItem("nudge-dismissed")).toBe("true");
  });

  it("does not render if sessionStorage already marks nudge as dismissed", () => {
    sessionStorage.setItem("nudge-dismissed", "true");
    const { container } = render(<RegistrationNudge todoCount={10} />);
    expect(container.firstChild).toBeNull();
  });

  it("uses role=status so assistive technology announces the nudge politely", () => {
    render(<RegistrationNudge todoCount={5} />);
    const nudge = screen.getByRole("status");
    expect(nudge).toBeInTheDocument();
  });
});
