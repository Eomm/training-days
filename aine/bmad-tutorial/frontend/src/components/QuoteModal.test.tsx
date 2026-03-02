// frontend/src/components/QuoteModal.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuoteModal } from "./QuoteModal.tsx";

describe("QuoteModal", () => {
  it("renders nothing when quote is null", () => {
    const { container } = render(<QuoteModal quote={null} onClose={vi.fn()} />);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(container.textContent).toBe("");
  });

  it("renders the quote text when quote is provided", () => {
    render(<QuoteModal quote="Keep going!" onClose={vi.fn()} />);
    expect(screen.getByText(/"Keep going!"/)).toBeTruthy();
  });

  it("calls onClose when the button is clicked", () => {
    const onClose = vi.fn();
    render(<QuoteModal quote="Nice work" onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: /keep going/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });
});
