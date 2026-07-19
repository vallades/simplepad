/**
 * Extract ATX headings (# …) from Markdown for the Outline panel.
 * Line numbers are 1-based (Monaco-compatible).
 */

export interface OutlineHeading {
  id: string
  level: number
  text: string
  lineNumber: number
}

const ATX_HEADING = /^(#{1,6})\s+(.+?)\s*#*\s*$/

/**
 * Pure parser — ignores fenced code blocks so ``` # not a heading ``` is skipped.
 */
export function extractMarkdownOutline(source: string): OutlineHeading[] {
  if (!source) return []

  const lines = source.split(/\r?\n/)
  const headings: OutlineHeading[] = []
  let inFence = false
  let fenceMarker = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? ''
    const fenceMatch = /^(`{3,}|~{3,})/.exec(line)
    if (fenceMatch) {
      const marker = fenceMatch[1] ?? ''
      if (!inFence) {
        inFence = true
        fenceMarker = marker[0] ?? '`'
      } else if (marker[0] === fenceMarker) {
        inFence = false
        fenceMarker = ''
      }
      continue
    }
    if (inFence) continue

    const m = ATX_HEADING.exec(line)
    if (!m) continue
    const level = (m[1] ?? '#').length
    const text = (m[2] ?? '').trim()
    if (!text) continue
    const lineNumber = i + 1
    headings.push({
      id: `h-${lineNumber}-${level}-${slugify(text)}`,
      level,
      text,
      lineNumber
    })
  }

  return headings
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

/** Build a simple HTML outline list for PDF export. */
export function outlineToHtmlList(headings: OutlineHeading[]): string {
  if (headings.length === 0) return ''
  const items = headings
    .map((h) => {
      const pad = (h.level - 1) * 12
      return `<li style="margin-left:${pad}px;list-style:none;"><a href="#${escapeAttr(h.id)}">${escapeHtml(h.text)}</a></li>`
    })
    .join('\n')
  return `<nav class="export-outline" aria-label="Outline"><p><strong>Outline</strong></p><ul style="padding-left:0;margin:0.5em 0 1.5em;">${items}</ul></nav>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeAttr(text: string): string {
  return escapeHtml(text)
}
