import { beforeEach, describe, expect, it } from 'vitest'
import {
  createTabEntity,
  nextUntitledTitle,
  resetTabsStoreForTests,
  useTabsStore
} from './useTabsStore'
import { SESSION_VERSION } from '../../shared/session'

describe('nextUntitledTitle', () => {
  it('returns Sem título 1 when empty', () => {
    expect(nextUntitledTitle([])).toBe('Sem título 1')
  })

  it('fills the lowest free number', () => {
    const tabs = [
      createTabEntity({ title: 'Sem título 1' }),
      createTabEntity({ title: 'Sem título 3' })
    ]
    expect(nextUntitledTitle(tabs)).toBe('Sem título 2')
  })
})

describe('useTabsStore', () => {
  beforeEach(() => {
    resetTabsStoreForTests()
  })

  it('starts with one clean tab', () => {
    const state = useTabsStore.getState()
    expect(state.tabs).toHaveLength(1)
    expect(state.activeTabId).toBe(state.tabs[0]?.id)
    expect(state.tabs[0]?.isDirty).toBe(false)
    expect(state.hasUnsavedChanges()).toBe(false)
  })

  it('createNewTab adds and activates a new untitled tab', () => {
    const id = useTabsStore.getState().createNewTab()
    const state = useTabsStore.getState()

    expect(state.tabs).toHaveLength(2)
    expect(state.activeTabId).toBe(id)
    expect(state.tabs[1]?.title).toBe('Sem título 2')
    expect(state.getActiveTab()?.id).toBe(id)
  })

  it('updateTabContent marks tab dirty and stores text', () => {
    const id = useTabsStore.getState().tabs[0]!.id
    useTabsStore.getState().updateTabContent(id, 'olá mundo')

    const tab = useTabsStore.getState().tabs[0]
    expect(tab?.content).toBe('olá mundo')
    expect(tab?.isDirty).toBe(true)
    expect(useTabsStore.getState().hasUnsavedChanges()).toBe(true)
  })

  it('markAsSaved clears dirty and sets file path/title', () => {
    const id = useTabsStore.getState().tabs[0]!.id
    useTabsStore.getState().updateTabContent(id, 'conteúdo')
    useTabsStore.getState().markAsSaved(id, '/tmp/notas.md')

    const tab = useTabsStore.getState().tabs[0]
    expect(tab?.isDirty).toBe(false)
    expect(tab?.filePath).toBe('/tmp/notas.md')
    expect(tab?.title).toBe('notas.md')
    expect(tab?.isMarkdown).toBe(true)
    expect(useTabsStore.getState().hasUnsavedChanges()).toBe(false)
  })

  it('switchTab changes the active tab', () => {
    const secondId = useTabsStore.getState().createNewTab()
    const firstId = useTabsStore.getState().tabs[0]!.id

    useTabsStore.getState().switchTab(firstId)
    expect(useTabsStore.getState().activeTabId).toBe(firstId)

    useTabsStore.getState().switchTab(secondId)
    expect(useTabsStore.getState().activeTabId).toBe(secondId)
  })

  it('closeTab removes a tab and activates a neighbor', () => {
    const secondId = useTabsStore.getState().createNewTab()
    const thirdId = useTabsStore.getState().createNewTab()

    useTabsStore.getState().switchTab(secondId)
    useTabsStore.getState().closeTab(secondId)

    const state = useTabsStore.getState()
    expect(state.tabs).toHaveLength(2)
    expect(state.tabs.find((t) => t.id === secondId)).toBeUndefined()
    expect(state.activeTabId).toBe(thirdId)
  })

  it('closeTab on the last tab opens a fresh empty tab', () => {
    const onlyId = useTabsStore.getState().tabs[0]!.id
    useTabsStore.getState().updateTabContent(onlyId, 'vai sumir')
    useTabsStore.getState().closeTab(onlyId)

    const state = useTabsStore.getState()
    expect(state.tabs).toHaveLength(1)
    expect(state.tabs[0]?.id).not.toBe(onlyId)
    expect(state.tabs[0]?.content).toBe('')
    expect(state.tabs[0]?.isDirty).toBe(false)
    expect(state.activeTabId).toBe(state.tabs[0]?.id)
  })

  it('reorderTabs changes order without dropping tabs', () => {
    const a = useTabsStore.getState().tabs[0]!.id
    const b = useTabsStore.getState().createNewTab()
    const c = useTabsStore.getState().createNewTab()

    const reversed = [...useTabsStore.getState().tabs].reverse()
    useTabsStore.getState().reorderTabs(reversed)

    expect(useTabsStore.getState().tabs.map((t) => t.id)).toEqual([c, b, a])
  })

  it('setCursorPosition and setScrollPosition update the active tab', () => {
    const id = useTabsStore.getState().tabs[0]!.id
    useTabsStore.getState().setCursorPosition(id, { lineNumber: 3, column: 8 })
    useTabsStore.getState().setScrollPosition(id, 120)

    const tab = useTabsStore.getState().tabs[0]
    expect(tab?.cursorPosition).toEqual({ lineNumber: 3, column: 8 })
    expect(tab?.scrollPosition).toBe(120)
  })

  it('updateTabTitle renames the tab', () => {
    const id = useTabsStore.getState().tabs[0]!.id
    useTabsStore.getState().updateTabTitle(id, 'rascunho.txt')
    expect(useTabsStore.getState().tabs[0]?.title).toBe('rascunho.txt')
  })

  it('hydrateFromSession restores tabs from main process payload', () => {
    useTabsStore.getState().hydrateFromSession({
      version: SESSION_VERSION,
      activeTabId: 't2',
      tabs: [
        {
          id: 't1',
          title: 'one.txt',
          content: 'a',
          isDirty: false,
          isMarkdown: false,
          cursorPosition: { lineNumber: 1, column: 1 },
          scrollPosition: 0,
          lastModified: new Date().toISOString()
        },
        {
          id: 't2',
          title: 'two.md',
          content: '# b',
          isDirty: true,
          isMarkdown: true,
          filePath: '/tmp/two.md',
          cursorPosition: { lineNumber: 2, column: 1 },
          scrollPosition: 5,
          lastModified: new Date().toISOString()
        }
      ]
    })

    const state = useTabsStore.getState()
    expect(state.sessionHydrated).toBe(true)
    expect(state.tabs).toHaveLength(2)
    expect(state.activeTabId).toBe('t2')
    expect(state.getActiveTab()?.content).toBe('# b')
    expect(state.getActiveTab()?.filePath).toBe('/tmp/two.md')
  })

  it('hydrateFromSession falls back to welcome tab when null', () => {
    useTabsStore.getState().createNewTab()
    useTabsStore.getState().hydrateFromSession(null)
    const state = useTabsStore.getState()
    expect(state.tabs).toHaveLength(1)
    expect(state.tabs[0]?.title).toBe('Sem título 1')
    expect(state.sessionHydrated).toBe(true)
  })
})
