import type { ElectronAPI } from '@electron-toolkit/preload'
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
  saveBinaryFile: (request: SaveBinaryRequest) => Promise<SaveBinaryResult>
  checkForUpdates: () => Promise<IpcResult>
  installUpdate: () => Promise<IpcResult>
  setFocusMode: (enabled: boolean) => Promise<IpcResult>
  respondToQuit: (allow: boolean) => void
  onMenuCommand: (callback: (command: MenuCommand) => void) => () => void
  onOpenRecent: (callback: (filePath: string) => void) => () => void
  onOpenRecentWorkspace: (callback: (rootPath: string) => void) => () => void
  onWorkspaceChanged: (callback: (info: WorkspaceInfo) => void) => () => void
  onRequestQuit: (callback: () => void) => () => void
  onUpdateEvent: (callback: (payload: UpdateEventPayload) => void) => () => void
  onNewFromTemplate: (callback: (templateId: string) => void) => () => void
  getWorkspace: () => Promise<IpcResult<WorkspaceInfo>>
  listRecentWorkspaces: () => Promise<IpcResult<string[]>>
  openWorkspaceDialog: () => Promise<IpcResult<WorkspaceInfo | null>>
  openWorkspacePath: (rootPath: string) => Promise<IpcResult<WorkspaceInfo>>
  closeWorkspace: () => Promise<IpcResult<WorkspaceInfo>>
  listWorkspaceDir: (dirPath?: string) => Promise<IpcResult<ListDirResult>>
  searchWorkspace: (request: {
    query: string
    caseSensitive?: boolean
    maxHits?: number
  }) => Promise<IpcResult<import('../shared/workspaceSearch').WorkspaceSearchHit[]>>
  listTimeline: (limit?: number) => Promise<
    IpcResult<
      Array<{
        filePath: string
        title: string
        lastModified: string
        workspaceLabel: string
        source: 'recent' | 'workspace'
      }>
    >
  >
  resolveWikiNote: (targetName: string) => Promise<IpcResult<{ filePath: string } | null>>
  createWorkspaceNote: (request: {
    parentDir?: string
    fileName?: string
    content?: string
  }) => Promise<IpcResult<{ path: string; name: string; isDirectory: boolean }>>
  createWorkspaceFolder: (request: {
    parentDir?: string
    folderName?: string
  }) => Promise<IpcResult<{ path: string; name: string; isDirectory: boolean }>>
  renameWorkspaceEntry: (request: {
    path: string
    newName: string
  }) => Promise<IpcResult<{ path: string; name: string; isDirectory: boolean }>>
  deleteWorkspaceEntry: (path: string) => Promise<IpcResult>
  importFileIntoWorkspace: (request: {
    sourcePath: string
    destDir?: string
  }) => Promise<IpcResult<{ path: string; name: string; isDirectory: boolean }>>
  duplicateWorkspaceFile: (
    sourcePath: string
  ) => Promise<IpcResult<{ path: string; name: string; isDirectory: boolean }>>
  showItemInFolder: (targetPath: string) => Promise<IpcResult>
  openPathInOs: (targetPath: string) => Promise<IpcResult>
  onWorkspaceFsChanged: (callback: (payload: { rootPath: string }) => void) => () => void
  listTemplates: () => Promise<IpcResult<NoteTemplate[]>>
  saveAllTemplates: (templates: NoteTemplate[]) => Promise<IpcResult<NoteTemplate[]>>
  upsertTemplate: (template: NoteTemplate) => Promise<IpcResult<NoteTemplate[]>>
  deleteTemplate: (id: string) => Promise<IpcResult<NoteTemplate[]>>
  listSnippets: () => Promise<IpcResult<TextSnippet[]>>
  saveAllSnippets: (snippets: TextSnippet[]) => Promise<IpcResult<TextSnippet[]>>
  saveUntitledNote: (request: {
    content: string
    filePath?: string
  }) => Promise<IpcResult<{ filePath: string }>>
  removeUntitledNote: (filePath: string) => Promise<IpcResult>
  getPathForFile: (file: File) => string
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: SimplePadApi
  }
}

export {}
