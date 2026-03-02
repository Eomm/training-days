// frontend/src/pages/HomePage.tsx
import { useState, useCallback, useEffect, useRef } from "react";
import { useGuestIdentity } from "../hooks/useGuestIdentity.ts";
import { useTodos } from "../hooks/useTodos.ts";
import { TodoInput } from "../components/TodoInput.tsx";
import { TodoList } from "../components/TodoList.tsx";
import { QuoteModal } from "../components/QuoteModal.tsx";
import { RegistrationNudge } from "../components/RegistrationNudge.tsx";

export function HomePage() {
  const { userId } = useGuestIdentity();
  const {
    todos,
    isLoading,
    error,
    retryFetch,
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
  const inputRef = useRef<HTMLInputElement>(null);

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
    <div className="flex flex-col items-center gap-4 py-4 lg:py-8 w-full px-4 lg:max-w-lg lg:mx-auto">
      <h1 className="text-2xl font-bold">MotivaTodo</h1>
      {error && (
        <div
          role="alert"
          className="w-full rounded-md bg-red-50 border border-red-200 p-3 flex items-center justify-between gap-3"
        >
          <p className="text-sm text-red-800">
            Couldn&rsquo;t connect — your tasks are safe. Please try again.
          </p>
          <button
            type="button"
            onClick={retryFetch}
            className="text-sm font-medium text-red-700 hover:text-red-900 shrink-0"
          >
            Retry
          </button>
        </div>
      )}
      <TodoInput onAdd={addTodo} inputRef={inputRef} />
      <RegistrationNudge todoCount={todos.filter((t) => !t.done).length} />
      <TodoList
        todos={todos}
        isLoading={isLoading}
        onDone={markDone}
        onDelete={deleteTodo}
        fadingOutId={lastDoneId}
        onFadeComplete={handleFadeComplete}
        inputRef={inputRef}
      />
      <QuoteModal quote={quote} onClose={clearQuote} />
    </div>
  );
}
