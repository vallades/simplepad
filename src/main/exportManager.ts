import { BrowserWindow } from 'electron'
import log from 'electron-log/main'
import { getFileManager } from './fileManager'
import type { ExportFileRequest, ExportFileResult, PdfMarginPreset } from '../shared/session'

const HTML_FILTERS: Electron.FileFilter[] = [
  { name: 'HTML', extensions: ['html', 'htm'] },
  { name: 'Todos os arquivos', extensions: ['*'] }
]

const PDF_FILTERS: Electron.FileFilter[] = [
  { name: 'PDF', extensions: ['pdf'] },
  { name: 'Todos os arquivos', extensions: ['*'] }
]

function mapPdfMargins(preset: PdfMarginPreset | undefined): Electron.PrintToPDFOptions['margins'] {
  switch (preset) {
    case 'none':
      return { marginType: 'none' }
    case 'minimal':
      // ~0.4 inch margins
      return {
        marginType: 'custom',
        top: 0.4,
        bottom: 0.4,
        left: 0.4,
        right: 0.4
      }
    case 'default':
    default:
      return { marginType: 'default' }
  }
}

/**
 * Exports HTML (write) or PDF (hidden window + printToPDF).
 */
export async function exportDocument(
  parent: BrowserWindow,
  request: ExportFileRequest
): Promise<ExportFileResult> {
  const files = getFileManager()

  if (request.format === 'html') {
    const targetPath = await files.showSaveDialog(
      parent,
      request.defaultPath ?? 'documento.html',
      HTML_FILTERS,
      'Exportar como HTML'
    )
    if (!targetPath) return { canceled: true }

    await files.writeFile(targetPath, request.content)
    return { canceled: false, filePath: targetPath }
  }

  // PDF via printToPDF
  const targetPath = await files.showSaveDialog(
    parent,
    request.defaultPath ?? 'documento.pdf',
    PDF_FILTERS,
    'Exportar como PDF'
  )
  if (!targetPath) return { canceled: true }

  let printWindow: BrowserWindow | null = null
  try {
    printWindow = new BrowserWindow({
      show: false,
      width: 800,
      height: 1100,
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false
      }
    })

    const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(request.content)}`
    await printWindow.loadURL(dataUrl)

    // Allow layout / KaTeX CSS to settle before rasterizing
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 200)
    })

    const pdfOpts = request.pdfOptions
    const pdfBuffer = await printWindow.webContents.printToPDF({
      printBackground: pdfOpts?.printBackground !== false,
      landscape: Boolean(pdfOpts?.landscape),
      pageSize: 'A4',
      margins: mapPdfMargins(pdfOpts?.margins ?? 'default')
    })

    await files.writeBinaryFile(targetPath, Buffer.from(pdfBuffer))
    log.info('[export] PDF written', targetPath, {
      margins: pdfOpts?.margins ?? 'default',
      landscape: Boolean(pdfOpts?.landscape)
    })
    return { canceled: false, filePath: targetPath }
  } catch (error) {
    log.error('[export] PDF failed', error)
    throw error
  } finally {
    if (printWindow && !printWindow.isDestroyed()) {
      printWindow.destroy()
    }
  }
}
