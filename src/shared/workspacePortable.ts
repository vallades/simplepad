/**
 * Pure helpers: which tabs travel across workspace switches (unsaved / untitled).
 */

import { isUntitledNotesPath } from './untitledNotes'
import type { TabDTO } from './session'

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `portable-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/** Snapshot used while switching workspaces (serializable). */
export type PortableTabSnapshot = TabDTO

/**
 * Untitled drafts travel with the user across workspace switches so they are not lost.
 * - no filePath
 * - auto-saved under untitled-notes/
 */
export function isPortableTab(tab: { filePath?: string | null }): boolean {
  if (!tab.filePath) return true
  return isUntitledNotesPath(tab.filePath)
}

export function extractPortableTabs<T extends { filePath?: string | null }>(tabs: T[]): T[] {
  return tabs.filter((t) => isPortableTab(t))
}

/**
 * Tabs that belong to a session save for the *current* context only:
 * exclude portable drafts so the destination session is not polluted when we re-save.
 * (We still keep full session including portable when flushing the *source* workspace.)
 */
export function tabsForWorkspaceSessionSave<T extends { filePath?: string | null }>(
  tabs: T[]
): T[] {
  // Save everything for the source workspace so return visits restore full state.
  return tabs
}

/**
 * After loading destination session, append portable drafts from the previous workspace.
 * Re-ids portable tabs that collide with destination ids; strips untitled-notes paths so
 * they re-save under the new workspace untitled folder.
 */
export function mergePortableIntoSession(
  sessionTabs: TabDTO[],
  portable: TabDTO[]
): { tabs: TabDTO[]; activeTabId: string | null } {
  if (portable.length === 0) {
    return {
      tabs: sessionTabs,
      activeTabId: sessionTabs[0]?.id ?? null
    }
  }

  const usedIds = new Set(sessionTabs.map((t) => t.id))
  const mergedPortable: TabDTO[] = portable.map((tab) => {
    let id = tab.id
    if (usedIds.has(id)) {
      id = newId()
    }
    usedIds.add(id)
    const filePath = !tab.filePath || isUntitledNotesPath(tab.filePath) ? undefined : tab.filePath
    return {
      ...tab,
      id,
      filePath,
      // Keep dirty so user still sees unsaved state
      isDirty: tab.isDirty || !filePath
    }
  })

  // Avoid duplicating by title+content for empty welcome-only sessions
  const tabs = [...sessionTabs, ...mergedPortable]
  const activeTabId = mergedPortable[mergedPortable.length - 1]?.id ?? sessionTabs[0]?.id ?? null
  return { tabs, activeTabId }
}
