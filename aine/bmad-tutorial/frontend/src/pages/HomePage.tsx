// frontend/src/pages/HomePage.tsx
import { useGuestIdentity } from "../hooks/useGuestIdentity.ts";
import { useTodos } from "../hooks/useTodos.ts";
import { TodoInput } from "../components/TodoInput.tsx";
import { TodoList } from "../components/TodoList.tsx";
import { QuoteModal } from "../components/QuoteModal.tsx";

export function HomePage() {
  const { userId } = useGuestIdentity();
  const { todos, isLoading, addTodo, markDone, deleteTodo, quote, clearQuote } =
    useTodos(userId);

  return (
    <div className="flex flex-col items-center gap-4 p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">MotivaTodo</h1>
      <TodoInput onAdd={addTodo} />
      <TodoList
        todos={todos}
        isLoading={isLoading}
        onDone={markDone}
        onDelete={deleteTodo}
      />
      <QuoteModal quote={quote} onClose={clearQuote} />
    </div>
  );
}
