import { describe, expect, it } from 'vitest'
import { createEmptySession, sanitizeSession } from './sessionSanitize'
import { SESSION_VERSION } from './session'

describe('sanitizeSession', () => {
  it('returns null for invalid payloads', () => {
    expect(sanitizeSession(null)).toBeNull()
    expect(sanitizeSession({})).toBeNull()
    expect(sanitizeSession({ tabs: 'nope' })).toBeNull()
    expect(sanitizeSession({ tabs: [] })).toBeNull()
  })

  it('normalizes a valid session', () => {
    const raw = {
      version: SESSION_VERSION,
      activeTabId: 'a',
      tabs: [
        {
          id: 'a',
          title: 'nota.txt',
          content: 'hello',
          isDirty: true,
          isMarkdown: false,
          filePath: '/tmp/nota.txt',
          cursorPosition: { lineNumber: 2, column: 4 },
          scrollPosition: 10,
          lastModified: '2026-01-01T00:00:00.000Z'
        },
        {
          id: 'b',
          content: 123
        }
      ]
    }

    const session = sanitizeSession(raw)
    expect(session).not.toBeNull()
    expect(session!.tabs).toHaveLength(2)
    expect(session!.tabs[0]?.title).toBe('nota.txt')
    expect(session!.tabs[0]?.content).toBe('hello')
    expect(session!.tabs[1]?.title).toBe('Sem título')
    expect(session!.tabs[1]?.content).toBe('')
    expect(session!.tabs[1]?.cursorPosition).toEqual({ lineNumber: 1, column: 1 })
    expect(session!.activeTabId).toBe('a')
  })

  it('falls back activeTabId when missing from tabs', () => {
    const session = sanitizeSession({
      tabs: [{ id: 'only', content: 'x' }],
      activeTabId: 'ghost'
    })
    expect(session?.activeTabId).toBe('only')
  })

  it('createEmptySession has no tabs', () => {
    const empty = createEmptySession()
    expect(empty.tabs).toEqual([])
    expect(empty.activeTabId).toBeNull()
  })
})
