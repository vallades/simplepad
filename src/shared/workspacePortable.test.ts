import { describe, expect, it } from 'vitest'
import { extractPortableTabs, isPortableTab, mergePortableIntoSession } from './workspacePortable'
import type { TabDTO } from './session'

function dto(partial: Partial<TabDTO> & Pick<TabDTO, 'id' | 'title'>): TabDTO {
  return {
    content: '',
    isDirty: false,
    isMarkdown: false,
    cursorPosition: { lineNumber: 1, column: 1 },
    scrollPosition: 0,
    lastModified: new Date().toISOString(),
    ...partial
  }
}

describe('isPortableTab', () => {
  it('treats missing path as portable', () => {
    expect(isPortableTab({})).toBe(true)
    expect(isPortableTab({ filePath: undefined })).toBe(true)
  })

  it('treats untitled-notes paths as portable', () => {
    expect(
      isPortableTab({
        filePath:
          '/Users/me/Library/Application Support/simplepad/untitled-notes/untitled-20260101-120000.md'
      })
    ).toBe(true)
  })

  it('does not treat real files as portable', () => {
    expect(isPortableTab({ filePath: '/notes/a.md' })).toBe(false)
  })
})

describe('extractPortableTabs', () => {
  it('filters only portable', () => {
    const tabs = [
      { id: '1', filePath: undefined },
      { id: '2', filePath: '/a.md' },
      { id: '3', filePath: '/x/untitled-notes/untitled-20260101-120000.md' }
    ]
    expect(extractPortableTabs(tabs).map((t) => t.id)).toEqual(['1', '3'])
  })
})

describe('mergePortableIntoSession', () => {
  it('appends portable and re-ids collisions', () => {
    const session = [dto({ id: 'same', title: 'A.md', filePath: '/ws/A.md' })]
    const portable = [dto({ id: 'same', title: 'Sem título 1', content: 'draft', isDirty: true })]
    const { tabs, activeTabId } = mergePortableIntoSession(session, portable)
    expect(tabs).toHaveLength(2)
    expect(tabs[0]?.id).toBe('same')
    expect(tabs[1]?.id).not.toBe('same')
    expect(tabs[1]?.filePath).toBeUndefined()
    expect(tabs[1]?.content).toBe('draft')
    expect(activeTabId).toBe(tabs[1]?.id)
  })

  it('returns session only when no portable', () => {
    const session = [dto({ id: 'a', title: 'a' })]
    const { tabs } = mergePortableIntoSession(session, [])
    expect(tabs).toEqual(session)
  })
})
