import type { ElectronAPI } from '@electron-toolkit/preload'
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

export interface SimplePadApi {
  getVersion: () => Promise<string>
  getPlatform: () => NodeJS.Platform
  loadSession: () => Promise<IpcResult<SessionLoadResult>>
  saveSession: (session: AppSession) => Promise<IpcResult>
  clearSession: () => Promise<IpcResult>
  getSettings: () => Promise<IpcResult<AppSettings>>
  setSettings: (partial: Partial<AppSettings>) => Promise<IpcResult<AppSettings>>
  listRecentFiles: () => Promise<IpcResult<string[]>>
  addRecentFile: (filePath: string) => Promise<IpcResult<string[]>>
  clearRecentFiles: () => Promise<IpcResult>
  showConfirm: (request: ConfirmDialogRequest) => Promise<ConfirmDialogResult>
  openFile: () => Promise<OpenFileResult>
  openFilePath: (filePath: string) => Promise<OpenPathResult>
  saveFile: (request: SaveFileRequest) => Promise<SaveFileResult>
  saveFileAs: (request: SaveFileRequest) => Promise<SaveFileResult>
  exportFile: (request: ExportFileRequest) => Promise<ExportFileResult>
  checkForUpdates: () => Promise<IpcResult>
  installUpdate: () => Promise<IpcResult>
  setFocusMode: (enabled: boolean) => Promise<IpcResult>
  respondToQuit: (allow: boolean) => void
  onMenuCommand: (callback: (command: MenuCommand) => void) => () => void
  onOpenRecent: (callback: (filePath: string) => void) => () => void
  onRequestQuit: (callback: () => void) => () => void
  onUpdateEvent: (callback: (payload: UpdateEventPayload) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: SimplePadApi
  }
}

export {}
