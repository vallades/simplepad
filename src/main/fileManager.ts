import { dialog, type BrowserWindow } from 'electron'
import { readFile, writeFile, access } from 'fs/promises'
import { constants } from 'fs'
import { basename } from 'path'
import log from 'electron-log/main'
import type { OpenedFileDTO } from '../shared/session'

const TEXT_FILTERS: Electron.FileFilter[] = [
  { name: 'Documentos de texto', extensions: ['txt', 'md'] },
  { name: 'Markdown', extensions: ['md', 'markdown'] },
  { name: 'Texto puro', extensions: ['txt'] },
  { name: 'Todos os arquivos', extensions: ['*'] }
]

export class FileManager {
  /**
   * Native open dialog (multi-select) → path + UTF-8 content for each file.
   */
  async showOpenDialog(window: BrowserWindow): Promise<OpenedFileDTO[]> {
    const result = await dialog.showOpenDialog(window, {
      title: 'Abrir arquivo',
      properties: ['openFile', 'multiSelections'],
      filters: TEXT_FILTERS
    })

    if (result.canceled || result.filePaths.length === 0) {
      return []
    }

    const files: OpenedFileDTO[] = []
    for (const filePath of result.filePaths) {
      try {
        const content = await this.readFile(filePath)
        files.push({
          filePath,
          fileName: basename(filePath),
          content
        })
      } catch (error) {
        log.error('[FileManager] failed to read', filePath, error)
        throw error
      }
    }

    log.info(`[FileManager] opened ${files.length} file(s)`)
    return files
  }

  /**
   * Native save dialog → absolute path chosen by the user, or null if canceled.
   */
  async showSaveDialog(
    window: BrowserWindow,
    defaultPath?: string,
    filters: Electron.FileFilter[] = TEXT_FILTERS,
    title = 'Salvar como'
  ): Promise<string | null> {
    const result = await dialog.showSaveDialog(window, {
      title,
      defaultPath: defaultPath ?? 'Sem título.txt',
      filters
    })

    if (result.canceled || !result.filePath) {
      return null
    }

    return result.filePath
  }

  /** Reads a file as UTF-8 text. */
  async readFile(filePath: string): Promise<string> {
    try {
      await access(filePath, constants.R_OK)
      return await readFile(filePath, 'utf-8')
    } catch (error) {
      log.error('[FileManager] readFile error:', filePath, error)
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Não foi possível ler o arquivo:\n${filePath}\n\n${message}`)
    }
  }

  /** Writes UTF-8 text to disk (creates or overwrites). */
  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      await writeFile(filePath, content, { encoding: 'utf-8' })
      log.info('[FileManager] wrote', filePath, `(${content.length} chars)`)
    } catch (error) {
      log.error('[FileManager] writeFile error:', filePath, error)
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Não foi possível salvar o arquivo:\n${filePath}\n\n${message}`)
    }
  }

  /** Writes binary data (PDF export). */
  async writeBinaryFile(filePath: string, data: Buffer): Promise<void> {
    try {
      await writeFile(filePath, data)
      log.info('[FileManager] wrote binary', filePath, `(${data.byteLength} bytes)`)
    } catch (error) {
      log.error('[FileManager] writeBinaryFile error:', filePath, error)
      const message = error instanceof Error ? error.message : String(error)
      throw new Error(`Não foi possível salvar o arquivo:\n${filePath}\n\n${message}`)
    }
  }

  /** Reads a known path into an OpenedFileDTO (for recent files / re-open). */
  async openByPath(filePath: string): Promise<OpenedFileDTO> {
    const content = await this.readFile(filePath)
    return {
      filePath,
      fileName: basename(filePath),
      content
    }
  }
}

let singleton: FileManager | null = null

export function getFileManager(): FileManager {
  if (!singleton) singleton = new FileManager()
  return singleton
}
