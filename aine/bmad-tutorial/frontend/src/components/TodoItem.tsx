// frontend/src/components/TodoItem.tsx
import { forwardRef } from "react";
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

export const TodoItem = forwardRef<HTMLLIElement, TodoItemProps>(
  function TodoItem(
    {
      todo,
      onDone,
      onDelete,
      agingClass = "bg-white",
      isStale = false,
      fadingOut = false,
      onFadeComplete,
    },
    ref,
  ) {
    const borderClass = isStale
      ? "border border-dashed border-zinc-400"
      : "border border-gray-200";

    return (
      <li
        ref={ref}
        className={`flex flex-col gap-1 rounded-md ${borderClass} ${agingClass} motion-safe:transition-all motion-safe:duration-500 ${fadingOut ? "opacity-0 max-h-0 p-0 m-0 overflow-hidden border-0" : "opacity-100 max-h-40 p-3"}`}
        onTransitionEnd={(e) => {
          if (fadingOut && e.propertyName === "opacity") onFadeComplete?.();
        }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            aria-label={`Mark "${todo.text}" as complete`}
            onClick={() => onDone(todo.id)}
            disabled={todo.done}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0 rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-zinc-950"
          >
            <span
              className="w-5 h-5 rounded-full border-2 border-gray-300 hover:border-green-400 motion-safe:transition-colors block"
              style={
                todo.done ? { opacity: 0.5, cursor: "not-allowed" } : undefined
              }
            />
          </button>
          <span
            className={`flex-1 min-w-0 break-words ${todo.done ? "line-through text-zinc-600" : ""}`}
          >
            {todo.text}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Delete "${todo.text}"`}
            onClick={() => onDelete(todo.id)}
            className="text-zinc-700 hover:text-red-500 min-h-[44px] min-w-[44px]"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        {isStale && (
          <span className="text-xs text-zinc-700 pl-8">
            Is this task still ongoing?
          </span>
        )}
      </li>
    );
  },
);
