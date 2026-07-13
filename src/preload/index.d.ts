import type { ElectronAPI } from '@electron-toolkit/preload'
import type {
  AppSession,
  IpcResult,
  MenuCommand,
  OpenFileResult,
  SaveFileRequest,
  SaveFileResult
} from '../shared/session'

export interface SimplePadApi {
  getVersion: () => Promise<string>
  loadSession: () => Promise<IpcResult<AppSession | null>>
  saveSession: (session: AppSession) => Promise<IpcResult>
  clearSession: () => Promise<IpcResult>
  openFile: () => Promise<OpenFileResult>
  saveFile: (request: SaveFileRequest) => Promise<SaveFileResult>
  saveFileAs: (request: SaveFileRequest) => Promise<SaveFileResult>
  respondToQuit: (allow: boolean) => void
  onMenuCommand: (callback: (command: MenuCommand) => void) => () => void
  onRequestQuit: (callback: () => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: SimplePadApi
  }
}

export {}
