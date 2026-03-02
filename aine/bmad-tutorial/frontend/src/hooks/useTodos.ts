// frontend/src/hooks/useTodos.ts
import { useState, useEffect } from 'react'
import { apiFetch } from '../lib/api.ts'
import type { Todo } from '../types.ts'

export function useTodos(userId: string | null): {
  todos: Todo[]
  isLoading: boolean
  error: string | null
  addTodo: (text: string) => Promise<void>
  markDone: (id: string) => Promise<void>
  deleteTodo: (id: string) => Promise<void>
  quote: string | null
  clearQuote: () => void
  lastDoneId: string | null
  removeDoneTodo: () => void
} {
  const [todos, setTodos] = useState<Todo[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [quote, setQuote] = useState<string | null>(null)
  const [lastDoneId, setLastDoneId] = useState<string | null>(null)

  useEffect(() => {
    if (userId === null) return

    let cancelled = false
    setIsLoading(true)
    setError(null)

    apiFetch<Todo[]>('/todos')
      .then((data) => {
        if (!cancelled) setTodos(data)
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [userId])

  async function addTodo(text: string): Promise<void> {
    const tempId = crypto.randomUUID()
    const optimisticTodo: Todo = {
      id: tempId,
      userId: '',
      text,
      done: false,
      createdAt: new Date().toISOString(),
    }

    setTodos((prev) => [optimisticTodo, ...prev])

    try {
      const created = await apiFetch<Todo>('/todos', {
        method: 'POST',
        body: JSON.stringify({ text }),
      })
      setTodos((prev) => prev.map((t) => (t.id === tempId ? created : t)))
    } catch (err) {
      setTodos((prev) => prev.filter((t) => t.id !== tempId))
      setError(err instanceof Error ? err.message : 'Failed to add todo')
    }
  }

  async function markDone(id: string): Promise<void> {
    const previous = todos.find((t) => t.id === id)
    if (!previous) return

    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: true } : t)))

    try {
      const data = await apiFetch<{ todo: Todo; quote: string }>(
        '/todos/' + id,
        { method: 'PATCH', body: JSON.stringify({ done: true }) },
      )
      setTodos((prev) => prev.map((t) => (t.id === id ? data.todo : t)))
      setQuote(data.quote)
      setLastDoneId(id)
    } catch (err) {
      setTodos((prev) => prev.map((t) => (t.id === id ? previous : t)))
      setError(err instanceof Error ? err.message : 'Failed to update todo')
    }
  }

  async function deleteTodo(id: string): Promise<void> {
    const snapshot = todos

    setTodos((prev) => prev.filter((t) => t.id !== id))

    try {
      await apiFetch<void>('/todos/' + id, { method: 'DELETE' })
    } catch (err) {
      setTodos(snapshot)
      setError(err instanceof Error ? err.message : 'Failed to delete todo')
    }
  }

  function removeDoneTodo(): void {
    if (lastDoneId) {
      setTodos((prev) => prev.filter((t) => t.id !== lastDoneId))
      setLastDoneId(null)
    }
  }

  return { todos, isLoading, error, addTodo, markDone, deleteTodo, quote, clearQuote: () => setQuote(null), lastDoneId, removeDoneTodo }
}
