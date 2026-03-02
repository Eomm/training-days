// frontend/src/components/TodoItem.tsx
import type { Todo } from "../types.js";
import { Trash2 } from "lucide-react";
import { Button } from "./ui/button.js";

interface TodoItemProps {
  todo: Todo;
  onDone: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TodoItem({ todo, onDone, onDelete }: TodoItemProps) {
  return (
    <li className="flex items-center gap-3 p-3 rounded-md border border-gray-200 bg-white">
      <button
        type="button"
        aria-label="Mark as done"
        onClick={() => onDone(todo.id)}
        className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0 hover:border-green-400 transition-colors"
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
    </li>
  );
}
