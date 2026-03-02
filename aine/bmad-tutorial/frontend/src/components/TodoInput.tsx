// frontend/src/components/TodoInput.tsx
import { useState, useRef } from "react";
import type { KeyboardEvent, RefObject } from "react";
import { Button } from "./ui/button.js";
import { Input } from "./ui/input.js";

interface TodoInputProps {
  onAdd: (text: string) => void;
  inputRef?: RefObject<HTMLInputElement | null>;
}

export function TodoInput({ onAdd, inputRef: externalRef }: TodoInputProps) {
  const [text, setText] = useState("");
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = externalRef ?? internalRef;

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setText("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleSubmit();
  }

  return (
    <div className="flex gap-2 w-full">
      <Input
        id="task-input"
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add a task…"
        className="flex-1 min-h-[44px]"
      />
      <Button onClick={handleSubmit} className="min-h-[44px] min-w-[44px]">
        Add
      </Button>
    </div>
  );
}
