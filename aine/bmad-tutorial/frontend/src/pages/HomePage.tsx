// frontend/src/pages/HomePage.tsx
import { useState, useCallback } from "react";
import { useGuestIdentity } from "../hooks/useGuestIdentity.ts";
import { useTodos } from "../hooks/useTodos.ts";
import { TodoInput } from "../components/TodoInput.tsx";
import { TodoList } from "../components/TodoList.tsx";
import { QuoteModal } from "../components/QuoteModal.tsx";

export function HomePage() {
  const { userId } = useGuestIdentity();
  const {
    todos,
    isLoading,
    addTodo,
    markDone,
    deleteTodo,
    quote,
    clearQuote,
    lastDoneId,
    removeDoneTodo,
  } = useTodos(userId);
  const [fadingOutId, setFadingOutId] = useState<string | null>(null);

  const handleQuoteClose = useCallback(() => {
    setFadingOutId(lastDoneId);
    clearQuote();
  }, [lastDoneId, clearQuote]);

  const handleFadeComplete = useCallback(() => {
    removeDoneTodo();
    setFadingOutId(null);
  }, [removeDoneTodo]);

  return (
    <div className="flex flex-col items-center gap-4 p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">MotivaTodo</h1>
      <TodoInput onAdd={addTodo} />
      <TodoList
        todos={todos}
        isLoading={isLoading}
        onDone={markDone}
        onDelete={deleteTodo}
        fadingOutId={fadingOutId}
        onFadeComplete={handleFadeComplete}
      />
      <QuoteModal quote={quote} onClose={handleQuoteClose} />
    </div>
  );
}
