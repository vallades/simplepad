import { useTabsStore } from '../store/useTabsStore'
import { isMarkdownFile } from '../utils/fileUtils'
import { isElectronApiAvailable } from './sessionBridge'

function fileNameFromPath(filePath: string): string {
  const parts = filePath.split(/[/\\]/)
  return parts[parts.length - 1] || filePath
}

/**
 * Opens native dialog and creates a tab per selected file.
 */
export async function openFilesFromDisk(): Promise<void> {
  if (!isElectronApiAvailable()) {
    window.alert('API de arquivos indisponível.')
    return
  }

  const result = await window.api.openFile()
  if (result.error) {
    window.alert(result.error)
    return
  }
  if (result.canceled || result.files.length === 0) return

  const store = useTabsStore.getState()
  for (const file of result.files) {
    store.createNewTab({
      title: file.fileName,
      content: file.content,
      filePath: file.filePath,
      isDirty: false,
      isMarkdown: isMarkdownFile(file.fileName)
    })
  }
}

/**
 * Saves the active tab to its path, or prompts Save As when missing.
 */
export async function saveActiveTab(): Promise<boolean> {
  const store = useTabsStore.getState()
  const tab = store.getActiveTab()
  if (!tab) return false

  if (!isElectronApiAvailable()) {
    window.alert('API de arquivos indisponível.')
    return false
  }

  if (tab.filePath) {
    const result = await window.api.saveFile({
      content: tab.content,
      filePath: tab.filePath
    })
    if (result.error) {
      window.alert(result.error)
      return false
    }
    if (result.canceled || !result.filePath) return false
    store.markAsSaved(tab.id, result.filePath)
    return true
  }

  return saveActiveTabAs()
}

/**
 * Always shows the native Save As dialog for the active tab.
 */
export async function saveActiveTabAs(): Promise<boolean> {
  const store = useTabsStore.getState()
  const tab = store.getActiveTab()
  if (!tab) return false

  if (!isElectronApiAvailable()) {
    window.alert('API de arquivos indisponível.')
    return false
  }

  const defaultPath = tab.filePath ?? `${tab.title || 'Sem título'}.txt`
  const result = await window.api.saveFileAs({
    content: tab.content,
    defaultPath
  })

  if (result.error) {
    window.alert(result.error)
    return false
  }
  if (result.canceled || !result.filePath) return false

  store.markAsSaved(tab.id, result.filePath)
  // Ensure title reflects the chosen name even if markAsSaved already did
  store.updateTabTitle(tab.id, fileNameFromPath(result.filePath))
  return true
}

/**
 * Asks the user about a dirty tab before closing. Returns true if close may proceed.
 */
export function confirmCloseTab(title: string): boolean {
  return window.confirm(`"${title}" tem alterações não salvas.\n\nFechar mesmo assim?`)
}

/**
 * Confirms leaving the app with unsaved changes.
 */
export function confirmQuitWithUnsaved(): boolean {
  return window.confirm(
    'Há alterações não salvas em uma ou mais abas.\n\nSair mesmo assim? O rascunho da sessão ainda será guardado.'
  )
}
