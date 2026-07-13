/**
 * Core tab model used across the renderer store and UI.
 */
export interface CursorPosition {
  lineNumber: number
  column: number
}

export interface Tab {
  /** Unique id (uuid) */
  id: string
  /** Display title — "Sem título 1" or file name */
  title: string
  /** Full document content */
  content: string
  /** True when content differs from last saved version */
  isDirty: boolean
  /** Markdown mode (syntax highlighting later via Monaco) */
  isMarkdown: boolean
  /** Absolute path on disk; undefined when never saved */
  filePath?: string
  /** Caret position (1-based line/column, Monaco-compatible) */
  cursorPosition: CursorPosition
  /** Vertical scroll offset of the editor surface */
  scrollPosition: number
  /** Last time content or metadata changed */
  lastModified: Date
}

export type TabCreateInput = Partial<
  Omit<Tab, 'id' | 'cursorPosition' | 'scrollPosition' | 'lastModified'>
> & {
  cursorPosition?: CursorPosition
  scrollPosition?: number
  lastModified?: Date
}
