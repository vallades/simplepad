/**
 * Note templates stored under userData/templates/templates.json
 */

export interface NoteTemplate {
  id: string
  name: string
  /** Markdown/plain body inserted into a new tab */
  content: string
  /** Prefer Markdown mode when creating from this template */
  isMarkdown?: boolean
  /** ISO timestamp */
  updatedAt: string
}

export interface TemplatesFile {
  version: number
  templates: NoteTemplate[]
}

export const TEMPLATES_FILE_VERSION = 1

/** Built-in templates seeded on first run (user can edit/delete). */
export const DEFAULT_TEMPLATES: Omit<NoteTemplate, 'updatedAt'>[] = [
  {
    id: 'daily-note',
    name: 'Daily Note',
    isMarkdown: true,
    content: `# Daily Note — {{date}}

## Foco do dia
-

## Tarefas
- [ ]
- [ ]

## Notas
`
  },
  {
    id: 'reuniao',
    name: 'Reunião',
    isMarkdown: true,
    content: `# Reunião — {{date}}

**Participantes:**
-

## Pauta
1.

## Discussão


## Decisões
-

## Próximos passos
- [ ]
`
  },
  {
    id: 'ideia',
    name: 'Ideia',
    isMarkdown: true,
    content: `# Ideia

**Resumo:**


## Por quê?


## Como?


## Próximo passo
- [ ]
`
  },
  {
    id: 'checklist',
    name: 'Checklist',
    isMarkdown: true,
    content: `# Checklist

- [ ] Item 1
- [ ] Item 2
- [ ] Item 3
`
  }
]

/** Replace simple placeholders in template body. */
export function renderTemplateContent(content: string, now = new Date()): string {
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  const date = `${yyyy}-${mm}-${dd}`
  return content.split('{{date}}').join(date)
}

export function isValidTemplate(raw: unknown): raw is NoteTemplate {
  if (!raw || typeof raw !== 'object') return false
  const t = raw as Record<string, unknown>
  return (
    typeof t.id === 'string' &&
    t.id.length > 0 &&
    typeof t.name === 'string' &&
    t.name.trim().length > 0 &&
    typeof t.content === 'string' &&
    typeof t.updatedAt === 'string'
  )
}
