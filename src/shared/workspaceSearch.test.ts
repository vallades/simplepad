import { describe, expect, it } from 'vitest'
import { isSearchableTextFileName, searchInTextContent } from './workspaceSearch'

describe('isSearchableTextFileName', () => {
  it('accepts common text extensions', () => {
    expect(isSearchableTextFileName('note.md')).toBe(true)
    expect(isSearchableTextFileName('a.TS')).toBe(true)
    expect(isSearchableTextFileName('README')).toBe(true)
  })

  it('rejects binaries', () => {
    expect(isSearchableTextFileName('photo.png')).toBe(false)
    expect(isSearchableTextFileName('a.pdf')).toBe(false)
  })
})

describe('searchInTextContent', () => {
  it('finds line and column', () => {
    const hits = searchInTextContent('hello\nfoo bar foo\n', '/x/a.md', 'a.md', 'foo')
    expect(hits).toHaveLength(2)
    expect(hits[0]).toMatchObject({ lineNumber: 2, column: 1, fileName: 'a.md' })
    expect(hits[1]?.column).toBe(9)
  })

  it('respects maxHits', () => {
    const hits = searchInTextContent('a a a a', '/x/a.txt', 'a.txt', 'a', { maxHits: 2 })
    expect(hits).toHaveLength(2)
  })

  it('returns empty for blank query', () => {
    expect(searchInTextContent('x', '/a', 'a', '  ')).toEqual([])
  })
})
