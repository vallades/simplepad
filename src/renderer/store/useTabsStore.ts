import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { CursorPosition, Tab, TabCreateInput } from '../types/tab'
import type { AppSession } from '../../shared/session'
import { dtoToTab } from '../services/sessionBridge'
import { useSettingsStore } from './useSettingsStore'

export type { CursorPosition, Tab, TabCreateInput } from '../types/tab'

interface TabsState {
  tabs: Tab[]
  activeTabId: string | null
  /** True after session was loaded from main (or fallback applied) */
  sessionHydrated: boolean

  createNewTab: (partial?: TabCreateInput) => string
  closeTab: (id: string) => void
  switchTab: (id: string) => void
  updateTabContent: (id: string, content: string) => void
  updateTabTitle: (id: string, title: string) => void
  /**
   * Replace tab content from disk without marking dirty (explorer re-open / reload).
   * Bumps `contentRevision` so the editor re-binds even if the tab is already active.
   */
  applyDiskContent: (id: string, content: string, filePath?: string) => void
  markAsSaved: (id: string, filePath?: string) => void
  setMarkdownMode: (id: string, isMarkdown: boolean) => void
  toggleMarkdownMode: (id: string) => void
  reorderTabs: (newOrder: Tab[]) => void
  setCursorPosition: (id: string, position: CursorPosition) => void
  setScrollPosition: (id: string, scroll: number) => void
  /** Replaces state from a main-process session */
  hydrateFromSession: (session: AppSession | null) => void
  getActiveTab: () => Tab | undefined
  hasUnsavedChanges: () => boolean
}

/** Builds the next free "Sem título N" label from existing tabs */
export function nextUntitledTitle(tabs: Tab[]): string {
  const used = new Set<number>()
  for (const tab of tabs) {
    const match = /^Sem título (\d+)$/.exec(tab.title)
    if (match) {
      used.add(Number(match[1]))
    }
  }
  let n = 1
  while (used.has(n)) n += 1
  return `Sem título ${n}`
}

function fileNameFromPath(filePath: string): string {
  const parts = filePath.split(/[/\\]/)
  return parts[parts.length - 1] || filePath
}

function isMarkdownPath(filePath: string): boolean {
  const lower = filePath.toLowerCase()
  return lower.endsWith('.md') || lower.endsWith('.markdown')
}

/** Factory for a fully-formed Tab (immutable) */
export function createTabEntity(partial?: TabCreateInput, titleFallback = 'Sem título 1'): Tab {
  const filePath = partial?.filePath
  const title = partial?.title ?? (filePath ? fileNameFromPath(filePath) : titleFallback)

  return {
    id: uuidv4(),
    title,
    content: partial?.content ?? '',
    isDirty: partial?.isDirty ?? false,
    isMarkdown: partial?.isMarkdown ?? (filePath ? isMarkdownPath(filePath) : false),
    filePath,
    cursorPosition: partial?.cursorPosition ?? { lineNumber: 1, column: 1 },
    scrollPosition: partial?.scrollPosition ?? 0,
    lastModified: partial?.lastModified ?? new Date()
  }
}

function createInitialTabs(): { tabs: Tab[]; activeTabId: string } {
  const welcome = createTabEntity({
    title: 'Sem título 1',
    content: 'Bem-vindo ao SimplePad!\n\nCrie abas, digite e reordene-as livremente.\n',
    isDirty: false
  })
  return { tabs: [welcome], activeTabId: welcome.id }
}

const initial = createInitialTabs()

