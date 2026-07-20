import { isElectronApiAvailable, loadSessionFromMain, persistSessionToMain } from './sessionBridge'
import { tabToDTO, dtoToTab } from './sessionBridge'
import { useTabsStore } from '../store/useTabsStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useWorkspaceStore } from '../store/useWorkspaceStore'
import { useUiStore } from '../store/useUiStore'
import { showToast } from '../store/useToastStore'
import type { WorkspaceInfo } from '../../shared/workspace'
import { extractPortableTabs, mergePortableIntoSession } from '../../shared/workspacePortable'
import { requestExplorerRefresh } from './explorerEvents'
import type { Tab } from '../types/tab'
import { SESSION_VERSION } from '../../shared/session'

function reportApiMissing(): void {
  showToast('API de workspace indisponível neste ambiente.', 'error')
}

async function flushCurrentSession(): Promise<void> {
  const state = useTabsStore.getState()
  // Full session including portable drafts is saved to the *source* data dir
  await persistSessionToMain(state.tabs, state.activeTabId)
}

/**
 * Capture untitled / draft tabs so they survive workspace switches.
 * Global (Pessoal) session remains on disk separately after flush.
 */
function capturePortableTabs(): Tab[] {
  return extractPortableTabs(useTabsStore.getState().tabs).map((t) => ({
    ...t,
    cursorPosition: { ...t.cursorPosition },
    lastModified: new Date(t.lastModified)
  }))
}

