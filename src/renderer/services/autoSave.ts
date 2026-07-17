import { useTabsStore } from '../store/useTabsStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { isUntitledAutoSaveCandidate, isUntitledNotesPath } from '../../shared/untitledNotes'
import { saveTabById, saveUntitledTabById } from './fileActions'

/**
 * Pure helpers for auto-save decisions (unit-tested).
 */

export interface AutoSaveTarget {
  id: string
  /** Absolute path when known; omitted for brand-new untitled tabs */
  filePath?: string
  kind: 'disk' | 'untitled'
}

/** Tabs that can be auto-saved: dirty + (on disk or untitled). */
export function collectAutoSaveTargets(
  tabs: Array<{ id: string; filePath?: string; isDirty: boolean }>
): AutoSaveTarget[] {
  const targets: AutoSaveTarget[] = []
  for (const tab of tabs) {
    if (!tab.isDirty) continue
    if (tab.filePath && !isUntitledNotesPath(tab.filePath)) {
      targets.push({ id: tab.id, filePath: tab.filePath, kind: 'disk' })
      continue
    }
    if (isUntitledAutoSaveCandidate(tab)) {
      targets.push({
        id: tab.id,
        filePath: tab.filePath,
        kind: 'untitled'
      })
    }
  }
  return targets
}

export function intervalMsFromSeconds(seconds: number): number {
  const safe = Number.isFinite(seconds) ? seconds : 30
  return Math.max(5, Math.round(safe)) * 1000
}

/**
 * Saves dirty tabs with a real path + dirty untitled tabs into userData/untitled-notes.
 */
export async function runAutoSavePass(): Promise<number> {
  const settings = useSettingsStore.getState()
  if (!settings.autoSaveEnabled) return 0

  const targets = collectAutoSaveTargets(useTabsStore.getState().tabs)
  let saved = 0
  for (const target of targets) {
    if (target.kind === 'untitled') {
      const ok = await saveUntitledTabById(target.id)
      if (ok) saved += 1
    } else {
      const ok = await saveTabById(target.id)
      if (ok) saved += 1
    }
  }
  return saved
}

/**
 * Auto-save the previously active tab when switching away (if enabled).
 */
export async function autoSaveTabOnSwitch(tabId: string | null): Promise<boolean> {
  if (!tabId) return false
  if (!useSettingsStore.getState().autoSaveEnabled) return false

  const tab = useTabsStore.getState().tabs.find((item) => item.id === tabId)
  if (!tab || !tab.isDirty) return false

  if (tab.filePath && !isUntitledNotesPath(tab.filePath)) {
    return saveTabById(tabId)
  }

  return saveUntitledTabById(tabId)
}
