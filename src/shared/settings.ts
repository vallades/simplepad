/**
 * App settings + recent files contracts (main + preload + renderer).
 */

export type ThemePreference = 'system' | 'light' | 'dark'

/** horizontal = side-by-side (Editor | Preview); vertical = stacked (Editor / Preview) */
export type SplitOrientation = 'horizontal' | 'vertical'

export interface AppSettings {
  fontFamily: string
  fontSize: number
  theme: ThemePreference
  autoSaveEnabled: boolean
  /** Interval in seconds (clamped 5–600) */
  autoSaveIntervalSeconds: number
  /** Fraction of workspace for the editor pane when split is on (0.2–0.8) */
  splitRatio: number
  splitOrientation: SplitOrientation
  /** Render $…$ / $$…$$ with KaTeX in Preview */
  markdownMathEnabled: boolean
  /** Render ```mermaid blocks in Preview */
  markdownMermaidEnabled: boolean
  /** Show Outline (TOC) to the right of Preview when Markdown + Split View */
  showMarkdownOutline: boolean
  /** Outline panel width in px (clamped MIN_OUTLINE_WIDTH–MAX_OUTLINE_WIDTH) */
  outlineWidth: number
  /**
   * When true, new "Sem título" tabs start as Markdown.
   * Default false → Plain Text until the user switches format.
   */
  newTabDefaultMarkdown: boolean
  /**
   * When enabling Markdown on a tab, automatically turn Split View / Preview on.
   */
  autoEnablePreviewOnMarkdown: boolean
}

export const DEFAULT_SETTINGS: AppSettings = {
  fontFamily: 'Menlo, Monaco, Consolas, monospace',
  fontSize: 14,
  theme: 'system',
  autoSaveEnabled: true,
  autoSaveIntervalSeconds: 30,
  splitRatio: 0.5,
  splitOrientation: 'horizontal',
  markdownMathEnabled: true,
  markdownMermaidEnabled: true,
  showMarkdownOutline: true,
  outlineWidth: 220,
  newTabDefaultMarkdown: false,
  autoEnablePreviewOnMarkdown: true
}

export const MIN_SPLIT_RATIO = 0.2
export const MAX_SPLIT_RATIO = 0.8
export const MIN_OUTLINE_WIDTH = 140
export const MAX_OUTLINE_WIDTH = 360
export const DEFAULT_OUTLINE_WIDTH = 220

/** Common monospaced faces for the settings picker */
export const MONOSPACE_FONT_OPTIONS: readonly string[] = [
  'Menlo, Monaco, Consolas, monospace',
  'Monaco, Menlo, monospace',
  'Consolas, "Courier New", monospace',
  '"SF Mono", Menlo, monospace',
  '"Cascadia Code", Consolas, monospace',
  '"JetBrains Mono", Menlo, monospace',
  '"Fira Code", Menlo, monospace',
  '"Courier New", Courier, monospace',
  'monospace'
]

export const MAX_RECENT_FILES = 10

export const MIN_FONT_SIZE = 10
export const MAX_FONT_SIZE = 32
export const MIN_AUTO_SAVE_SECONDS = 5
export const MAX_AUTO_SAVE_SECONDS = 600

export interface ConfirmDialogRequest {
  type?: 'none' | 'info' | 'error' | 'question' | 'warning'
  title: string
  message: string
  detail?: string
  buttons: string[]
  defaultId?: number
  cancelId?: number
}

export interface ConfirmDialogResult {
  response: number
  canceled: boolean
}

export interface OpenPathResult {
  canceled: boolean
  file?: {
    filePath: string
    fileName: string
    content: string
  }
  error?: string
}
