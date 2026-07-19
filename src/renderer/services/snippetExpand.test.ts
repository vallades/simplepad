import { describe, expect, it } from 'vitest'
import { tryExpandSnippetAtCursor } from './snippetExpand'
import { DEFAULT_SNIPPETS } from '../../shared/snippets'

describe('tryExpandSnippetAtCursor', () => {
  it('expands ;hoje at cursor', () => {
    const text = 'Data: ;hoje'
    const r = tryExpandSnippetAtCursor(text, text.length, DEFAULT_SNIPPETS, new Date(2026, 0, 5))
    expect(r).not.toBeNull()
    expect(r!.nextText).toBe('Data: 2026-01-05')
    expect(r!.cursorOffset).toBe('Data: 2026-01-05'.length)
  })

  it('returns null without trigger', () => {
    expect(tryExpandSnippetAtCursor('hello', 5, DEFAULT_SNIPPETS)).toBeNull()
  })

  it('expands checklist with multiline body', () => {
    const text = ';check'
    const r = tryExpandSnippetAtCursor(text, text.length, DEFAULT_SNIPPETS)
    expect(r?.nextText).toContain('- [ ]')
    expect(r?.trigger).toBe(';check')
  })
})
