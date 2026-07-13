/**
 * Shared session / IPC contracts (main + preload + renderer).
 */

export interface CursorPositionDTO {
  lineNumber: number
  column: number
}

/** Serializable tab snapshot stored on disk / sent over IPC */
export interface TabDTO {
  id: string
  title: string
  content: string
  isDirty: boolean
  isMarkdown: boolean
  filePath?: string
  cursorPosition: CursorPositionDTO
  scrollPosition: number
  /** ISO date string when serialized */
  lastModified: string
}

export interface AppSession {
  version: number
  tabs: TabDTO[]
  activeTabId: string | null
}

export const SESSION_VERSION = 1

export type MenuCommand =
  'new-tab' | 'open-file' | 'save-file' | 'save-file-as' | 'close-tab' | 'quit'

export interface OpenedFileDTO {
  filePath: string
  fileName: string
  content: string
}

export interface SaveFileRequest {
  content: string
  filePath?: string
  defaultPath?: string
}

export interface SaveFileResult {
  canceled: boolean
  filePath?: string
  error?: string
}

export interface OpenFileResult {
  canceled: boolean
  files: OpenedFileDTO[]
  error?: string
}

export interface IpcResult<T = void> {
  ok: boolean
  data?: T
  error?: string
}
