import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export type ExportTheme = 'light' | 'dark'

const PREVIEW_CSS = `
  body {
    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    line-height: 1.65;
    max-width: 48rem;
    margin: 0 auto;
    padding: 2rem 1.5rem;
    font-size: 15px;
  }
  body.theme-light { background: #fff; color: #18181b; }
  body.theme-dark { background: #09090b; color: #f4f4f5; }
  h1, h2, h3, h4 { line-height: 1.25; margin: 1.4em 0 0.5em; font-weight: 650; }
  h1 { font-size: 1.75rem; border-bottom: 1px solid #e4e4e7; padding-bottom: 0.3em; }
  h2 { font-size: 1.4rem; }
  h3 { font-size: 1.15rem; }
  body.theme-dark h1 { border-bottom-color: #3f3f46; }
  p, ul, ol, blockquote, pre, table { margin: 0.75em 0; }
  ul, ol { padding-left: 1.5em; }
  a { color: #2563eb; }
  body.theme-dark a { color: #60a5fa; }
  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.9em;
    background: #f4f4f5;
    padding: 0.12em 0.35em;
    border-radius: 4px;
  }
  body.theme-dark code { background: #27272a; }
  pre {
    background: #f4f4f5;
    padding: 0.85rem 1rem;
    border-radius: 8px;
    overflow-x: auto;
  }
  body.theme-dark pre { background: #18181b; }
  pre code { background: transparent; padding: 0; }
  blockquote {
    border-left: 3px solid #d4d4d8;
    margin-left: 0;
    padding-left: 1rem;
    color: #52525b;
  }
  body.theme-dark blockquote { border-left-color: #52525b; color: #a1a1aa; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #e4e4e7; padding: 0.4rem 0.65rem; text-align: left; }
  body.theme-dark th, body.theme-dark td { border-color: #3f3f46; }
  th { background: #fafafa; }
  body.theme-dark th { background: #18181b; }
  hr { border: none; border-top: 1px solid #e4e4e7; margin: 1.5em 0; }
  body.theme-dark hr { border-top-color: #3f3f46; }
  img { max-width: 100%; }
  @media print {
    body { max-width: none; padding: 0; background: #fff !important; color: #000 !important; }
    a { color: #000; text-decoration: underline; }
  }
`.trim()

/** Renders Markdown → HTML fragment (GFM). */
export function markdownToHtmlFragment(markdown: string): string {
  const source = typeof markdown === 'string' ? markdown : ''
  return renderToStaticMarkup(createElement(ReactMarkdown, { remarkPlugins: [remarkGfm] }, source))
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Full standalone HTML document for export / print-to-PDF.
 * Non-markdown tabs are wrapped in <pre>.
 */
export function buildExportHtmlDocument(options: {
  title: string
  content: string
  isMarkdown: boolean
  theme?: ExportTheme
}): string {
  const theme = options.theme ?? 'light'
  const title = escapeHtml(options.title || 'SimplePad')
  const body = options.isMarkdown
    ? markdownToHtmlFragment(options.content)
    : `<pre style="white-space:pre-wrap;word-break:break-word;font-family:ui-monospace,Menlo,monospace;font-size:13px;">${escapeHtml(options.content)}</pre>`

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>${PREVIEW_CSS}</style>
</head>
<body class="theme-${theme}">
${body}
</body>
</html>`
}

/** Default export filename from tab title (strips extension, adds new one). */
export function exportDefaultFileName(title: string, format: 'html' | 'pdf'): string {
  const base =
    (title || 'documento').replace(/\.(md|markdown|txt|html|pdf)$/i, '').trim() || 'documento'
  return `${base}.${format}`
}
