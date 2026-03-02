// frontend/src/components/TodoList.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TodoList } from "./TodoList.tsx";
import type { Todo } from "../types.ts";

const makeTodo = (text: string): Todo => ({
  id: crypto.randomUUID(),
  userId: "user-1",
  text,
  done: false,
  createdAt: new Date().toISOString(),
});

describe("TodoList", () => {
  it("renders skeleton while loading", () => {
    const { container } = render(
      <TodoList
        todos={[]}
        isLoading={true}
        onDone={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    // SkeletonList renders 3 li elements
    expect(container.querySelectorAll("li")).toHaveLength(3);
  });

  it("renders empty state message when no todos", () => {
    render(
      <TodoList
        todos={[]}
        isLoading={false}
        onDone={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText(/no tasks yet/i)).toBeTruthy();
  });

  it("renders a list item for each todo", () => {
    const todos = [makeTodo("Task A"), makeTodo("Task B")];
    render(
      <TodoList
        todos={todos}
        isLoading={false}
        onDone={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("Task A")).toBeTruthy();
    expect(screen.getByText("Task B")).toBeTruthy();
  });
});
