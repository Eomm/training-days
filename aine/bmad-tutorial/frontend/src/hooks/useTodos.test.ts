// frontend/src/hooks/useTodos.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTodos } from './useTodos.ts'
import type { Todo } from '../types.ts'

const makeTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: crypto.randomUUID(),
  userId: 'user-1',
  text: 'Test task',
  done: false,
  createdAt: new Date().toISOString(),
  ...overrides,
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useTodos — fetch on mount', () => {
  it('starts with isLoading=false and empty todos when userId is null', () => {
    const { result } = renderHook(() => useTodos(null))
    expect(result.current.isLoading).toBe(false)
    expect(result.current.todos).toEqual([])
  })

  it('fetches todos on mount when userId is provided', async () => {
    const todos = [makeTodo({ text: 'Fetched task' })]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(todos),
    }))

    const { result } = renderHook(() => useTodos('user-1'))
    expect(result.current.isLoading).toBe(true)

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.todos).toEqual(todos)
  })

  it('sets error state when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))

    const { result } = renderHook(() => useTodos('user-1'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toMatch(/HTTP 500/)
  })
})

describe('useTodos — addTodo', () => {
  it('optimistically prepends todo then replaces with server response', async () => {
    const serverTodo = makeTodo({ id: 'server-id', text: 'Buy milk' })
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) })  // initial GET
      .mockResolvedValueOnce({ ok: true, status: 201, json: () => Promise.resolve(serverTodo) }), // POST
    )

    const { result } = renderHook(() => useTodos('user-1'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.addTodo('Buy milk')
    })

    expect(result.current.todos).toHaveLength(1)
    expect(result.current.todos[0].id).toBe('server-id')
    expect(result.current.todos[0].text).toBe('Buy milk')
  })

  it('rolls back optimistic todo on error', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([]) })
      .mockResolvedValueOnce({ ok: false, status: 500 }),
    )

    const { result } = renderHook(() => useTodos('user-1'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    await act(async () => {
      await result.current.addTodo('Should rollback')
    })

    expect(result.current.todos).toHaveLength(0)
    expect(result.current.error).toMatch(/HTTP 500/)
  })
})

describe('useTodos — markDone', () => {
  it('optimistically marks done and sets quote and lastDoneId on success', async () => {
    const todo = makeTodo({ id: 'todo-1', done: false })
    const updatedTodo = { ...todo, done: true }
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([todo]) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ todo: updatedTodo, quote: 'Great job!' }) }),
    )

    const { result } = renderHook(() => useTodos('user-1'))
    await waitFor(() => expect(result.current.todos).toHaveLength(1))

    await act(async () => {
      await result.current.markDone('todo-1')
    })

    expect(result.current.todos[0].done).toBe(true)
    expect(result.current.pendingQuote).toBe('Great job!')
    expect(result.current.quote).toBeNull()
    expect(result.current.lastDoneId).toBe('todo-1')
  })

  it('rolls back done state on error', async () => {
    const todo = makeTodo({ id: 'todo-1', done: false })
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([todo]) })
      .mockResolvedValueOnce({ ok: false, status: 403 }),
    )

    const { result } = renderHook(() => useTodos('user-1'))
    await waitFor(() => expect(result.current.todos).toHaveLength(1))

    await act(async () => {
      await result.current.markDone('todo-1')
    })

    expect(result.current.todos[0].done).toBe(false)
    expect(result.current.error).toMatch(/HTTP 403/)
  })

  it('removeDoneTodo removes the last-done item and showPendingQuote reveals the quote', async () => {
    const todo = makeTodo({ id: 'todo-1', done: false })
    const updatedTodo = { ...todo, done: true }
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([todo]) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({ todo: updatedTodo, quote: 'Nice!' }) }),
    )

    const { result } = renderHook(() => useTodos('user-1'))
    await waitFor(() => expect(result.current.todos).toHaveLength(1))

    await act(async () => {
      await result.current.markDone('todo-1')
    })

    expect(result.current.lastDoneId).toBe('todo-1')
    expect(result.current.pendingQuote).toBe('Nice!')
    expect(result.current.quote).toBeNull()

    act(() => {
      result.current.removeDoneTodo()
      result.current.showPendingQuote()
    })

    expect(result.current.todos).toHaveLength(0)
    expect(result.current.lastDoneId).toBeNull()
    expect(result.current.quote).toBe('Nice!')
    expect(result.current.pendingQuote).toBeNull()
  })
})

describe('useTodos — deleteTodo', () => {
  it('optimistically removes todo on success', async () => {
    const todo = makeTodo({ id: 'todo-1' })
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([todo]) })
      .mockResolvedValueOnce({ ok: true, status: 204 }),
    )

    const { result } = renderHook(() => useTodos('user-1'))
    await waitFor(() => expect(result.current.todos).toHaveLength(1))

    await act(async () => {
      await result.current.deleteTodo('todo-1')
    })

    expect(result.current.todos).toHaveLength(0)
  })

  it('restores todo on delete error', async () => {
    const todo = makeTodo({ id: 'todo-1' })
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve([todo]) })
      .mockResolvedValueOnce({ ok: false, status: 403 }),
    )

    const { result } = renderHook(() => useTodos('user-1'))
    await waitFor(() => expect(result.current.todos).toHaveLength(1))

    await act(async () => {
      await result.current.deleteTodo('todo-1')
    })

    expect(result.current.todos).toHaveLength(1)
    expect(result.current.error).toMatch(/HTTP 403/)
  })
})

describe('useTodos — retryFetch', () => {
  it('re-fetches todos when retryFetch is called after an error', async () => {
    const todos = [makeTodo({ text: 'Recovered task' })]
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })               // first fetch fails
      .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(todos) }) // retry succeeds

    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(() => useTodos('user-1'))
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.error).toMatch(/HTTP 500/)

    await act(async () => {
      result.current.retryFetch()
    })

    await waitFor(() => expect(result.current.todos).toHaveLength(1))
    expect(result.current.todos[0].text).toBe('Recovered task')
    expect(result.current.error).toBeNull()
  })
})
