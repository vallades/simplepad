/**
 * Text snippets for quick expansion in the editor.
 * Triggers typically start with `;` (e.g. `;hoje`).
 */

export interface TextSnippet {
  id: string
  /** Trigger word (matched before cursor), e.g. `;hoje` */
  trigger: string
  /** Human label in Settings */
  name: string
  /**
   * Insertion body. Placeholders:
   * - {{date}} → YYYY-MM-DD
   * - {{time}} → HH:mm
   * - {{datetime}} → YYYY-MM-DD HH:mm
   * - $0 → final cursor position (removed from text)
   */
  body: string
}

export const SNIPPETS_VERSION = 1

export interface SnippetsFile {
  version: number
  snippets: TextSnippet[]
}

export const DEFAULT_SNIPPETS: TextSnippet[] = [
  {
    id: 'hoje',
    trigger: ';hoje',
    name: 'Data de hoje',
    body: '{{date}}$0'
  },
  {
    id: 'hora',
    trigger: ';hora',
    name: 'Hora atual',
    body: '{{time}}$0'
  },
  {
    id: 'agora',
    trigger: ';agora',
    name: 'Data e hora',
    body: '{{datetime}}$0'
  },
  {
    id: 'checklist',
    trigger: ';check',
    name: 'Checklist',
    body: '- [ ] $0\n- [ ] \n- [ ] '
  },
  {
    id: 'reuniao',
    trigger: ';reuniao',
    name: 'Reunião',
    body: `## Reunião — {{date}}

**Participantes:** $0

### Pauta
1.

### Notas

### Ações
- [ ]
`
  },
  {
    id: 'ideia',
    trigger: ';ideia',
    name: 'Ideia',
    body: `## Ideia — {{date}}

**Resumo:** $0

### Detalhes

### Próximos passos
- [ ]
`
  }
]

export function createDefaultSnippetsFile(): SnippetsFile {
  return { version: SNIPPETS_VERSION, snippets: DEFAULT_SNIPPETS.map((s) => ({ ...s })) }
}

export function isValidSnippet(raw: unknown): raw is TextSnippet {
  if (!raw || typeof raw !== 'object') return false
  const s = raw as Record<string, unknown>
  return (
    typeof s.id === 'string' &&
    s.id.length > 0 &&
    typeof s.trigger === 'string' &&
    s.trigger.trim().length > 0 &&
    typeof s.name === 'string' &&
    s.name.trim().length > 0 &&
    typeof s.body === 'string'
  )
}

export function sanitizeSnippetsFile(raw: unknown): SnippetsFile {
  if (!raw || typeof raw !== 'object') return createDefaultSnippetsFile()
  const obj = raw as Record<string, unknown>
  const list = Array.isArray(obj.snippets) ? obj.snippets : null
  if (!list) return createDefaultSnippetsFile()

  const snippets: TextSnippet[] = []
  const seen = new Set<string>()
  for (const item of list) {
    if (!isValidSnippet(item)) continue
    const trigger = item.trigger.trim()
    if (seen.has(trigger.toLowerCase())) continue
    seen.add(trigger.toLowerCase())
    snippets.push({
      id: item.id.trim(),
      trigger,
      name: item.name.trim().slice(0, 80),
      body: item.body
    })
  }

  if (snippets.length === 0) return createDefaultSnippetsFile()
  return { version: SNIPPETS_VERSION, snippets }
}

/** Expand placeholders; returns text and cursor offset within the inserted string (before $0 removal). */
export function expandSnippetBody(
  body: string,
  now = new Date()
): { text: string; cursorOffset: number } {
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const mi = String(now.getMinutes()).padStart(2, '0')
  const date = `${yyyy}-${mm}-${dd}`
  const time = `${hh}:${mi}`
  const datetime = `${date} ${time}`

  let text = body
    .split('{{date}}')
    .join(date)
    .split('{{time}}')
    .join(time)
    .split('{{datetime}}')
    .join(datetime)

  const cursorMarker = text.indexOf('$0')
  if (cursorMarker >= 0) {
    text = text.slice(0, cursorMarker) + text.slice(cursorMarker + 2)
    return { text, cursorOffset: cursorMarker }
  }
  return { text, cursorOffset: text.length }
}

/**
 * If `prefix` ends with a snippet trigger, return the match.
 * Prefers longest trigger match.
 */
export function matchSnippetTrigger(
  prefix: string,
  snippets: TextSnippet[]
): { snippet: TextSnippet; triggerStart: number } | null {
  if (!prefix || snippets.length === 0) return null
  const sorted = [...snippets].sort((a, b) => b.trigger.length - a.trigger.length)
  for (const snippet of sorted) {
    const t = snippet.trigger
    if (!t) continue
    if (prefix.endsWith(t)) {
      // Require word boundary-ish: start or non-word char before trigger
      const start = prefix.length - t.length
      if (start > 0) {
        const prev = prefix[start - 1]
        if (prev && /[A-Za-z0-9_]/.test(prev) && /^[A-Za-z0-9_]/.test(t)) {
          continue
        }
      }
      return { snippet, triggerStart: start }
    }
  }
  return null
}
