/**
 * Types + pure helpers for workspace text search (main + renderer tests).
 */

export interface WorkspaceSearchHit {
  filePath: string
  fileName: string
  lineNumber: number
  column: number
  lineText: string
}

export interface WorkspaceSearchOptions {
  query: string
  caseSensitive?: boolean
  maxHits?: number
  maxFiles?: number
  maxDepth?: number
  maxFileBytes?: number
}

export const DEFAULT_SEARCH_MAX_HITS = 80
export const DEFAULT_SEARCH_MAX_FILES = 400
export const DEFAULT_SEARCH_MAX_DEPTH = 6
export const DEFAULT_SEARCH_MAX_FILE_BYTES = 512 * 1024

/** Extensions searched as text when scanning the workspace. */
export const WORKSPACE_SEARCH_EXTENSIONS = new Set([
  'txt',
  'md',
  'markdown',
  'mdx',
  'log',
  'csv',
  'tsv',
  'json',
  'jsonc',
  'yml',
  'yaml',
  'xml',
  'html',
  'htm',
  'css',
  'scss',
  'js',
  'jsx',
  'ts',
  'tsx',
  'mjs',
  'cjs',
  'py',
  'rb',
  'go',
  'rs',
  'java',
  'c',
  'h',
  'cpp',
  'cs',
  'sh',
  'bash',
  'zsh',
  'ini',
  'cfg',
  'conf',
  'toml',
  'env',
  'sql',
  'rst'
])

export function isSearchableTextFileName(name: string): boolean {
  const lower = name.toLowerCase()
  if (lower === 'makefile' || lower === 'dockerfile' || lower === 'readme') return true
  const dot = name.lastIndexOf('.')
  if (dot <= 0 || dot === name.length - 1) return false
  return WORKSPACE_SEARCH_EXTENSIONS.has(name.slice(dot + 1).toLowerCase())
}

/**
 * Find all case-insensitive (default) occurrences of query in a single file body.
 */
export function searchInTextContent(
  content: string,
  filePath: string,
  fileName: string,
  query: string,
  options?: { caseSensitive?: boolean; maxHits?: number; already?: number }
): WorkspaceSearchHit[] {
  const q = query.trim()
  if (!q) return []
  const caseSensitive = options?.caseSensitive ?? false
  const maxHits = options?.maxHits ?? DEFAULT_SEARCH_MAX_HITS
  let remaining = maxHits - (options?.already ?? 0)
  if (remaining <= 0) return []

  const needle = caseSensitive ? q : q.toLowerCase()
  const hits: WorkspaceSearchHit[] = []
  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i += 1) {
    const lineText = lines[i] ?? ''
    const hay = caseSensitive ? lineText : lineText.toLowerCase()
    let from = 0
    while (from <= hay.length) {
      const idx = hay.indexOf(needle, from)
      if (idx === -1) break
      hits.push({
        filePath,
        fileName,
        lineNumber: i + 1,
        column: idx + 1,
        lineText: lineText.slice(0, 200)
      })
      remaining -= 1
      if (remaining <= 0) return hits
      from = idx + Math.max(1, needle.length)
    }
  }
  return hits
}

export interface TimelineEntryDTO {
  filePath: string
  title: string
  /** ISO timestamp of last modification (mtime or tab lastModified) */
  lastModified: string
  /** Workspace folder name or "Pessoal" / "Aba aberta" */
  workspaceLabel: string
  source: 'recent' | 'open-tab' | 'workspace'
}
