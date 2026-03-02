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
    render(
      <TodoItem
        todo={todo}
        onDone={vi.fn()}
        onDelete={vi.fn()}
        agingClass="bg-white"
      />,
    );
    expect(screen.getByText("Write tests")).toBeTruthy();
  });

  it("calls onDone with todo id when done button is clicked", () => {
    const onDone = vi.fn();
    render(
      <TodoItem
        todo={todo}
        onDone={onDone}
        onDelete={vi.fn()}
        agingClass="bg-white"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /mark as done/i }));
    expect(onDone).toHaveBeenCalledWith("todo-1");
  });

  it("calls onDelete with todo id when delete button is clicked", () => {
    const onDelete = vi.fn();
    render(
      <TodoItem
        todo={todo}
        onDone={vi.fn()}
        onDelete={onDelete}
        agingClass="bg-white"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /delete todo/i }));
    expect(onDelete).toHaveBeenCalledWith("todo-1");
  });

  it("applies line-through style when todo is done", () => {
    const doneTodo = { ...todo, done: true };
    render(
      <TodoItem
        todo={doneTodo}
        onDone={vi.fn()}
        onDelete={vi.fn()}
        agingClass="bg-white"
      />,
    );

    const text = screen.getByText("Write tests");
    expect(text.className).toContain("line-through");
  });

  it("applies the provided agingClass to the list item", () => {
    const { container } = render(
      <TodoItem
        todo={todo}
        onDone={vi.fn()}
        onDelete={vi.fn()}
        agingClass="bg-zinc-300"
      />,
    );
    const li = container.querySelector("li");
    expect(li?.className).toContain("bg-zinc-300");
  });

  it("defaults to bg-white when agingClass is not provided", () => {
    const { container } = render(
      <TodoItem todo={todo} onDone={vi.fn()} onDelete={vi.fn()} />,
    );
    const li = container.querySelector("li");
    expect(li?.className).toContain("bg-white");
  });

  it("shows staleness prompt when isStale is true", () => {
    render(
      <TodoItem
        todo={todo}
        onDone={vi.fn()}
        onDelete={vi.fn()}
        agingClass="bg-zinc-200"
        isStale={true}
      />,
    );
    expect(screen.getByText("Is this task still ongoing?")).toBeTruthy();
  });

  it("applies dashed border when isStale is true", () => {
    const { container } = render(
      <TodoItem
        todo={todo}
        onDone={vi.fn()}
        onDelete={vi.fn()}
        agingClass="bg-zinc-200"
        isStale={true}
      />,
    );
    const li = container.querySelector("li");
    expect(li?.className).toContain("border-dashed");
    expect(li?.className).toContain("border-zinc-400");
  });

  it("does not show staleness prompt when isStale is false", () => {
    render(
      <TodoItem
        todo={todo}
        onDone={vi.fn()}
        onDelete={vi.fn()}
        agingClass="bg-zinc-300"
        isStale={false}
      />,
    );
    expect(screen.queryByText("Is this task still ongoing?")).toBeNull();
  });

  it("applies opacity-0 and collapses height when fadingOut is true", () => {
    const { container } = render(
      <TodoItem
        todo={todo}
        onDone={vi.fn()}
        onDelete={vi.fn()}
        fadingOut={true}
      />,
    );
    const li = container.querySelector("li");
    expect(li?.className).toContain("opacity-0");
    expect(li?.className).toContain("max-h-0");
    expect(li?.className).toContain("transition-all");
  });

  it("applies opacity-100 when fadingOut is false", () => {
    const { container } = render(
      <TodoItem
        todo={todo}
        onDone={vi.fn()}
        onDelete={vi.fn()}
        fadingOut={false}
      />,
    );
    const li = container.querySelector("li");
    expect(li?.className).toContain("opacity-100");
    expect(li?.className).not.toContain("opacity-0");
  });
});
