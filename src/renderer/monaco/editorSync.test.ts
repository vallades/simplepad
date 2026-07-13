/**
 * Store-level sync contract used by the Monaco Editor integration.
 * Full Monaco DOM is not exercised here (workers + canvas); this locks the
 * bidirectional data flow the Editor component relies on.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { resetTabsStoreForTests, useTabsStore } from '../store/useTabsStore'

describe('Monaco ↔ store sync contract', () => {
  beforeEach(() => {
    resetTabsStoreForTests()
  })

  it('loads active tab content for the editor', () => {
    const id = useTabsStore.getState().tabs[0]!.id
    useTabsStore.getState().updateTabContent(id, 'conteúdo inicial')
    useTabsStore.getState().markAsSaved(id)

    const active = useTabsStore.getState().getActiveTab()
    expect(active?.content).toBe('conteúdo inicial')
    expect(active?.isDirty).toBe(false)
  })

  it('marks dirty when editor pushes content updates', () => {
    const id = useTabsStore.getState().tabs[0]!.id
    // Simulates onDidChangeModelContent → updateTabContent
    useTabsStore.getState().updateTabContent(id, 'digitado no monaco')

    const tab = useTabsStore.getState().getActiveTab()
    expect(tab?.content).toBe('digitado no monaco')
    expect(tab?.isDirty).toBe(true)
  })

  it('preserves per-tab content, cursor and scroll when switching', () => {
    const firstId = useTabsStore.getState().tabs[0]!.id
    useTabsStore.getState().updateTabContent(firstId, 'aba um')
    useTabsStore.getState().setCursorPosition(firstId, { lineNumber: 2, column: 5 })
    useTabsStore.getState().setScrollPosition(firstId, 40)

    const secondId = useTabsStore.getState().createNewTab({ content: 'aba dois' })
    useTabsStore.getState().setCursorPosition(secondId, { lineNumber: 1, column: 3 })
    useTabsStore.getState().setScrollPosition(secondId, 10)

    useTabsStore.getState().switchTab(firstId)
    const first = useTabsStore.getState().getActiveTab()
    expect(first?.id).toBe(firstId)
    expect(first?.content).toBe('aba um')
    expect(first?.cursorPosition).toEqual({ lineNumber: 2, column: 5 })
    expect(first?.scrollPosition).toBe(40)

    useTabsStore.getState().switchTab(secondId)
    const second = useTabsStore.getState().getActiveTab()
    expect(second?.content).toBe('aba dois')
    expect(second?.cursorPosition).toEqual({ lineNumber: 1, column: 3 })
    expect(second?.scrollPosition).toBe(10)
  })

  it('keeps dirty state independent per tab', () => {
    const firstId = useTabsStore.getState().tabs[0]!.id
    const secondId = useTabsStore.getState().createNewTab()

    useTabsStore.getState().updateTabContent(firstId, 'editada')
    useTabsStore.getState().switchTab(secondId)

    const state = useTabsStore.getState()
    expect(state.tabs.find((t) => t.id === firstId)?.isDirty).toBe(true)
    expect(state.tabs.find((t) => t.id === secondId)?.isDirty).toBe(false)
  })
})
