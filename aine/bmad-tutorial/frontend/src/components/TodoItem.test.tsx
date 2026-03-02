// frontend/src/components/TodoItem.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TodoItem } from "./TodoItem.tsx";
import type { Todo } from "../types.ts";

const todo: Todo = {
  id: "todo-1",
  userId: "user-1",
  text: "Write tests",
  done: false,
  createdAt: new Date().toISOString(),
};

describe("TodoItem", () => {
  it("renders the todo text", () => {
    render(<TodoItem todo={todo} onDone={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Write tests")).toBeTruthy();
  });

  it("calls onDone with todo id when done button is clicked", () => {
    const onDone = vi.fn();
    render(<TodoItem todo={todo} onDone={onDone} onDelete={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: /mark as done/i }));
    expect(onDone).toHaveBeenCalledWith("todo-1");
  });

  it("calls onDelete with todo id when delete button is clicked", () => {
    const onDelete = vi.fn();
    render(<TodoItem todo={todo} onDone={vi.fn()} onDelete={onDelete} />);

    fireEvent.click(screen.getByRole("button", { name: /delete todo/i }));
    expect(onDelete).toHaveBeenCalledWith("todo-1");
  });

  it("applies line-through style when todo is done", () => {
    const doneTodo = { ...todo, done: true };
    render(<TodoItem todo={doneTodo} onDone={vi.fn()} onDelete={vi.fn()} />);

    const text = screen.getByText("Write tests");
    expect(text.className).toContain("line-through");
  });
});
