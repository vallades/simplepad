import { useTabsStore } from '../store/useTabsStore'
import { isMarkdownFile } from '../utils/fileUtils'
import { isUntitledNotesPath } from '../../shared/untitledNotes'
import { isElectronApiAvailable } from './sessionBridge'
import { showToast } from '../store/useToastStore'

function fileNameFromPath(filePath: string): string {
  const parts = filePath.split(/[/\\]/)
  return parts[parts.length - 1] || filePath
}

function reportApiMissing(): void {
  showToast('API de arquivos indisponível neste ambiente.', 'error')
}

/**
 * Opens native dialog and creates a tab per selected file.
 * Focuses an existing tab when the same path is already open.
 */
export async function openFilesFromDisk(): Promise<void> {
  if (!isElectronApiAvailable()) {
    reportApiMissing()
    return
  }

  const result = await window.api.openFile()
  if (result.error) {
    showToast(result.error, 'error')
    return
  }
  if (result.canceled || result.files.length === 0) return

  for (const file of result.files) {
    openOrFocusFile(file.filePath, file.fileName, file.content)
  }
}

/**
 * Opens a known path (recent files). Focuses if already open.
 */
export async function openRecentFile(filePath: string): Promise<void> {
  if (!filePath) return

  const store = useTabsStore.getState()
  const existing = store.tabs.find((tab) => tab.filePath === filePath)
  if (existing) {
    store.switchTab(existing.id)
    return
  }

  if (!isElectronApiAvailable()) {
    reportApiMissing()
    return
  }

  const result = await window.api.openFilePath(filePath)
  if (result.error) {
    showToast(result.error, 'error')
    return
  }
  if (result.canceled || !result.file) return

  openOrFocusFile(result.file.filePath, result.file.fileName, result.file.content)
}

function openOrFocusFile(filePath: string, fileName: string, content: string): void {
  const store = useTabsStore.getState()
  const existing = store.tabs.find((tab) => tab.filePath === filePath)
  if (existing) {
    store.switchTab(existing.id)
    return
  }

  store.createNewTab({
    title: fileName,
    content,
    filePath,
    isDirty: false,
    isMarkdown: isMarkdownFile(fileName)
  })
}

/**
 * Saves the active tab to its path, or prompts Save As when missing / untitled-notes.
 * Manual save on untitled-notes path still opens Save As so the user picks a real location.
 */
export async function saveActiveTab(): Promise<boolean> {
  const store = useTabsStore.getState()
  const tab = store.getActiveTab()
  if (!tab) return false

  if (!isElectronApiAvailable()) {
    reportApiMissing()
    return false
  }

  if (tab.filePath && !isUntitledNotesPath(tab.filePath)) {
    const result = await window.api.saveFile({
      content: tab.content,
      filePath: tab.filePath
    })
    if (result.error) {
      showToast(result.error, 'error')
      return false
    }
    if (result.canceled || !result.filePath) return false
    store.markAsSaved(tab.id, result.filePath)
    return true
  }

  return saveActiveTabAs()
}

/**
 * Saves a specific tab by id (used by auto-save). Only works when filePath is a real path.
 */
export async function saveTabById(tabId: string): Promise<boolean> {
  const store = useTabsStore.getState()
  const tab = store.tabs.find((item) => item.id === tabId)
  if (!tab || !tab.filePath || !tab.isDirty) return false
  if (isUntitledNotesPath(tab.filePath)) return false

  if (!isElectronApiAvailable()) return false

  const result = await window.api.saveFile({
    content: tab.content,
    filePath: tab.filePath
  })

  if (result.error) {
    showToast(`Auto-save falhou: ${result.error}`, 'error')
    return false
  }
  if (result.canceled || !result.filePath) return false

  store.markAsSaved(tab.id, result.filePath)
  return true
}

/**
 * Auto-save an untitled (or untitled-notes) tab into userData/untitled-notes/.
 * Keeps display title as "Sem título N" when possible; session stores the path for restore.
 */
