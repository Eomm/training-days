// frontend/src/components/TodoInput.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TodoInput } from "./TodoInput.tsx";

describe("TodoInput", () => {
  it("calls onAdd with trimmed text on button click", () => {
    const onAdd = vi.fn();
    render(<TodoInput onAdd={onAdd} />);

    fireEvent.change(screen.getByPlaceholderText("Add a task…"), {
      target: { value: "  Buy milk  " },
    });
    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(onAdd).toHaveBeenCalledOnce();
    expect(onAdd).toHaveBeenCalledWith("Buy milk");
  });

  it("calls onAdd on Enter key press", () => {
    const onAdd = vi.fn();
    render(<TodoInput onAdd={onAdd} />);

    const input = screen.getByPlaceholderText("Add a task…");
    fireEvent.change(input, { target: { value: "Task via Enter" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onAdd).toHaveBeenCalledWith("Task via Enter");
  });

  it("does not call onAdd when input is empty", () => {
    const onAdd = vi.fn();
    render(<TodoInput onAdd={onAdd} />);

    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(onAdd).not.toHaveBeenCalled();
  });

  it("does not call onAdd when input is whitespace only", () => {
    const onAdd = vi.fn();
    render(<TodoInput onAdd={onAdd} />);

    fireEvent.change(screen.getByPlaceholderText("Add a task…"), {
      target: { value: "   " },
    });
    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(onAdd).not.toHaveBeenCalled();
  });

  it("clears the input after successful submission", () => {
    const onAdd = vi.fn();
    render(<TodoInput onAdd={onAdd} />);

    const input = screen.getByPlaceholderText(
      "Add a task…",
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Something" } });
    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(input.value).toBe("");
  });
});
