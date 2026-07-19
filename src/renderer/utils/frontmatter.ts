/**
 * YAML frontmatter helpers for Markdown notes.
 * Full file content (with --- block) is the save/session source of truth;
 * the editor works on the body only.
 */

import matter from 'gray-matter'

export type FrontmatterData = Record<string, unknown>

export interface ParsedFrontmatter {
  hasFrontmatter: boolean
  data: FrontmatterData
  /** Markdown body without the YAML block (shown in the editor) */
  body: string
  /**
   * Original fence block `---\n...\n---` (no trailing newline after closing ---),
   * empty when absent.
   */
  rawFrontmatter: string
}

const FENCE_RE = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/

/**
 * Extract YAML frontmatter from a full document string.
 * Invalid / incomplete YAML fences are treated as plain content (no frontmatter).
 */
export function parseFrontmatter(raw: string): ParsedFrontmatter {
  const source = typeof raw === 'string' ? raw : ''
  if (!source.startsWith('---')) {
    return { hasFrontmatter: false, data: {}, body: source, rawFrontmatter: '' }
  }

  const fence = FENCE_RE.exec(source)
  if (!fence) {
    return { hasFrontmatter: false, data: {}, body: source, rawFrontmatter: '' }
  }

  try {
    const parsed = matter(source)
    const yamlInner = fence[1] ?? ''
    const rawFrontmatter = `---\n${yamlInner}\n---`
    // matter.content usually starts with a leading newline after the fence
    const body = typeof parsed.content === 'string' ? parsed.content.replace(/^\r?\n/, '') : ''
    const data =
      parsed.data && typeof parsed.data === 'object' && !Array.isArray(parsed.data)
        ? (parsed.data as FrontmatterData)
        : {}

    return {
      hasFrontmatter: true,
      data,
      body,
      rawFrontmatter
    }
  } catch {
    return { hasFrontmatter: false, data: {}, body: source, rawFrontmatter: '' }
  }
}

/** Recombine preserved frontmatter with an edited body for disk/session. */
export function joinFrontmatter(rawFrontmatter: string, body: string): string {
  if (!rawFrontmatter) return body
  const bodyPart = body ?? ''
  if (bodyPart.length === 0) return rawFrontmatter
  // Ensure single newline between fence and body
  return `${rawFrontmatter}\n${bodyPart.replace(/^\r?\n+/, '')}`
}

/**
 * Content shown in Monaco / plain editor.
 * Markdown: body only (frontmatter hidden). Plain text: full content.
 */
export function getEditorDocumentText(content: string, isMarkdown: boolean): string {
  if (!isMarkdown) return content
  return parseFrontmatter(content).body
}

/**
 * Build full document after the user edits the body in the editor.
 */
export function mergeEditorBodyIntoContent(
  previousFullContent: string,
  editorBody: string,
  isMarkdown: boolean
): string {
  if (!isMarkdown) return editorBody
  const { rawFrontmatter } = parseFrontmatter(previousFullContent)
  return joinFrontmatter(rawFrontmatter, editorBody)
}

/** Flatten a frontmatter value for display. */
export function formatFrontmatterValue(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (Array.isArray(value)) {
    return value
      .map((v) => formatFrontmatterValue(v))
      .filter(Boolean)
      .join(', ')
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return String(value)
}

/** Detect tags-like arrays for badge rendering. */
export function isTagList(key: string, value: unknown): value is unknown[] {
  if (!Array.isArray(value)) return false
  const k = key.toLowerCase()
  if (k === 'tags' || k === 'tag' || k === 'labels' || k === 'label') return true
  return value.every((v) => typeof v === 'string' || typeof v === 'number')
}

export function entriesFromFrontmatter(
  data: FrontmatterData
): Array<{ key: string; value: unknown }> {
  return Object.keys(data)
    .sort((a, b) => a.localeCompare(b))
    .map((key) => ({ key, value: data[key] }))
}
