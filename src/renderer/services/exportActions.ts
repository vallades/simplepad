import { useTabsStore } from '../store/useTabsStore'
import { showToast } from '../store/useToastStore'
import { isElectronApiAvailable } from './sessionBridge'
import {
  buildExportHtmlDocument,
  exportDefaultFileName,
  type ExportTheme
} from '../utils/markdownExport'
import { isResolvedDark } from '../utils/theme'
import { useSettingsStore } from '../store/useSettingsStore'

function currentExportTheme(): ExportTheme {
  const theme = useSettingsStore.getState().theme
  return isResolvedDark(theme) ? 'dark' : 'light'
}

function buildActiveDocumentHtml(): { html: string; title: string } | null {
  const tab = useTabsStore.getState().getActiveTab()
  if (!tab) return null
  const html = buildExportHtmlDocument({
    title: tab.title,
    content: tab.content,
    isMarkdown: tab.isMarkdown,
    theme: currentExportTheme()
  })
  return { html, title: tab.title }
}

/**
 * Export active tab as standalone HTML via native save dialog.
 */
export async function exportActiveAsHtml(): Promise<boolean> {
  const doc = buildActiveDocumentHtml()
  if (!doc) {
    showToast('Nenhuma aba ativa para exportar.', 'error')
    return false
  }

  if (!isElectronApiAvailable() || typeof window.api.exportFile !== 'function') {
    showToast('Exportação indisponível neste ambiente.', 'error')
    return false
  }

  const result = await window.api.exportFile({
    format: 'html',
    content: doc.html,
    defaultPath: exportDefaultFileName(doc.title, 'html')
  })

  if (result.error) {
    showToast(result.error, 'error')
    return false
  }
  if (result.canceled) return false

  showToast(`HTML exportado: ${result.filePath ?? ''}`, 'success')
  return true
}

/**
 * Export active tab as PDF (main process printToPDF from HTML).
 */
export async function exportActiveAsPdf(): Promise<boolean> {
  const doc = buildActiveDocumentHtml()
  if (!doc) {
    showToast('Nenhuma aba ativa para exportar.', 'error')
    return false
  }

  if (!isElectronApiAvailable() || typeof window.api.exportFile !== 'function') {
    showToast('Exportação indisponível neste ambiente.', 'error')
    return false
  }

  const result = await window.api.exportFile({
    format: 'pdf',
    content: doc.html,
    defaultPath: exportDefaultFileName(doc.title, 'pdf')
  })

  if (result.error) {
    showToast(result.error, 'error')
    return false
  }
  if (result.canceled) return false

  showToast(`PDF exportado: ${result.filePath ?? ''}`, 'success')
  return true
}
