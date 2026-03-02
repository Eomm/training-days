// frontend/src/lib/identity.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { getUserId, setUserId } from './identity.ts'

describe('identity', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('getUserId returns null when key is absent', () => {
    expect(getUserId()).toBeNull()
  })

  it('getUserId returns stored value after setUserId', () => {
    setUserId('abc-123')
    expect(getUserId()).toBe('abc-123')
  })

  it('setUserId writes to localStorage with correct key', () => {
    setUserId('xyz-456')
    expect(localStorage.getItem('motivatodo_user_id')).toBe('xyz-456')
  })
})
