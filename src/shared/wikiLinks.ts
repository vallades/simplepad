/**
 * Internal note links: [[Note Name]] / [[Note Name|label]]
 */

export interface WikiLinkMatch {
  /** Raw target inside brackets (before |) */
  target: string
  /** Display label (alias or target) */
  label: string
  /** Absolute start index in source text */
  start: number
  /** Absolute end index (exclusive) */
  end: number
  /** Full match including brackets */
  raw: string
}

export interface BacklinkSource {
  id: string
  title: string
  content: string
  filePath?: string
}

export interface BacklinkHit {
  sourceId: string
  sourceTitle: string
  filePath?: string
  /** One sample line containing the link */
  lineText: string
  lineNumber: number
}

/** Normalize for comparison: trim, drop .md/.markdown, collapse spaces, lower-case */
export function normalizeNoteKey(name: string): string {
  let s = name.trim()
  s = s.replace(/\.markdown$/i, '').replace(/\.md$/i, '')
  s = s.replace(/\s+/g, ' ').trim().toLowerCase()
  return s
}

/** Extract title key from a file path or tab title */
export function noteKeyFromPathOrTitle(pathOrTitle: string): string {
  const base = pathOrTitle.split(/[/\\]/).pop() ?? pathOrTitle
  return normalizeNoteKey(base)
}

const WIKI_RE = /\[\[([^\]|#\n]+)(?:\|([^\]]+))?\]\]/g

export function extractWikiLinks(content: string): WikiLinkMatch[] {
  const results: WikiLinkMatch[] = []
  const re = new RegExp(WIKI_RE.source, 'g')
  let m: RegExpExecArray | null
  while ((m = re.exec(content)) !== null) {
    const target = (m[1] ?? '').trim()
    if (!target) continue
    const label = (m[2] ?? target).trim()
    results.push({
      target,
      label,
      start: m.index,
      end: m.index + m[0].length,
      raw: m[0]
    })
  }
  return results
}

/**
 * Rewrite [[Target]] / [[Target|label]] to markdown links [label](wiki:Target)
 * for Preview rendering.
 */
export function wikiLinksToMarkdown(content: string): string {
  return content.replace(WIKI_RE, (_full, target: string, alias?: string) => {
    const t = String(target).trim()
    if (!t) return _full
    const label = (alias ?? t).trim() || t
    return `[${label}](wiki:${encodeURIComponent(t)})`
  })
}

/**
 * Find documents that link to `noteTitle` via [[...]].
 */
export function findBacklinks(noteTitle: string, sources: BacklinkSource[]): BacklinkHit[] {
  const key = normalizeNoteKey(noteTitle)
  if (!key) return []
  const hits: BacklinkHit[] = []

  for (const src of sources) {
    // Don't list self as backlink
    if (normalizeNoteKey(src.title) === key) continue
    if (src.filePath && noteKeyFromPathOrTitle(src.filePath) === key) continue

    const links = extractWikiLinks(src.content)
    const pointsHere = links.some((l) => normalizeNoteKey(l.target) === key)
    if (!pointsHere) continue

    const lines = src.content.split('\n')
    let lineNumber = 1
    let lineText = ''
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i] ?? ''
      if (extractWikiLinks(line).some((l) => normalizeNoteKey(l.target) === key)) {
        lineNumber = i + 1
        lineText = line.trim().slice(0, 160)
        break
      }
    }
    hits.push({
      sourceId: src.id,
      sourceTitle: src.title,
      filePath: src.filePath,
      lineText: lineText || src.title,
      lineNumber
    })
  }

  return hits
}

/** Titles suggested while typing after `[[` (prefix match). */
export function filterNoteSuggestions(query: string, candidates: string[], limit = 12): string[] {
  const q = normalizeNoteKey(query)
  const seen = new Set<string>()
  const out: string[] = []
  for (const c of candidates) {
    const key = normalizeNoteKey(c)
    if (!key || seen.has(key)) continue
    if (q && !key.includes(q)) continue
    seen.add(key)
    out.push(c)
    if (out.length >= limit) break
  }
  return out
}
