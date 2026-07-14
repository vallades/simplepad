import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type {
  AppSession,
  ExportFileRequest,
  ExportFileResult,
  IpcResult,
  MenuCommand,
  OpenFileResult,
  SaveFileRequest,
  SaveFileResult,
  SessionLoadResult,
  UpdateEventPayload
} from '../shared/session'
import type {
  AppSettings,
  ConfirmDialogRequest,
  ConfirmDialogResult,
  OpenPathResult
} from '../shared/settings'

/**
 * Secure API surface exposed to the renderer via contextBridge.
 */
const api = {
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:get-version'),

  /** OS platform for renderer layout (e.g. macOS traffic-light inset). */
  getPlatform: (): NodeJS.Platform => process.platform,

  loadSession: (): Promise<IpcResult<SessionLoadResult>> => ipcRenderer.invoke('session:load'),

  saveSession: (session: AppSession): Promise<IpcResult> =>
    ipcRenderer.invoke('session:save', session),

  clearSession: (): Promise<IpcResult> => ipcRenderer.invoke('session:clear'),

  getSettings: (): Promise<IpcResult<AppSettings>> => ipcRenderer.invoke('settings:get'),

  setSettings: (partial: Partial<AppSettings>): Promise<IpcResult<AppSettings>> =>
    ipcRenderer.invoke('settings:set', partial),

  listRecentFiles: (): Promise<IpcResult<string[]>> => ipcRenderer.invoke('recent:list'),

  addRecentFile: (filePath: string): Promise<IpcResult<string[]>> =>
    ipcRenderer.invoke('recent:add', filePath),

  clearRecentFiles: (): Promise<IpcResult> => ipcRenderer.invoke('recent:clear'),

  showConfirm: (request: ConfirmDialogRequest): Promise<ConfirmDialogResult> =>
    ipcRenderer.invoke('dialog:confirm', request),

  openFile: (): Promise<OpenFileResult> => ipcRenderer.invoke('file:open'),

  openFilePath: (filePath: string): Promise<OpenPathResult> =>
    ipcRenderer.invoke('file:open-path', filePath),

  saveFile: (request: SaveFileRequest): Promise<SaveFileResult> =>
    ipcRenderer.invoke('file:save', request),

  saveFileAs: (request: SaveFileRequest): Promise<SaveFileResult> =>
    ipcRenderer.invoke('file:save-as', request),

  exportFile: (request: ExportFileRequest): Promise<ExportFileResult> =>
    ipcRenderer.invoke('file:export', request),

  checkForUpdates: (): Promise<IpcResult> => ipcRenderer.invoke('update:check'),

  installUpdate: (): Promise<IpcResult> => ipcRenderer.invoke('update:install'),

  setFocusMode: (enabled: boolean): Promise<IpcResult> =>
    ipcRenderer.invoke('window:set-focus-mode', enabled),

  /** Notify main that quit was accepted (true) or canceled (false) */
  respondToQuit: (allow: boolean): void => {
    ipcRenderer.send('app:quit-response', allow)
  },

  onMenuCommand: (callback: (command: MenuCommand) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, command: MenuCommand): void => {
      callback(command)
    }
    ipcRenderer.on('menu:command', listener)
    return () => ipcRenderer.removeListener('menu:command', listener)
  },

  onOpenRecent: (callback: (filePath: string) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, filePath: string): void => {
      callback(filePath)
    }
    ipcRenderer.on('menu:open-recent', listener)
    return () => ipcRenderer.removeListener('menu:open-recent', listener)
  },

  onRequestQuit: (callback: () => void): (() => void) => {
    const listener = (): void => {
      callback()
    }
    ipcRenderer.on('app:request-quit', listener)
    return () => ipcRenderer.removeListener('app:request-quit', listener)
  },

  onUpdateEvent: (callback: (payload: UpdateEventPayload) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, payload: UpdateEventPayload): void => {
      callback(payload)
    }
    ipcRenderer.on('update:event', listener)
    return () => ipcRenderer.removeListener('update:event', listener)
  }
}

export type SimplePadApi = typeof api

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error('Failed to expose preload APIs:', error)
  }
} else {
  // @ts-expect-error non-isolated fallback
  window.electron = electronAPI
  // @ts-expect-error non-isolated fallback
  window.api = api
}
