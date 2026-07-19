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
  | 'new-tab'
  | 'open-file'
  | 'open-workspace'
  | 'close-workspace'
  | 'save-file'
  | 'save-file-as'
  | 'close-tab'
  | 'quit'
  | 'open-settings'
  | 'clear-recent'
  | 'toggle-preview'
  | 'toggle-markdown'
  | 'export-html'
  | 'export-pdf'
  | 'toggle-focus-mode'
  | 'exit-focus-mode'
  | 'check-updates'
  | 'find'
  | 'replace'
  | 'go-to-line'
  | 'find-in-tabs'
  | 'toggle-split-orientation'
  | 'toggle-outline'
  | 'toggle-properties'
  | 'toggle-sidebar'

/** Events pushed from main (auto-updater) to the renderer. */
export type UpdateEventType =
  'checking' | 'available' | 'not-available' | 'progress' | 'downloaded' | 'error'

export interface UpdateEventPayload {
  type: UpdateEventType
  version?: string
  percent?: number
  message?: string
  /** When true, UI should stay quiet (background check on launch). */
  silent?: boolean
}

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

export type ExportFormat = 'html' | 'pdf'

/** PDF margin presets for printToPDF */
export type PdfMarginPreset = 'none' | 'default' | 'minimal'

export interface PdfExportOptions {
  /** Margin preset for Electron printToPDF */
  margins?: PdfMarginPreset
  /** Prefer printBackground (themes with bg color) */
  printBackground?: boolean
  landscape?: boolean
}

export interface ExportFileRequest {
  format: ExportFormat
  /** Full HTML document (HTML export body or print-ready HTML for PDF) */
  content: string
  defaultPath?: string
  /** Raw binary as base64 — only used when main writes pre-rendered PDF from renderer (unused if main prints) */
  binaryBase64?: string
  /** PDF-only options forwarded to printToPDF */
  pdfOptions?: PdfExportOptions
}

export interface ExportFileResult {
  canceled: boolean
  filePath?: string
  error?: string
}

/** Save SVG text or PNG/binary via native dialog (e.g. Mermaid export). */
export type SaveBinaryFormat = 'svg' | 'png'

export interface SaveBinaryRequest {
  format: SaveBinaryFormat
  /** UTF-8 text (svg) or base64 payload (png) */
  data: string
  /** true when `data` is base64 (png) */
  isBase64?: boolean
  defaultPath?: string
}

export interface SaveBinaryResult {
  canceled: boolean
  filePath?: string
  error?: string
}

export interface OpenFileResult {
  canceled: boolean
  files: OpenedFileDTO[]
  error?: string
}

export interface SessionLoadResult {
  session: AppSession | null
  /** True when stored data existed but was invalid and was cleared */
  recoveredFromCorruption: boolean
  error?: string
}

export interface IpcResult<T = void> {
  ok: boolean
  data?: T
  error?: string
  warning?: string
}
