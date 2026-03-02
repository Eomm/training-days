// frontend/src/components/TodoList.tsx
import { useMemo, useRef, useCallback } from "react";
import type { Todo } from "../types.js";
import { SkeletonList } from "./SkeletonList.js";
import { TodoItem } from "./TodoItem.js";
import {
  computeAgeHighlights,
  getAgingClass,
} from "../lib/computeAgeHighlights.ts";

interface TodoListProps {
  todos: Todo[];
  isLoading: boolean;
  onDone: (id: string) => void;
  onDelete: (id: string) => void;
  fadingOutId?: string | null;
  onFadeComplete?: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export function TodoList({
  todos,
  isLoading,
  onDone,
  onDelete,
  fadingOutId,
  onFadeComplete,
  inputRef,
}: TodoListProps) {
  const highlights = useMemo(() => {
    const activeTodos = todos.filter((t) => !t.done);
    return computeAgeHighlights(activeTodos);
  }, [todos]);

  const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map());

  const setItemRef = useCallback(
    (id: string) => (el: HTMLLIElement | null) => {
      if (el) {
        itemRefs.current.set(id, el);
      } else {
        itemRefs.current.delete(id);
      }
    },
    [],
  );

  if (isLoading) return <SkeletonList />;

  // Done items are hidden unless they are currently fading out
  const visibleTodos = todos.filter((t) => !t.done || t.id === fadingOutId);

  const handleDelete = (id: string) => {
    const idx = visibleTodos.findIndex((t) => t.id === id);
    onDelete(id);

    // After deletion, move focus to next item's done button, or previous, or input
    requestAnimationFrame(() => {
      const remaining = visibleTodos.filter((t) => t.id !== id);
      if (remaining.length === 0) {
        inputRef?.current?.focus();
        return;
      }
      const nextIdx = Math.min(idx, remaining.length - 1);
      const nextTodo = remaining[nextIdx];
      if (nextTodo) {
        const el = itemRefs.current.get(nextTodo.id);
        const btn = el?.querySelector<HTMLButtonElement>(
          'button[aria-label*="as complete"]',
        );
        btn?.focus();
      }
    });
  };

  if (visibleTodos.length === 0) {
    return (
      <p className="text-sm text-zinc-400 text-center mt-8">
        Nothing here yet. Add your first task above.
      </p>
    );
  }

  return (
    <ul
      role="list"
      aria-label="Your tasks"
      className="flex flex-col gap-2 w-full"
    >
      {visibleTodos.map((todo) => {
        const highlight = highlights.get(todo.id) ?? {
          intensity: 0,
          isStale: false,
        };
        return (
          <TodoItem
            key={todo.id}
            ref={setItemRef(todo.id)}
            todo={todo}
            onDone={onDone}
            onDelete={handleDelete}
            agingClass={
              todo.done ? "bg-white" : getAgingClass(highlight.intensity)
            }
            isStale={!todo.done && highlight.isStale}
            fadingOut={todo.id === fadingOutId}
            onFadeComplete={onFadeComplete}
          />
        );
      })}
    </ul>
  );
}
