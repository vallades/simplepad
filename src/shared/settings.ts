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
}

export const DEFAULT_SETTINGS: AppSettings = {
  fontFamily: 'Menlo, Monaco, Consolas, monospace',
  fontSize: 14,
  theme: 'system',
  autoSaveEnabled: true,
  autoSaveIntervalSeconds: 30,
  splitRatio: 0.5,
  splitOrientation: 'horizontal'
}

export const MIN_SPLIT_RATIO = 0.2
export const MAX_SPLIT_RATIO = 0.8

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
