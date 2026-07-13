import { SESSION_VERSION, type AppSession, type TabDTO } from '../../shared/session'
import type { Tab } from '../types/tab'

/** Tab (renderer) → serializable DTO for main process */
export function tabToDTO(tab: Tab): TabDTO {
  return {
    id: tab.id,
    title: tab.title,
    content: tab.content,
    isDirty: tab.isDirty,
    isMarkdown: tab.isMarkdown,
    filePath: tab.filePath,
    cursorPosition: { ...tab.cursorPosition },
    scrollPosition: tab.scrollPosition,
    lastModified:
      tab.lastModified instanceof Date
        ? tab.lastModified.toISOString()
        : new Date(tab.lastModified).toISOString()
  }
}

/** DTO from main → Tab for the store */
export function dtoToTab(dto: TabDTO): Tab {
  return {
    id: dto.id,
    title: dto.title,
    content: dto.content,
    isDirty: dto.isDirty,
    isMarkdown: dto.isMarkdown,
    filePath: dto.filePath,
    cursorPosition: dto.cursorPosition ?? { lineNumber: 1, column: 1 },
    scrollPosition: typeof dto.scrollPosition === 'number' ? dto.scrollPosition : 0,
    lastModified: new Date(dto.lastModified ?? Date.now())
  }
}

export function buildSessionPayload(tabs: Tab[], activeTabId: string | null): AppSession {
  return {
    version: SESSION_VERSION,
    tabs: tabs.map(tabToDTO),
    activeTabId
  }
}

export function isElectronApiAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.api?.loadSession === 'function'
}

export async function persistSessionToMain(
  tabs: Tab[],
  activeTabId: string | null
): Promise<boolean> {
  if (!isElectronApiAvailable()) {
    console.warn('[sessionBridge] window.api unavailable — session not persisted')
    return false
  }
  const result = await window.api.saveSession(buildSessionPayload(tabs, activeTabId))
  if (!result.ok) {
    console.error('[sessionBridge] save failed:', result.error)
    return false
  }
  return true
}

export async function loadSessionFromMain(): Promise<AppSession | null> {
  if (!isElectronApiAvailable()) return null
  const result = await window.api.loadSession()
  if (!result.ok) {
    console.error('[sessionBridge] load failed:', result.error)
    return null
  }
  return result.data ?? null
}
