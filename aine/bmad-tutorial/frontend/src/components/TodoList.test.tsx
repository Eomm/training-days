// frontend/src/components/TodoList.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { TodoList } from "./TodoList.tsx";
import type { Todo } from "../types.ts";

const makeTodo = (text: string, createdAt?: string): Todo => ({
  id: crypto.randomUUID(),
  userId: "user-1",
  text,
  done: false,
  createdAt: createdAt ?? new Date().toISOString(),
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
    expect(screen.getByText(/nothing here yet/i)).toBeTruthy();
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

  it("renders a single todo with bg-white (no highlight)", () => {
    const todos = [makeTodo("Only task")];
    const { container } = render(
      <TodoList
        todos={todos}
        isLoading={false}
        onDone={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    const li = container.querySelector("li");
    expect(li?.className).toContain("bg-white");
  });

  it("renders all items with bg-white when list has ≤5 items (grace period)", () => {
    const todos = [
      makeTodo("Newest", "2026-03-02T10:00:00.000Z"),
      makeTodo("Oldest", "2026-02-25T10:00:00.000Z"),
    ];
    const { container } = render(
      <TodoList
        todos={todos}
        isLoading={false}
        onDone={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    const items = container.querySelectorAll("li");
    expect(items[0]?.className).toContain("bg-white");
    expect(items[1]?.className).toContain("bg-white");
  });

  it("hides done todos from the list", () => {
    const doneTodo: Todo = {
      id: "done-1",
      userId: "user-1",
      text: "Done task",
      done: true,
      createdAt: "2026-02-20T10:00:00.000Z",
    };
    const activeTodo = makeTodo("Active", "2026-03-02T10:00:00.000Z");
    render(
      <TodoList
        todos={[activeTodo, doneTodo]}
        isLoading={false}
        onDone={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("Active")).toBeTruthy();
    expect(screen.queryByText("Done task")).toBeNull();
  });

  it("shows a fading-out done item while fadingOutId is set", () => {
    const doneTodo: Todo = {
      id: "done-1",
      userId: "user-1",
      text: "Fading task",
      done: true,
      createdAt: "2026-02-20T10:00:00.000Z",
    };
    const activeTodo = makeTodo("Active", "2026-03-02T10:00:00.000Z");
    const { container } = render(
      <TodoList
        todos={[activeTodo, doneTodo]}
        isLoading={false}
        onDone={vi.fn()}
        onDelete={vi.fn()}
        fadingOutId="done-1"
        onFadeComplete={vi.fn()}
      />,
    );
    // Both items visible
    expect(screen.getByText("Fading task")).toBeTruthy();
    // The fading item has opacity-0
    const items = container.querySelectorAll("li");
    expect(items[1]?.className).toContain("opacity-0");
  });

  it("shows empty state when all todos are done and none is fading", () => {
    const doneTodo: Todo = {
      id: "done-1",
      userId: "user-1",
      text: "Done task",
      done: true,
      createdAt: "2026-02-20T10:00:00.000Z",
    };
    render(
      <TodoList
        todos={[doneTodo]}
        isLoading={false}
        onDone={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText(/nothing here yet/i)).toBeTruthy();
  });

  it("marks the oldest item as stale in a seven-item list", () => {
    const todos = [
      makeTodo("Task 1", "2026-03-07T10:00:00.000Z"), // newest
      makeTodo("Task 2", "2026-03-06T10:00:00.000Z"),
      makeTodo("Task 3", "2026-03-05T10:00:00.000Z"),
      makeTodo("Task 4", "2026-03-04T10:00:00.000Z"),
      makeTodo("Task 5", "2026-03-03T10:00:00.000Z"), // last in grace window
      makeTodo("Task 6", "2026-03-02T10:00:00.000Z"), // aging, not stale
      makeTodo("Task 7", "2026-03-01T10:00:00.000Z"), // aging, stale
    ];
    const { container } = render(
      <TodoList
        todos={todos}
        isLoading={false}
        onDone={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    const items = container.querySelectorAll("li");
    // Oldest item (Task 7) should have staleness styling
    expect(items[6]?.className).toContain("border-dashed");
    expect(items[6]?.className).toContain("border-zinc-400");
    // And the staleness prompt
    expect(screen.getByText("Is this task still ongoing?")).toBeTruthy();
    // Grace-window items should NOT have dashed borders
    expect(items[0]?.className).not.toContain("border-dashed");
    expect(items[4]?.className).not.toContain("border-dashed");
    // Non-stale aging item should NOT have dashed borders
    expect(items[5]?.className).not.toContain("border-dashed");
  });

  it("renders the list with role=list and aria-label", () => {
    const todos = [makeTodo("Task A")];
    render(
      <TodoList
        todos={todos}
        isLoading={false}
        onDone={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    const list = screen.getByRole("list", { name: /your tasks/i });
    expect(list).toBeTruthy();
    expect(list.tagName).toBe("UL");
  });

  it("renders skeleton with aria-busy and aria-label while loading", () => {
    const { container } = render(
      <TodoList
        todos={[]}
        isLoading={true}
        onDone={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    const skeleton = container.querySelector("ul");
    expect(skeleton?.getAttribute("aria-busy")).toBe("true");
    expect(skeleton?.getAttribute("aria-label")).toBe("Loading tasks");
  });
});
