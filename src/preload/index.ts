import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type {
  AppSession,
  IpcResult,
  MenuCommand,
  OpenFileResult,
  SaveFileRequest,
  SaveFileResult
} from '../shared/session'

/**
 * Secure API surface exposed to the renderer via contextBridge.
 */
const api = {
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:get-version'),

  loadSession: (): Promise<IpcResult<AppSession | null>> => ipcRenderer.invoke('session:load'),

  saveSession: (session: AppSession): Promise<IpcResult> =>
    ipcRenderer.invoke('session:save', session),

  clearSession: (): Promise<IpcResult> => ipcRenderer.invoke('session:clear'),

  openFile: (): Promise<OpenFileResult> => ipcRenderer.invoke('file:open'),

  saveFile: (request: SaveFileRequest): Promise<SaveFileResult> =>
    ipcRenderer.invoke('file:save', request),

  saveFileAs: (request: SaveFileRequest): Promise<SaveFileResult> =>
    ipcRenderer.invoke('file:save-as', request),

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

  onRequestQuit: (callback: () => void): (() => void) => {
    const listener = (): void => {
      callback()
    }
    ipcRenderer.on('app:request-quit', listener)
    return () => ipcRenderer.removeListener('app:request-quit', listener)
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
