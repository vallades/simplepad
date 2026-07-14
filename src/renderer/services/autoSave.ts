import { useTabsStore } from '../store/useTabsStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { saveTabById } from './fileActions'

/**
 * Pure helpers for auto-save decisions (unit-tested).
 */

export interface AutoSaveTarget {
  id: string
  filePath: string
}

/** Tabs that can be auto-saved: dirty + already on disk. */
export function collectAutoSaveTargets(
  tabs: Array<{ id: string; filePath?: string; isDirty: boolean }>
): AutoSaveTarget[] {
  const targets: AutoSaveTarget[] = []
  for (const tab of tabs) {
    if (tab.isDirty && tab.filePath) {
      targets.push({ id: tab.id, filePath: tab.filePath })
    }
  }
  return targets
}

export function intervalMsFromSeconds(seconds: number): number {
  const safe = Number.isFinite(seconds) ? seconds : 30
  return Math.max(5, Math.round(safe)) * 1000
}

/**
 * Saves all dirty tabs that already have a file path.
 * Untitled dirty tabs are skipped (user must Salvar como).
 */
export async function runAutoSavePass(): Promise<number> {
  const settings = useSettingsStore.getState()
  if (!settings.autoSaveEnabled) return 0

  const targets = collectAutoSaveTargets(useTabsStore.getState().tabs)
  let saved = 0
  for (const target of targets) {
    const ok = await saveTabById(target.id)
    if (ok) saved += 1
  }
  return saved
}

/**
 * Auto-save the previously active tab when switching away (if enabled + path).
 */
export async function autoSaveTabOnSwitch(tabId: string | null): Promise<boolean> {
  if (!tabId) return false
  if (!useSettingsStore.getState().autoSaveEnabled) return false

  const tab = useTabsStore.getState().tabs.find((item) => item.id === tabId)
  if (!tab || !tab.isDirty || !tab.filePath) return false

  return saveTabById(tabId)
}
