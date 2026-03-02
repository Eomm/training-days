// frontend/src/components/TodoList.tsx
import { useMemo } from "react";
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
}

export function TodoList({
  todos,
  isLoading,
  onDone,
  onDelete,
  fadingOutId,
  onFadeComplete,
}: TodoListProps) {
  const highlights = useMemo(() => {
    const activeTodos = todos.filter((t) => !t.done);
    return computeAgeHighlights(activeTodos);
  }, [todos]);

  if (isLoading) return <SkeletonList />;

  // Done items are hidden unless they are currently fading out
  const visibleTodos = todos.filter((t) => !t.done || t.id === fadingOutId);

  if (visibleTodos.length === 0) {
    return (
      <p className="text-sm text-zinc-400 text-center mt-8">
        Nothing here yet. Add your first task above.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2 w-full">
      {visibleTodos.map((todo) => {
        const highlight = highlights.get(todo.id) ?? {
          intensity: 0,
          isStale: false,
        };
        return (
          <TodoItem
            key={todo.id}
            todo={todo}
            onDone={onDone}
            onDelete={onDelete}
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