async function rehydrateAfterWorkspaceSwitch(portable: Tab[]): Promise<void> {
  await useSettingsStore.getState().loadFromMain()
  const settings = useSettingsStore.getState()
  useUiStore.getState().setSidebarOpen(settings.sidebarOpen)

  try {
    const { session } = await loadSessionFromMain()
    const sessionTabs = session?.tabs ?? []
    const portableDtos = portable.map(tabToDTO)
    const merged = mergePortableIntoSession(sessionTabs, portableDtos)

    if (merged.tabs.length === 0) {
      useTabsStore.getState().hydrateFromSession(null)
    } else {
      useTabsStore.getState().hydrateFromSession({
        version: SESSION_VERSION,
        tabs: merged.tabs,
        activeTabId: merged.activeTabId
      })
    }
  } catch (error) {
    console.error('[workspace] session hydrate failed', error)
    // Still try to keep portable drafts
    if (portable.length > 0) {
      useTabsStore.getState().hydrateFromSession({
        version: SESSION_VERSION,
        tabs: portable.map(tabToDTO),
        activeTabId: portable[portable.length - 1]?.id ?? null
      })
    } else {
      useTabsStore.getState().hydrateFromSession(null)
    }
  }

  requestExplorerRefresh('workspace-switch')
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
 * Open folder dialog → switch workspace (flush session first; keep portable drafts open).
 */
export async function openWorkspaceFromDialog(): Promise<void> {
  if (!isElectronApiAvailable() || typeof window.api.openWorkspaceDialog !== 'function') {
    reportApiMissing()
    return
  }

  const portable = capturePortableTabs()
  await flushCurrentSession()
  const result = await window.api.openWorkspaceDialog()
  if (!result.ok) {
    if (result.error) showToast(result.error, 'error')
    return
  }
  if (!result.data) return

  applyInfo(result.data)
  await rehydrateAfterWorkspaceSwitch(portable)
  const portableCount = portable.length
  showToast(
    portableCount > 0
      ? `Workspace: ${result.data.name} · ${portableCount} rascunho(s) mantido(s)`
      : `Workspace: ${result.data.name}`,
    'success'
  )
}

export async function openWorkspaceByPath(rootPath: string): Promise<void> {
  if (!rootPath) return
  if (!isElectronApiAvailable() || typeof window.api.openWorkspacePath !== 'function') {
    reportApiMissing()
    return
  }

  const portable = capturePortableTabs()
  await flushCurrentSession()
  const result = await window.api.openWorkspacePath(rootPath)
  if (!result.ok || !result.data) {
    if (result.error) showToast(result.error, 'error')
    return
  }
  applyInfo(result.data)
  await rehydrateAfterWorkspaceSwitch(portable)
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

  const portable = capturePortableTabs()
  await flushCurrentSession()
  const result = await window.api.closeWorkspace()
  if (!result.ok || !result.data) {
    if (result.error) showToast(result.error, 'error')
    return
  }
  applyInfo(result.data)
  await rehydrateAfterWorkspaceSwitch(portable)
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

export async function createWorkspaceNote(
  parentDir?: string,
  fileName?: string,
  content = ''
): Promise<string | null> {
  if (!isElectronApiAvailable() || typeof window.api.createWorkspaceNote !== 'function') {
    reportApiMissing()
    return null
  }
  const result = await window.api.createWorkspaceNote({ parentDir, fileName, content })
  if (!result.ok || !result.data) {
    if (result.error) showToast(result.error, 'error')
    return null
  }
  requestExplorerRefresh('create-note')
  return result.data.path
}

export async function createWorkspaceFolder(
  parentDir?: string,
  folderName?: string
): Promise<string | null> {
  if (!isElectronApiAvailable() || typeof window.api.createWorkspaceFolder !== 'function') {
    reportApiMissing()
    return null
  }
  const result = await window.api.createWorkspaceFolder({ parentDir, folderName })
  if (!result.ok || !result.data) {
    if (result.error) showToast(result.error, 'error')
    return null
  }
  requestExplorerRefresh('create-folder')
  return result.data.path
}

export async function renameWorkspaceEntry(path: string, newName: string): Promise<string | null> {
  if (!isElectronApiAvailable() || typeof window.api.renameWorkspaceEntry !== 'function') {
    reportApiMissing()
    return null
  }
  const result = await window.api.renameWorkspaceEntry({ path, newName })
  if (!result.ok || !result.data) {
    if (result.error) showToast(result.error, 'error')
    return null
  }
  requestExplorerRefresh('rename')
  return result.data.path
}

export async function deleteWorkspaceEntry(path: string): Promise<boolean> {
  if (!isElectronApiAvailable() || typeof window.api.deleteWorkspaceEntry !== 'function') {
    reportApiMissing()
    return false
  }
  const result = await window.api.deleteWorkspaceEntry(path)
  if (!result.ok) {
    if (result.error) showToast(result.error, 'error')
    return false
  }
  requestExplorerRefresh('delete')
  return true
}

export async function importFileIntoWorkspace(
  sourcePath: string,
  destDir?: string
): Promise<string | null> {
  if (!isElectronApiAvailable() || typeof window.api.importFileIntoWorkspace !== 'function') {
    reportApiMissing()
    return null
  }
  const result = await window.api.importFileIntoWorkspace({ sourcePath, destDir })
  if (!result.ok || !result.data) {
    if (result.error) showToast(result.error, 'error')
    return null
  }
  requestExplorerRefresh('import')
  return result.data.path
}

export async function duplicateWorkspaceFile(sourcePath: string): Promise<string | null> {
  if (!isElectronApiAvailable() || typeof window.api.duplicateWorkspaceFile !== 'function') {
    reportApiMissing()
    return null
  }
  const result = await window.api.duplicateWorkspaceFile(sourcePath)
  if (!result.ok || !result.data) {
    if (result.error) showToast(result.error, 'error')
    return null
  }
  requestExplorerRefresh('duplicate')
  return result.data.path
}

export async function showItemInFolder(targetPath: string): Promise<void> {
  if (!isElectronApiAvailable() || typeof window.api.showItemInFolder !== 'function') {
    reportApiMissing()
    return
  }
  const result = await window.api.showItemInFolder(targetPath)
  if (!result.ok && result.error) showToast(result.error, 'error')
}

export async function openPathInOs(targetPath: string): Promise<void> {
  if (!isElectronApiAvailable() || typeof window.api.openPathInOs !== 'function') {
    reportApiMissing()
    return
  }
  const result = await window.api.openPathInOs(targetPath)
  if (!result.ok && result.error) showToast(result.error, 'error')
}

export async function copyTextToClipboard(text: string, toastLabel = 'Copiado'): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    showToast(toastLabel, 'success')
  } catch {
    showToast('Não foi possível copiar.', 'error')
  }
}

// re-export for tests
export { extractPortableTabs, dtoToTab }
