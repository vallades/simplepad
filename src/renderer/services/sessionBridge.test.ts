import { describe, expect, it } from 'vitest'
import { buildSessionPayload, dtoToTab, tabToDTO } from './sessionBridge'
import { createTabEntity } from '../store/useTabsStore'
import { SESSION_VERSION } from '../../shared/session'

describe('sessionBridge', () => {
  it('round-trips tab ↔ DTO', () => {
    const tab = createTabEntity({
      title: 'a.md',
      content: '# hi',
      isMarkdown: true,
      filePath: '/tmp/a.md',
      isDirty: false
    })
    tab.cursorPosition = { lineNumber: 3, column: 2 }
    tab.scrollPosition = 42

    const dto = tabToDTO(tab)
    expect(dto.lastModified).toMatch(/^\d{4}-/)
    expect(dto.scrollPosition).toBe(42)

    const restored = dtoToTab(dto)
    expect(restored.id).toBe(tab.id)
    expect(restored.content).toBe('# hi')
    expect(restored.isMarkdown).toBe(true)
    expect(restored.filePath).toBe('/tmp/a.md')
    expect(restored.cursorPosition).toEqual({ lineNumber: 3, column: 2 })
    expect(restored.lastModified).toBeInstanceOf(Date)
  })

  it('builds session payload', () => {
    const tab = createTabEntity({ title: 'x' })
    const session = buildSessionPayload([tab], tab.id)
    expect(session.version).toBe(SESSION_VERSION)
    expect(session.tabs).toHaveLength(1)
    expect(session.activeTabId).toBe(tab.id)
  })
})
