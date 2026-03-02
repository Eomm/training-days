// frontend/src/pages/HomePage.tsx
import { useState, useCallback, useEffect } from "react";
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
    pendingQuote,
    showPendingQuote,
  } = useTodos(userId);
  const [fadeComplete, setFadeComplete] = useState(false);

  const handleFadeComplete = useCallback(() => {
    removeDoneTodo();
    setFadeComplete(true);
  }, [removeDoneTodo]);

  // Show the quote once both fade is complete and the API has responded
  useEffect(() => {
    if (fadeComplete && pendingQuote) {
      showPendingQuote();
      setFadeComplete(false);
    }
  }, [fadeComplete, pendingQuote, showPendingQuote]);

  return (
    <div className="flex flex-col items-center gap-4 p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">MotivaTodo</h1>
      <TodoInput onAdd={addTodo} />
      <TodoList
        todos={todos}
        isLoading={isLoading}
        onDone={markDone}
        onDelete={deleteTodo}
        fadingOutId={lastDoneId}
        onFadeComplete={handleFadeComplete}
      />
      <QuoteModal quote={quote} onClose={clearQuote} />
    </div>
  );
}
