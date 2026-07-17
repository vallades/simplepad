import {
  DEFAULT_TEMPLATES,
  TEMPLATES_FILE_VERSION,
  isValidTemplate,
  type NoteTemplate,
  type TemplatesFile
} from './templates'

function nowIso(): string {
  return new Date().toISOString()
}

/** Seed default built-in templates with timestamps. */
export function createDefaultTemplatesFile(): TemplatesFile {
  const updatedAt = nowIso()
  return {
    version: TEMPLATES_FILE_VERSION,
    templates: DEFAULT_TEMPLATES.map((t) => ({ ...t, updatedAt }))
  }
}

/**
 * Sanitize raw JSON from disk. Falls back to defaults when empty/invalid.
 * Preserves user templates when structure is mostly valid.
 */
export function sanitizeTemplatesFile(raw: unknown): TemplatesFile {
  if (!raw || typeof raw !== 'object') {
    return createDefaultTemplatesFile()
  }

  const obj = raw as Record<string, unknown>
  const list = Array.isArray(obj.templates) ? obj.templates : null
  if (!list) {
    return createDefaultTemplatesFile()
  }

  const templates: NoteTemplate[] = []
  const seen = new Set<string>()

  for (const item of list) {
    if (!isValidTemplate(item)) continue
    if (seen.has(item.id)) continue
    seen.add(item.id)
    templates.push({
      id: item.id.trim(),
      name: item.name.trim().slice(0, 80),
      content: item.content,
      isMarkdown: Boolean(item.isMarkdown),
      updatedAt: item.updatedAt || nowIso()
    })
  }

  if (templates.length === 0) {
    return createDefaultTemplatesFile()
  }

  return {
    version: TEMPLATES_FILE_VERSION,
    templates
  }
}

/** Upsert a template into a list (by id). */
export function upsertTemplate(list: NoteTemplate[], template: NoteTemplate): NoteTemplate[] {
  const idx = list.findIndex((t) => t.id === template.id)
  if (idx === -1) return [...list, template]
  const next = [...list]
  next[idx] = template
  return next
}

export function removeTemplate(list: NoteTemplate[], id: string): NoteTemplate[] {
  return list.filter((t) => t.id !== id)
}
