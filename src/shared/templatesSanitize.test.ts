import { describe, expect, it } from 'vitest'
import {
  createDefaultTemplatesFile,
  removeTemplate,
  sanitizeTemplatesFile,
  upsertTemplate
} from './templatesSanitize'
import { renderTemplateContent } from './templates'

describe('sanitizeTemplatesFile', () => {
  it('seeds defaults when raw is invalid', () => {
    const file = sanitizeTemplatesFile(null)
    expect(file.templates.length).toBeGreaterThanOrEqual(4)
    expect(file.templates.map((t) => t.name)).toEqual(
      expect.arrayContaining(['Daily Note', 'Reunião', 'Ideia', 'Checklist'])
    )
  })

  it('keeps valid user templates', () => {
    const file = sanitizeTemplatesFile({
      version: 1,
      templates: [
        {
          id: 'custom',
          name: 'Custom',
          content: 'hi',
          isMarkdown: true,
          updatedAt: '2026-01-01T00:00:00.000Z'
        },
        { id: 'bad' }
      ]
    })
    expect(file.templates).toHaveLength(1)
    expect(file.templates[0]?.id).toBe('custom')
  })
})

describe('upsertTemplate / removeTemplate', () => {
  it('upserts by id and removes', () => {
    const base = createDefaultTemplatesFile().templates
    const updated = upsertTemplate(base, {
      id: 'daily-note',
      name: 'Daily Note 2',
      content: 'x',
      updatedAt: '2026-01-01T00:00:00.000Z'
    })
    expect(updated.find((t) => t.id === 'daily-note')?.name).toBe('Daily Note 2')
    expect(updated.length).toBe(base.length)

    const removed = removeTemplate(updated, 'daily-note')
    expect(removed.find((t) => t.id === 'daily-note')).toBeUndefined()
  })
})

describe('renderTemplateContent', () => {
  it('replaces {{date}}', () => {
    const out = renderTemplateContent('Day {{date}}', new Date('2026-07-16T12:00:00Z'))
    expect(out).toContain('2026-07-16')
    expect(out).not.toContain('{{date}}')
  })
})
