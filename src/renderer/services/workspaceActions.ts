import { isElectronApiAvailable, loadSessionFromMain, persistSessionToMain } from './sessionBridge'
import { useTabsStore } from '../store/useTabsStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useWorkspaceStore } from '../store/useWorkspaceStore'
import { useUiStore } from '../store/useUiStore'
import { showToast } from '../store/useToastStore'
import type { WorkspaceInfo } from '../../shared/workspace'

function reportApiMissing(): void {
  showToast('API de workspace indisponível neste ambiente.', 'error')
}

async function flushCurrentSession(): Promise<void> {
  const state = useTabsStore.getState()
  await persistSessionToMain(state.tabs, state.activeTabId)
}

async function rehydrateAfterWorkspaceSwitch(): Promise<void> {
  // Settings/session are now on the new data path
  await useSettingsStore.getState().loadFromMain()
  const settings = useSettingsStore.getState()
  useUiStore.getState().setSidebarOpen(settings.sidebarOpen)

  try {
    const { session } = await loadSessionFromMain()
    useTabsStore.getState().hydrateFromSession(session)
  } catch (error) {
    console.error('[workspace] session hydrate failed', error)
    useTabsStore.getState().hydrateFromSession(null)
  }
}

function applyInfo(info: WorkspaceInfo): void {
  useWorkspaceStore.getState().setFromInfo(info)
}

export async function loadWorkspaceInfo(): Promise<WorkspaceInfo | null> {
  if (!isElectronApiAvailable() || typeof window.api.getWorkspace !== 'function') {
    useWorkspaceStore.getState().clearToGlobal()
    return null
  }
  const result = await window.api.getWorkspace()
  if (result.data) {
    applyInfo(result.data)
    return result.data
  }
  useWorkspaceStore.getState().clearToGlobal()
  return null
}

/**
 * Open folder dialog → switch workspace (flush session first).
 */
export async function openWorkspaceFromDialog(): Promise<void> {
  if (!isElectronApiAvailable() || typeof window.api.openWorkspaceDialog !== 'function') {
    reportApiMissing()
    return
  }

  await flushCurrentSession()
  const result = await window.api.openWorkspaceDialog()
  if (!result.ok) {
    if (result.error) showToast(result.error, 'error')
    return
  }
  if (!result.data) return // canceled

  applyInfo(result.data)
  await rehydrateAfterWorkspaceSwitch()
  showToast(`Workspace: ${result.data.name}`, 'success')
}

export async function openWorkspaceByPath(rootPath: string): Promise<void> {
  if (!rootPath) return
  if (!isElectronApiAvailable() || typeof window.api.openWorkspacePath !== 'function') {
    reportApiMissing()
    return
  }

  await flushCurrentSession()
  const result = await window.api.openWorkspacePath(rootPath)
  if (!result.ok || !result.data) {
    if (result.error) showToast(result.error, 'error')
    return
  }
  applyInfo(result.data)
  await rehydrateAfterWorkspaceSwitch()
  showToast(`Workspace: ${result.data.name}`, 'success')
}

export async function closeActiveWorkspace(): Promise<void> {
  if (!isElectronApiAvailable() || typeof window.api.closeWorkspace !== 'function') {
    reportApiMissing()
    return
  }

  const current = useWorkspaceStore.getState().rootPath
  if (!current) {
    showToast('Nenhum workspace de pasta aberto.', 'info')
    return
  }

  await flushCurrentSession()
  const result = await window.api.closeWorkspace()
  if (!result.ok || !result.data) {
    if (result.error) showToast(result.error, 'error')
    return
  }
  applyInfo(result.data)
  await rehydrateAfterWorkspaceSwitch()
  showToast('Voltou ao workspace Pessoal', 'info')
}

export async function listWorkspaceDir(
  dirPath?: string
): Promise<{ path: string; entries: import('../../shared/workspace').DirEntryDTO[] }> {
  if (!isElectronApiAvailable() || typeof window.api.listWorkspaceDir !== 'function') {
    return { path: '', entries: [] }
  }
  const result = await window.api.listWorkspaceDir(dirPath)
  return result.data ?? { path: '', entries: [] }
}
