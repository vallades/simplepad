import { contextBridge, ipcRenderer, webUtils, type IpcRendererEvent } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type {
  AppSession,
  ExportFileRequest,
  ExportFileResult,
  IpcResult,
  MenuCommand,
  OpenFileResult,
  SaveBinaryRequest,
  SaveBinaryResult,
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
import type { NoteTemplate } from '../shared/templates'
import type { TextSnippet } from '../shared/snippets'
import type { ListDirResult, WorkspaceInfo } from '../shared/workspace'

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

  saveBinaryFile: (request: SaveBinaryRequest): Promise<SaveBinaryResult> =>
    ipcRenderer.invoke('file:save-binary', request),

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
  },

  onNewFromTemplate: (callback: (templateId: string) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, templateId: string): void => {
      callback(templateId)
    }
    ipcRenderer.on('menu:new-from-template', listener)
    return () => ipcRenderer.removeListener('menu:new-from-template', listener)
  },

  onOpenRecentWorkspace: (callback: (rootPath: string) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, rootPath: string): void => {
      callback(rootPath)
    }
    ipcRenderer.on('menu:open-recent-workspace', listener)
    return () => ipcRenderer.removeListener('menu:open-recent-workspace', listener)
  },

  onWorkspaceChanged: (callback: (info: WorkspaceInfo) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, info: WorkspaceInfo): void => {
      callback(info)
    }
    ipcRenderer.on('workspace:changed', listener)
    return () => ipcRenderer.removeListener('workspace:changed', listener)
  },

  getWorkspace: (): Promise<IpcResult<WorkspaceInfo>> => ipcRenderer.invoke('workspace:get'),

  listRecentWorkspaces: (): Promise<IpcResult<string[]>> =>
    ipcRenderer.invoke('workspace:list-recent'),

  openWorkspaceDialog: (): Promise<IpcResult<WorkspaceInfo | null>> =>
    ipcRenderer.invoke('workspace:open-dialog'),

  openWorkspacePath: (rootPath: string): Promise<IpcResult<WorkspaceInfo>> =>
    ipcRenderer.invoke('workspace:open-path', rootPath),

  closeWorkspace: (): Promise<IpcResult<WorkspaceInfo>> => ipcRenderer.invoke('workspace:close'),

  listWorkspaceDir: (dirPath?: string): Promise<IpcResult<ListDirResult>> =>
    ipcRenderer.invoke('workspace:list-dir', dirPath),

  createWorkspaceNote: (request: {
    parentDir?: string
    fileName?: string
    content?: string
  }): Promise<IpcResult<{ path: string; name: string; isDirectory: boolean }>> =>
    ipcRenderer.invoke('workspace:create-note', request),

  createWorkspaceFolder: (request: {
    parentDir?: string
    folderName?: string
  }): Promise<IpcResult<{ path: string; name: string; isDirectory: boolean }>> =>
    ipcRenderer.invoke('workspace:create-folder', request),

  renameWorkspaceEntry: (request: {
    path: string
    newName: string
  }): Promise<IpcResult<{ path: string; name: string; isDirectory: boolean }>> =>
    ipcRenderer.invoke('workspace:rename', request),

  deleteWorkspaceEntry: (path: string): Promise<IpcResult> =>
    ipcRenderer.invoke('workspace:delete', path),

  importFileIntoWorkspace: (request: {
    sourcePath: string
    destDir?: string
  }): Promise<IpcResult<{ path: string; name: string; isDirectory: boolean }>> =>
    ipcRenderer.invoke('workspace:import-file', request),

  onWorkspaceFsChanged: (callback: (payload: { rootPath: string }) => void): (() => void) => {
    const listener = (_event: IpcRendererEvent, payload: { rootPath: string }): void => {
      callback(payload)
    }
    ipcRenderer.on('workspace:fs-changed', listener)
    return () => ipcRenderer.removeListener('workspace:fs-changed', listener)
  },

  listTemplates: (): Promise<IpcResult<NoteTemplate[]>> => ipcRenderer.invoke('templates:list'),

  saveAllTemplates: (templates: NoteTemplate[]): Promise<IpcResult<NoteTemplate[]>> =>
    ipcRenderer.invoke('templates:save-all', templates),

  upsertTemplate: (template: NoteTemplate): Promise<IpcResult<NoteTemplate[]>> =>
    ipcRenderer.invoke('templates:upsert', template),

  deleteTemplate: (id: string): Promise<IpcResult<NoteTemplate[]>> =>
    ipcRenderer.invoke('templates:delete', id),

  listSnippets: (): Promise<IpcResult<TextSnippet[]>> => ipcRenderer.invoke('snippets:list'),

  saveAllSnippets: (snippets: TextSnippet[]): Promise<IpcResult<TextSnippet[]>> =>
    ipcRenderer.invoke('snippets:save-all', snippets),

  saveUntitledNote: (request: {
    content: string
    filePath?: string
  }): Promise<IpcResult<{ filePath: string }>> => ipcRenderer.invoke('untitled:save', request),

  removeUntitledNote: (filePath: string): Promise<IpcResult> =>
    ipcRenderer.invoke('untitled:remove', filePath),

  /** Resolve absolute path for a File dropped from the OS (Electron webUtils). */
  getPathForFile: (file: File): string => {
    try {
      return webUtils.getPathForFile(file)
    } catch {
      // Fallback for older Electron / browser test env
      return (file as File & { path?: string }).path ?? ''
    }
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
