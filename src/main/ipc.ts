import { BrowserWindow, app, dialog, ipcMain } from 'electron'
import log from 'electron-log/main'
import { getSessionManager } from './sessionManager'
import { getFileManager } from './fileManager'
import { getPreferencesManager } from './preferencesManager'
import { refreshAppMenu } from './menu'
import { allowQuitAndExit, cancelQuit } from './quitController'
import type {
  AppSession,
  ExportFileRequest,
  ExportFileResult,
  IpcResult,
  OpenFileResult,
  SaveFileRequest,
  SaveFileResult,
  SessionLoadResult
} from '../shared/session'
import { exportDocument } from './exportManager'
import type {
  AppSettings,
  ConfirmDialogRequest,
  ConfirmDialogResult,
  OpenPathResult
} from '../shared/settings'
import { DEFAULT_SETTINGS } from '../shared/settings'
import { sanitizeSettings } from '../shared/settingsSanitize'

function getSenderWindow(event: Electron.IpcMainInvokeEvent): BrowserWindow | null {
  return BrowserWindow.fromWebContents(event.sender)
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function trackRecent(filePath: string): void {
  getPreferencesManager().addRecentFile(filePath)
  refreshAppMenu()
}

/**
 * Registers all IPC handlers used by the renderer via contextBridge.
 */
export function registerIpcHandlers(): void {
  const sessions = getSessionManager()
  const files = getFileManager()
  const prefs = getPreferencesManager()

  ipcMain.handle('app:get-version', (): string => app.getVersion())

  ipcMain.handle('session:load', (): IpcResult<SessionLoadResult> => {
    try {
      const result = sessions.loadSessionDetailed()
      return { ok: true, data: result }
    } catch (error) {
      log.error('[ipc] session:load', error)
      return {
        ok: false,
        error: errorMessage(error),
        data: { session: null, recoveredFromCorruption: false, error: errorMessage(error) }
      }
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

  ipcMain.handle('settings:get', (): IpcResult<AppSettings> => {
    try {
      return { ok: true, data: prefs.getSettings() }
    } catch (error) {
      log.error('[ipc] settings:get', error)
      return { ok: false, error: errorMessage(error), data: { ...DEFAULT_SETTINGS } }
    }
  })

  ipcMain.handle(
    'settings:set',
    (_event, partial: Partial<AppSettings>): IpcResult<AppSettings> => {
      try {
        const next = prefs.setSettings(sanitizeSettings({ ...prefs.getSettings(), ...partial }))
        return { ok: true, data: next }
      } catch (error) {
        log.error('[ipc] settings:set', error)
        return { ok: false, error: errorMessage(error) }
      }
    }
  )

  ipcMain.handle('recent:list', (): IpcResult<string[]> => {
    try {
      return { ok: true, data: prefs.getRecentFiles() }
    } catch (error) {
      log.error('[ipc] recent:list', error)
      return { ok: false, error: errorMessage(error), data: [] }
    }
  })

  ipcMain.handle('recent:add', (_event, filePath: string): IpcResult<string[]> => {
    try {
      if (typeof filePath !== 'string' || filePath.trim().length === 0) {
        return { ok: true, data: prefs.getRecentFiles() }
      }
      const next = prefs.addRecentFile(filePath)
      refreshAppMenu()
      return { ok: true, data: next }
    } catch (error) {
      log.error('[ipc] recent:add', error)
      return { ok: false, error: errorMessage(error), data: [] }
    }
  })

  ipcMain.handle('recent:clear', (): IpcResult => {
    try {
      prefs.clearRecentFiles()
      refreshAppMenu()
      return { ok: true }
    } catch (error) {
      log.error('[ipc] recent:clear', error)
      return { ok: false, error: errorMessage(error) }
    }
  })

  ipcMain.handle(
    'dialog:confirm',
    async (event, request: ConfirmDialogRequest): Promise<ConfirmDialogResult> => {
      const window = getSenderWindow(event)
      if (!window) {
        return { response: request.cancelId ?? 0, canceled: true }
      }

      try {
        const buttons =
          Array.isArray(request.buttons) && request.buttons.length > 0
            ? request.buttons
            : ['Cancelar', 'OK']
        const cancelId = request.cancelId ?? 0
        const result = await dialog.showMessageBox(window, {
          type: request.type ?? 'question',
          title: request.title || 'SimplePad',
          message: request.message || '',
          detail: request.detail,
          buttons,
          defaultId: request.defaultId ?? 0,
          cancelId,
          noLink: true
        })
        return {
          response: result.response,
          canceled: result.response === cancelId
        }
      } catch (error) {
        log.error('[ipc] dialog:confirm', error)
        return { response: request.cancelId ?? 0, canceled: true }
      }
    }
  )

  ipcMain.handle('file:open', async (event): Promise<OpenFileResult> => {
    const window = getSenderWindow(event)
    if (!window) {
      return { canceled: true, files: [], error: 'Janela não encontrada' }
    }
    try {
      const opened = await files.showOpenDialog(window)
      for (const file of opened) {
        trackRecent(file.filePath)
      }
      return { canceled: opened.length === 0, files: opened }
    } catch (error) {
      log.error('[ipc] file:open', error)
      return { canceled: true, files: [], error: errorMessage(error) }
    }
  })

  ipcMain.handle('file:open-path', async (_event, filePath: string): Promise<OpenPathResult> => {
    if (typeof filePath !== 'string' || filePath.trim().length === 0) {
      return { canceled: true, error: 'Caminho inválido' }
    }
    try {
      const file = await files.openByPath(filePath.trim())
      trackRecent(file.filePath)
      return { canceled: false, file }
    } catch (error) {
      log.error('[ipc] file:open-path', error)
      return { canceled: true, error: errorMessage(error) }
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
      trackRecent(targetPath)
      return { canceled: false, filePath: targetPath }
    } catch (error) {
      log.error('[ipc] file:save', error)
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
        trackRecent(targetPath)
        return { canceled: false, filePath: targetPath }
      } catch (error) {
        log.error('[ipc] file:save-as', error)
        return { canceled: true, error: errorMessage(error) }
      }
    }
  )

  ipcMain.handle(
    'file:export',
    async (event, request: ExportFileRequest): Promise<ExportFileResult> => {
      const window = getSenderWindow(event)
      if (!window) {
        return { canceled: true, error: 'Janela não encontrada' }
      }
      if (!request || (request.format !== 'html' && request.format !== 'pdf')) {
        return { canceled: true, error: 'Formato de exportação inválido' }
      }
      if (typeof request.content !== 'string') {
        return { canceled: true, error: 'Conteúdo inválido' }
      }

      try {
        return await exportDocument(window, request)
      } catch (error) {
        log.error('[ipc] file:export', error)
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