export async function saveUntitledTabById(tabId: string): Promise<boolean> {
  const store = useTabsStore.getState()
  const tab = store.tabs.find((item) => item.id === tabId)
  if (!tab || !tab.isDirty) return false
  if (tab.filePath && !isUntitledNotesPath(tab.filePath)) return false

  if (!isElectronApiAvailable() || typeof window.api.saveUntitledNote !== 'function') {
    return false
  }

  const result = await window.api.saveUntitledNote({
    content: tab.content,
    filePath: tab.filePath
  })

  if (!result.ok || !result.data?.filePath) {
    if (result.error) showToast(`Auto-save (rascunho): ${result.error}`, 'error')
    return false
  }

  // markAsSaved would rename title to filename — keep human "Sem título" title
  store.markAsSaved(tab.id, result.data.filePath)
  if (/^Sem título/.test(tab.title)) {
    store.updateTabTitle(tab.id, tab.title)
  }
  return true
}

/**
 * Always shows the native Save As dialog for the active tab.
 * If previous path was under untitled-notes/, removes that draft after success.
 */
export async function saveActiveTabAs(): Promise<boolean> {
  const store = useTabsStore.getState()
  const tab = store.getActiveTab()
  if (!tab) return false

  if (!isElectronApiAvailable()) {
    reportApiMissing()
    return false
  }

  const previousPath = tab.filePath
  const defaultPath =
    previousPath && !isUntitledNotesPath(previousPath)
      ? previousPath
      : `${tab.title || 'Sem título'}.md`

  const result = await window.api.saveFileAs({
    content: tab.content,
    defaultPath
  })

  if (result.error) {
    showToast(result.error, 'error')
    return false
  }
  if (result.canceled || !result.filePath) return false

  store.markAsSaved(tab.id, result.filePath)
  store.updateTabTitle(tab.id, fileNameFromPath(result.filePath))

  if (previousPath && isUntitledNotesPath(previousPath) && previousPath !== result.filePath) {
    if (typeof window.api.removeUntitledNote === 'function') {
      void window.api.removeUntitledNote(previousPath)
    }
  }

  return true
}

/**
 * Open a filesystem path dropped from Finder/Explorer (.txt / .md).
 */
export async function openDroppedFilePath(filePath: string): Promise<void> {
  if (!filePath) return
  const lower = filePath.toLowerCase()
  if (!lower.endsWith('.txt') && !lower.endsWith('.md') && !lower.endsWith('.markdown')) {
    showToast('Apenas arquivos .txt e .md são suportados.', 'info')
    return
  }
  await openRecentFile(filePath)
}

/**
 * Native confirmation before closing a dirty tab.
 * Returns true if close may proceed.
 */
export async function confirmCloseTab(title: string): Promise<boolean> {
  if (!isElectronApiAvailable()) {
    return window.confirm(`"${title}" tem alterações não salvas.\n\nFechar mesmo assim?`)
  }

  const result = await window.api.showConfirm({
    type: 'warning',
    title: 'Fechar aba',
    message: `"${title}" tem alterações não salvas.`,
    detail:
      'Fechar sem salvar descartará as alterações desta aba (o rascunho da sessão ainda pode ser restaurado).',
    buttons: ['Cancelar', 'Fechar sem salvar'],
    defaultId: 0,
    cancelId: 0
  })

  return result.response === 1
}

/**
 * Native confirmation when quitting with unsaved changes.
 */
export async function confirmQuitWithUnsaved(): Promise<boolean> {
  if (!isElectronApiAvailable()) {
    return window.confirm(
      'Há alterações não salvas em uma ou mais abas.\n\nSair mesmo assim? O rascunho da sessão ainda será guardado.'
    )
  }

  const result = await window.api.showConfirm({
    type: 'warning',
    title: 'Sair do SimplePad',
    message: 'Há alterações não salvas em uma ou mais abas.',
    detail: 'Sair mesmo assim? O rascunho da sessão ainda será guardado.',
    buttons: ['Cancelar', 'Sair'],
    defaultId: 0,
    cancelId: 0
  })

  return result.response === 1
}

export async function clearRecentFilesList(): Promise<void> {
  if (!isElectronApiAvailable()) return
  const result = await window.api.clearRecentFiles()
  if (!result.ok && result.error) {
    showToast(result.error, 'error')
    return
  }
  showToast('Lista de recentes limpa.', 'info')
}
