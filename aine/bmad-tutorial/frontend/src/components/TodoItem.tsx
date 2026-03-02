// frontend/src/components/TodoItem.tsx
import type { Todo } from "../types.js";
import { Trash2 } from "lucide-react";
import { Button } from "./ui/button.js";

interface TodoItemProps {
  todo: Todo;
  onDone: (id: string) => void;
  onDelete: (id: string) => void;
  agingClass?: string;
  isStale?: boolean;
  fadingOut?: boolean;
  onFadeComplete?: () => void;
}

export function TodoItem({
  todo,
  onDone,
  onDelete,
  agingClass = "bg-white",
  isStale = false,
  fadingOut = false,
  onFadeComplete,
}: TodoItemProps) {
  const borderClass = isStale
    ? "border border-dashed border-zinc-400"
    : "border border-gray-200";

  return (
    <li
      className={`flex flex-col gap-1 p-3 rounded-md ${borderClass} ${agingClass} transition-opacity duration-500 ${fadingOut ? "opacity-0" : "opacity-100"}`}
      onTransitionEnd={fadingOut ? onFadeComplete : undefined}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Mark as done"
          onClick={() => onDone(todo.id)}
          disabled={todo.done}
          className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0 hover:border-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <span
          className={`flex-1 ${todo.done ? "line-through text-gray-400" : ""}`}
        >
          {todo.text}
        </span>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Delete todo"
          onClick={() => onDelete(todo.id)}
          className="text-gray-400 hover:text-red-500"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      {isStale && (
        <span className="text-xs text-zinc-500 pl-8">
          Is this task still ongoing?
        </span>
      )}
    </li>
  );
}
