import { describe, expect, it } from 'vitest'
import {
  extractWikiLinks,
  findBacklinks,
  filterNoteSuggestions,
  normalizeNoteKey,
  noteKeyFromPathOrTitle,
  wikiLinksToMarkdown
} from './wikiLinks'

describe('normalizeNoteKey', () => {
  it('strips md and lowercases', () => {
    expect(normalizeNoteKey('  My Note.MD ')).toBe('my note')
    expect(noteKeyFromPathOrTitle('/vault/Ideas.md')).toBe('ideas')
  })
})

describe('extractWikiLinks', () => {
  it('parses target and alias', () => {
    const links = extractWikiLinks('See [[Daily Note]] and [[Foo|bar]].')
    expect(links).toHaveLength(2)
    expect(links[0]).toMatchObject({ target: 'Daily Note', label: 'Daily Note' })
    expect(links[1]).toMatchObject({ target: 'Foo', label: 'bar' })
  })

  it('returns empty when none', () => {
    expect(extractWikiLinks('no links here')).toEqual([])
  })
})

describe('wikiLinksToMarkdown', () => {
  it('converts to wiki: links', () => {
    const md = wikiLinksToMarkdown('Go [[Hello World|hi]]')
    expect(md).toContain('[hi](wiki:Hello%20World)')
  })
})

describe('findBacklinks', () => {
  it('finds sources linking to note', () => {
    const hits = findBacklinks('Target', [
      { id: '1', title: 'A', content: 'link [[Target]] here' },
      { id: '2', title: 'Target', content: 'self [[Target]]' },
      { id: '3', title: 'B', content: 'nope' }
    ])
    expect(hits).toHaveLength(1)
    expect(hits[0]?.sourceTitle).toBe('A')
    expect(hits[0]?.lineNumber).toBe(1)
  })
})

describe('filterNoteSuggestions', () => {
  it('filters by prefix/substring', () => {
    const r = filterNoteSuggestions('dai', ['Daily', 'Ideas', 'Daily Note'])
    expect(r.map((x) => x.toLowerCase())).toContain('daily')
    expect(r.map((x) => x.toLowerCase())).toContain('daily note')
  })
})
