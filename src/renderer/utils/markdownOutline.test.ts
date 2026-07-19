import { describe, expect, it } from 'vitest'
import { extractMarkdownOutline, outlineToHtmlList } from './markdownOutline'

describe('extractMarkdownOutline', () => {
  it('extracts ATX headings with line numbers', () => {
    const md = `# Title

intro

## Section

### Nested

## Other
`
    const outline = extractMarkdownOutline(md)
    expect(outline).toEqual([
      expect.objectContaining({ level: 1, text: 'Title', lineNumber: 1 }),
      expect.objectContaining({ level: 2, text: 'Section', lineNumber: 5 }),
      expect.objectContaining({ level: 3, text: 'Nested', lineNumber: 7 }),
      expect.objectContaining({ level: 2, text: 'Other', lineNumber: 9 })
    ])
  })

  it('ignores headings inside fenced code blocks', () => {
    const md = `# Real

\`\`\`md
# Fake
\`\`\`

## Also real
`
    const outline = extractMarkdownOutline(md)
    expect(outline.map((h) => h.text)).toEqual(['Real', 'Also real'])
  })

  it('returns empty for plain text', () => {
    expect(extractMarkdownOutline('hello\nworld')).toEqual([])
  })
})

describe('outlineToHtmlList', () => {
  it('builds a navigable list', () => {
    const html = outlineToHtmlList([
      { id: 'h-1-1-a', level: 1, text: 'A', lineNumber: 1 },
      { id: 'h-2-2-b', level: 2, text: 'B <x>', lineNumber: 2 }
    ])
    expect(html).toContain('Outline')
    expect(html).toContain('href="#h-1-1-a"')
    expect(html).toContain('B &lt;x&gt;')
  })
})

describe('outline update on content change', () => {
  it('re-extracts headings when source changes (simulates debounced update)', () => {
    const first = extractMarkdownOutline('# One\n')
    expect(first).toHaveLength(1)
    expect(first[0]?.text).toBe('One')
    expect(first[0]?.lineNumber).toBe(1)

    const second = extractMarkdownOutline('# One\n\n## Two\n\n### Three\n')
    expect(second.map((h) => h.text)).toEqual(['One', 'Two', 'Three'])
    expect(second.map((h) => h.lineNumber)).toEqual([1, 3, 5])
  })

  it('reveal targets match 1-based Monaco lines', () => {
    const outline = extractMarkdownOutline('line1\n\n## Jump here\n')
    const h = outline[0]
    expect(h).toBeDefined()
    // Editor.revealPositionInCenter uses this lineNumber
    expect(h!.lineNumber).toBe(3)
    expect(h!.level).toBe(2)
  })
})

// keep vi available for future fake timers if needed
