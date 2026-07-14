import { describe, expect, it } from 'vitest'
import {
  buildExportHtmlDocument,
  escapeHtml,
  exportDefaultFileName,
  markdownToHtmlFragment
} from './markdownExport'

describe('markdownToHtmlFragment', () => {
  it('renders headings and emphasis', () => {
    const html = markdownToHtmlFragment('# Título\n\n**negrito** e *itálico*')
    expect(html).toContain('<h1')
    expect(html).toContain('Título')
    expect(html).toMatch(/<strong>negrito<\/strong>/)
    expect(html).toMatch(/<em>itálico<\/em>/)
  })

  it('supports GFM tables and task lists', () => {
    const md = `| A | B |
| - | - |
| 1 | 2 |

- [x] feito
- [ ] pendente
`
    const html = markdownToHtmlFragment(md)
    expect(html).toContain('<table>')
    expect(html).toContain('<th>')
    expect(html).toMatch(/checkbox|task-list|type="checkbox"|input/i)
  })

  it('renders fenced code blocks', () => {
    const html = markdownToHtmlFragment('```js\nconst x = 1\n```')
    expect(html).toContain('<pre>')
    expect(html).toContain('<code')
    expect(html).toContain('const x = 1')
  })

  it('handles empty input', () => {
    expect(markdownToHtmlFragment('')).toBe('')
  })
})

describe('buildExportHtmlDocument', () => {
  it('wraps markdown in a full document with theme', () => {
    const doc = buildExportHtmlDocument({
      title: 'Nota <test>',
      content: '# Hello',
      isMarkdown: true,
      theme: 'dark'
    })
    expect(doc).toContain('<!DOCTYPE html>')
    expect(doc).toContain('Nota &lt;test&gt;')
    expect(doc).toContain('theme-dark')
    expect(doc).toContain('<h1')
  })

  it('escapes plain text when not markdown', () => {
    const doc = buildExportHtmlDocument({
      title: 'raw',
      content: '<script>alert(1)</script>',
      isMarkdown: false,
      theme: 'light'
    })
    expect(doc).toContain('&lt;script&gt;')
    expect(doc).not.toContain('<script>alert')
  })
})

describe('export helpers', () => {
  it('escapes HTML entities', () => {
    expect(escapeHtml('a&b<"x">')).toBe('a&amp;b&lt;&quot;x&quot;&gt;')
  })

  it('builds default export file names', () => {
    expect(exportDefaultFileName('notas.md', 'html')).toBe('notas.html')
    expect(exportDefaultFileName('Sem título 1', 'pdf')).toBe('Sem título 1.pdf')
  })
})
