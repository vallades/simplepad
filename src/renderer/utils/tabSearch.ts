/**
 * Search helpers for multi-tab find (unit-testable, no Monaco).
 */

export interface TabSearchHit {
  tabId: string
  tabTitle: string
  lineNumber: number
  column: number
  lineText: string
  matchIndex: number
}

export interface SearchableTab {
  id: string
  title: string
  content: string
}

/**
 * Find all case-insensitive occurrences of `query` across tabs.
 * Returns hits sorted by tab order then position.
 */
export function searchInTabs(
  tabs: SearchableTab[],
  query: string,
  options?: { caseSensitive?: boolean; maxHits?: number }
): TabSearchHit[] {
  const q = query.trim()
  if (!q) return []

  const caseSensitive = options?.caseSensitive ?? false
  const maxHits = options?.maxHits ?? 200
  const needle = caseSensitive ? q : q.toLowerCase()
  const hits: TabSearchHit[] = []

  for (const tab of tabs) {
    const lines = tab.content.split('\n')
    for (let i = 0; i < lines.length; i += 1) {
      const lineText = lines[i] ?? ''
      const hay = caseSensitive ? lineText : lineText.toLowerCase()
      let from = 0
      while (from <= hay.length) {
        const idx = hay.indexOf(needle, from)
        if (idx === -1) break
        hits.push({
          tabId: tab.id,
          tabTitle: tab.title,
          lineNumber: i + 1,
          column: idx + 1,
          lineText: lineText.slice(0, 200),
          matchIndex: hits.length
        })
        if (hits.length >= maxHits) return hits
        from = idx + Math.max(1, needle.length)
      }
    }
  }

  return hits
}