export const useTabsStore = create<TabsState>()((set, get) => ({
  tabs: initial.tabs,
  activeTabId: initial.activeTabId,
  sessionHydrated: false,

  createNewTab: (partial) => {
    const title = partial?.title ?? nextUntitledTitle(get().tabs)
    // Untitled tabs: Plain Text by default unless settings prefer Markdown
    // (files with .md path still force Markdown via createTabEntity)
    const defaultMd =
      partial?.isMarkdown !== undefined
        ? partial.isMarkdown
        : partial?.filePath
          ? undefined
          : useSettingsStore.getState().newTabDefaultMarkdown
    const tab = createTabEntity(
      {
        ...partial,
        ...(defaultMd !== undefined ? { isMarkdown: defaultMd } : {})
      },
      title
    )
    set((state) => ({
      tabs: [...state.tabs, tab],
      activeTabId: tab.id
    }))
    return tab.id
  },

  closeTab: (id) => {
    const { tabs, activeTabId } = get()
    const index = tabs.findIndex((tab) => tab.id === id)
    if (index === -1) return

    const nextTabs = tabs.filter((tab) => tab.id !== id)

    if (nextTabs.length === 0) {
      const fresh = createTabEntity(undefined, 'Sem título 1')
      set({ tabs: [fresh], activeTabId: fresh.id })
      return
    }

    let nextActive = activeTabId
    if (activeTabId === id) {
      const fallback = nextTabs[Math.min(index, nextTabs.length - 1)]
      nextActive = fallback?.id ?? null
    }

    set({ tabs: nextTabs, activeTabId: nextActive })
  },

  switchTab: (id) => {
    const exists = get().tabs.some((tab) => tab.id === id)
    if (!exists) return
    set({ activeTabId: id })
  },

  updateTabContent: (id, content) => {
    const current = get().tabs.find((tab) => tab.id === id)
    if (!current || current.content === content) return

    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === id
          ? {
              ...tab,
              content,
              isDirty: true,
              lastModified: new Date()
            }
          : tab
      )
    }))
  },

  updateTabTitle: (id, title) => {
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === id ? { ...tab, title, lastModified: new Date() } : tab
      )
    }))
  },

  applyDiskContent: (id, content, filePath) => {
    set((state) => ({
      tabs: state.tabs.map((tab) => {
        if (tab.id !== id) return tab
        const nextPath = filePath ?? tab.filePath
        return {
          ...tab,
          content,
          isDirty: false,
          filePath: nextPath,
          title: nextPath ? fileNameFromPath(nextPath) : tab.title,
          isMarkdown: nextPath ? isMarkdownPath(nextPath) : tab.isMarkdown,
          contentRevision: (tab.contentRevision ?? 0) + 1,
          lastModified: new Date()
        }
      })
    }))
  },

  markAsSaved: (id, filePath) => {
    set((state) => ({
      tabs: state.tabs.map((tab) => {
        if (tab.id !== id) return tab
        const nextPath = filePath ?? tab.filePath
        return {
          ...tab,
          isDirty: false,
          filePath: nextPath,
          title: nextPath ? fileNameFromPath(nextPath) : tab.title,
          isMarkdown: nextPath ? isMarkdownPath(nextPath) : tab.isMarkdown,
          lastModified: new Date()
        }
      })
    }))
  },

  setMarkdownMode: (id, isMarkdown) => {
    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === id ? { ...tab, isMarkdown, lastModified: new Date() } : tab
      )
    }))
  },

  toggleMarkdownMode: (id) => {
    const tab = get().tabs.find((item) => item.id === id)
    if (!tab) return
    get().setMarkdownMode(id, !tab.isMarkdown)
  },

  reorderTabs: (newOrder) => {
    const byId = new Map(get().tabs.map((tab) => [tab.id, tab]))
    const ordered: Tab[] = []
    for (const item of newOrder) {
      const existing = byId.get(item.id)
      if (existing) {
        ordered.push(existing)
        byId.delete(item.id)
      }
    }
    for (const leftover of byId.values()) {
      ordered.push(leftover)
    }
    set({ tabs: ordered })
  },

  setCursorPosition: (id, position) => {
    const current = get().tabs.find((tab) => tab.id === id)
    if (!current) return
    if (
      current.cursorPosition.lineNumber === position.lineNumber &&
      current.cursorPosition.column === position.column
    ) {
      return
    }

    set((state) => ({
      tabs: state.tabs.map((tab) =>
        tab.id === id ? { ...tab, cursorPosition: { ...position } } : tab
      )
    }))
  },

  setScrollPosition: (id, scroll) => {
    const current = get().tabs.find((tab) => tab.id === id)
    if (!current) return
    if (Math.abs(current.scrollPosition - scroll) < 1) return

    set((state) => ({
      tabs: state.tabs.map((tab) => (tab.id === id ? { ...tab, scrollPosition: scroll } : tab))
    }))
  },

  hydrateFromSession: (session) => {
    if (!session || !Array.isArray(session.tabs) || session.tabs.length === 0) {
      const fresh = createInitialTabs()
      set({
        tabs: fresh.tabs,
        activeTabId: fresh.activeTabId,
        sessionHydrated: true
      })
      return
    }

    const tabs = session.tabs.map(dtoToTab)
    const activeTabId =
      session.activeTabId && tabs.some((t) => t.id === session.activeTabId)
        ? session.activeTabId
        : (tabs[0]?.id ?? null)

    set({
      tabs,
      activeTabId,
      sessionHydrated: true
    })
  },

  getActiveTab: () => {
    const { tabs, activeTabId } = get()
    if (!activeTabId) return undefined
    return tabs.find((tab) => tab.id === activeTabId)
  },

  hasUnsavedChanges: () => {
    return get().tabs.some((tab) => tab.isDirty)
  }
}))

/** Test helper: reset store to a single clean untitled tab */
export function resetTabsStoreForTests(): void {
  const fresh = createInitialTabs()
  useTabsStore.setState({
    tabs: fresh.tabs,
    activeTabId: fresh.activeTabId,
    sessionHydrated: true
  })
}
