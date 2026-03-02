// frontend/src/components/TodoInput.tsx
import { useState } from "react";
import type { KeyboardEvent } from "react";
import { Button } from "./ui/button.js";
import { Input } from "./ui/input.js";

interface TodoInputProps {
  onAdd: (text: string) => void;
}

export function TodoInput({ onAdd }: TodoInputProps) {
  const [text, setText] = useState("");

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setText("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSubmit();
  }

  return (
    <div className="flex gap-2 w-full">
      <Input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a task…"
        className="flex-1"
      />
      <Button onClick={handleSubmit}>Add</Button>
    </div>
  );
}
