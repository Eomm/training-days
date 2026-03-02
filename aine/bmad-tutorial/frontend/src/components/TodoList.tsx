// frontend/src/components/TodoList.tsx
import type { Todo } from "../types.js";
import { SkeletonList } from "./SkeletonList.js";
import { TodoItem } from "./TodoItem.js";

interface TodoListProps {
  todos: Todo[];
  isLoading: boolean;
  onDone: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TodoList({
  todos,
  isLoading,
  onDone,
  onDelete,
}: TodoListProps) {
  if (isLoading) return <SkeletonList />;

  if (todos.length === 0) {
    return (
      <p className="text-center text-gray-400 mt-8">
        No tasks yet. Add one above!
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2 w-full">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onDone={onDone}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
