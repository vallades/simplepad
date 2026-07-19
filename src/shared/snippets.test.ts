import { describe, expect, it } from 'vitest'
import {
  createDefaultSnippetsFile,
  expandSnippetBody,
  matchSnippetTrigger,
  sanitizeSnippetsFile
} from './snippets'

describe('sanitizeSnippetsFile', () => {
  it('seeds defaults when empty', () => {
    const f = sanitizeSnippetsFile(null)
    expect(f.snippets.length).toBeGreaterThanOrEqual(5)
    expect(f.snippets.some((s) => s.trigger === ';hoje')).toBe(true)
  })

  it('keeps valid custom snippets', () => {
    const f = sanitizeSnippetsFile({
      version: 1,
      snippets: [{ id: 'x', trigger: ';x', name: 'X', body: 'hello$0' }, { bad: true }]
    })
    expect(f.snippets).toHaveLength(1)
    expect(f.snippets[0]?.trigger).toBe(';x')
  })
})

describe('expandSnippetBody', () => {
  it('expands date/time and cursor marker', () => {
    const { text, cursorOffset } = expandSnippetBody(
      'D={{date}} T={{time}}|$0|',
      new Date(2026, 6, 19, 14, 5)
    )
    expect(text).toContain('2026-07-19')
    expect(text).toContain('14:05')
    expect(text).not.toContain('$0')
    expect(text).toContain('|')
    expect(cursorOffset).toBe(text.indexOf('|') + 1)
  })
})

describe('matchSnippetTrigger', () => {
  const snippets = createDefaultSnippetsFile().snippets

  it('matches ;hoje at end of prefix', () => {
    const m = matchSnippetTrigger('nota ;hoje', snippets)
    expect(m?.snippet.trigger).toBe(';hoje')
    expect(m?.triggerStart).toBe(5)
  })

  it('prefers longer triggers', () => {
    const list = [
      { id: 'a', trigger: ';a', name: 'A', body: 'a' },
      { id: 'ab', trigger: ';ab', name: 'AB', body: 'ab' }
    ]
    const m = matchSnippetTrigger('x;ab', list)
    expect(m?.snippet.trigger).toBe(';ab')
  })

  it('returns null without match', () => {
    expect(matchSnippetTrigger('hello', snippets)).toBeNull()
  })
})
