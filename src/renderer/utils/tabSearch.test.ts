import { describe, expect, it } from 'vitest'
import { searchInTabs } from './tabSearch'

describe('searchInTabs', () => {
  const tabs = [
    { id: 'a', title: 'a.md', content: 'Hello world\nfoo bar' },
    { id: 'b', title: 'b.txt', content: 'hello again\nnothing' }
  ]

  it('returns empty for blank query', () => {
    expect(searchInTabs(tabs, '  ')).toEqual([])
  })

  it('finds case-insensitive matches across tabs', () => {
    const hits = searchInTabs(tabs, 'hello')
    expect(hits).toHaveLength(2)
    expect(hits[0]?.tabId).toBe('a')
    expect(hits[0]?.lineNumber).toBe(1)
    expect(hits[1]?.tabId).toBe('b')
  })

  it('respects caseSensitive', () => {
    const hits = searchInTabs(tabs, 'Hello', { caseSensitive: true })
    expect(hits).toHaveLength(1)
    expect(hits[0]?.tabId).toBe('a')
  })

  it('caps maxHits', () => {
    const many = [{ id: 'x', title: 'x', content: 'aa aa aa aa' }]
    const hits = searchInTabs(many, 'aa', { maxHits: 2 })
    expect(hits).toHaveLength(2)
  })
})
