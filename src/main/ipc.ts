import { BrowserWindow, app, dialog, ipcMain } from 'electron'
import log from 'electron-log/main'
import { getSessionManager } from './sessionManager'
import { getFileManager } from './fileManager'
import { allowQuitAndExit, cancelQuit } from './quitController'
import type {
  AppSession,
  IpcResult,
  OpenFileResult,
  SaveFileRequest,
  SaveFileResult
} from '../shared/session'

function getSenderWindow(event: Electron.IpcMainInvokeEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender)
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Registers all IPC handlers used by the renderer via contextBridge.
 */
export function registerIpcHandlers(): void {
  const sessions = getSessionManager()
  const files = getFileManager()

  ipcMain.handle('app:get-version', (): string => app.getVersion())

  ipcMain.handle('session:load', (): IpcResult<AppSession | null> => {
    try {
      const session = sessions.loadSession()
      return { ok: true, data: session }
    } catch (error) {
      log.error('[ipc] session:load', error)
      return { ok: false, error: errorMessage(error), data: null }
    }
  })

  ipcMain.handle('session:save', (_event, session: AppSession): IpcResult => {
    try {
      sessions.saveSession(session)
      return { ok: true }
    } catch (error) {
      log.error('[ipc] session:save', error)
      return { ok: false, error: errorMessage(error) }
    }
  })

  ipcMain.handle('session:clear', (): IpcResult => {
    try {
      sessions.clearSession()
      return { ok: true }
    } catch (error) {
      log.error('[ipc] session:clear', error)
      return { ok: false, error: errorMessage(error) }
    }
  })

  ipcMain.handle('file:open', async (event): Promise<OpenFileResult> => {
    const window = getSenderWindow(event)
    if (!window) {
      return { canceled: true, files: [], error: 'Janela não encontrada' }
    }
    try {
      const opened = await files.showOpenDialog(window)
      return { canceled: opened.length === 0, files: opened }
    } catch (error) {
      log.error('[ipc] file:open', error)
      return { canceled: true, files: [], error: errorMessage(error) }
    }
  })

  ipcMain.handle('file:save', async (event, request: SaveFileRequest): Promise<SaveFileResult> => {
    const window = getSenderWindow(event)
    if (!window) {
      return { canceled: true, error: 'Janela não encontrada' }
    }

    try {
      let targetPath = request.filePath
      if (!targetPath) {
        targetPath = (await files.showSaveDialog(window, request.defaultPath)) ?? undefined
        if (!targetPath) {
          return { canceled: true }
        }
      }
      await files.writeFile(targetPath, request.content)
      return { canceled: false, filePath: targetPath }
    } catch (error) {
      log.error('[ipc] file:save', error)
      void dialog.showErrorBox('Erro ao salvar', errorMessage(error))
      return { canceled: true, error: errorMessage(error) }
    }
  })

  ipcMain.handle(
    'file:save-as',
    async (event, request: SaveFileRequest): Promise<SaveFileResult> => {
      const window = getSenderWindow(event)
      if (!window) {
        return { canceled: true, error: 'Janela não encontrada' }
      }

      try {
        const targetPath = await files.showSaveDialog(window, request.defaultPath)
        if (!targetPath) {
          return { canceled: true }
        }
        await files.writeFile(targetPath, request.content)
        return { canceled: false, filePath: targetPath }
      } catch (error) {
        log.error('[ipc] file:save-as', error)
        void dialog.showErrorBox('Erro ao salvar', errorMessage(error))
        return { canceled: true, error: errorMessage(error) }
      }
    }
  )

  ipcMain.on('app:quit-response', (_event, allow: boolean) => {
    if (allow) {
      allowQuitAndExit()
    } else {
      cancelQuit()
    }
  })

  log.info('[ipc] handlers registered')
}
