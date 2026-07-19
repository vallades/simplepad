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
import type { PdfExportOptions, PdfMarginPreset } from '../../shared/session'

function currentExportTheme(): ExportTheme {
  const theme = useSettingsStore.getState().theme
  return isResolvedDark(theme) ? 'dark' : 'light'
}

function buildActiveDocumentHtml(options?: {
  theme?: ExportTheme
  includeOutline?: boolean
}): { html: string; title: string } | null {
  const tab = useTabsStore.getState().getActiveTab()
  if (!tab) return null
  const html = buildExportHtmlDocument({
    title: tab.title,
    content: tab.content,
    isMarkdown: tab.isMarkdown,
    theme: options?.theme ?? currentExportTheme(),
    includeOutline: options?.includeOutline === true && tab.isMarkdown
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

export interface ExportPdfOptionsInput {
  theme: ExportTheme
  margins: PdfMarginPreset
  includeOutline: boolean
}

/**
 * Export active tab as PDF with options (margins, theme, outline).
 * Call after user confirms ExportPdfModal.
 */
export async function exportActiveAsPdfWithOptions(
  options: ExportPdfOptionsInput
): Promise<boolean> {
  const doc = buildActiveDocumentHtml({
    theme: options.theme,
    includeOutline: options.includeOutline
  })
  if (!doc) {
    showToast('Nenhuma aba ativa para exportar.', 'error')
    return false
  }

  if (!isElectronApiAvailable() || typeof window.api.exportFile !== 'function') {
    showToast('Exportação indisponível neste ambiente.', 'error')
    return false
  }

  const pdfOptions: PdfExportOptions = {
    margins: options.margins,
    printBackground: true
  }

  const result = await window.api.exportFile({
    format: 'pdf',
    content: doc.html,
    defaultPath: exportDefaultFileName(doc.title, 'pdf'),
    pdfOptions
  })

  if (result.error) {
    showToast(result.error, 'error')
    return false
  }
  if (result.canceled) return false

  showToast(`PDF exportado: ${result.filePath ?? ''}`, 'success')
  return true
}

/**
 * Legacy entry: PDF with current theme defaults (no options dialog).
 * Prefer exportActiveAsPdfWithOptions after modal.
 */
export async function exportActiveAsPdf(): Promise<boolean> {
  return exportActiveAsPdfWithOptions({
    theme: currentExportTheme(),
    margins: 'default',
    includeOutline: false
  })
}

export { currentExportTheme }
