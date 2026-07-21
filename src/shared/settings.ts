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
  /** Mermaid node font size (10–24) */
  mermaidFontSize: number
  /** Mermaid flowchart edge curve */
  mermaidCurve: 'basis' | 'linear' | 'cardinal' | 'step'
  /** Mermaid diagram padding / spacing (4–40) */
  mermaidDiagramPadding: number
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
  /** Show YAML frontmatter as Properties cards in the Markdown Preview */
  showMarkdownProperties: boolean
  /** Restore focus mode on next launch if left enabled */
  rememberFocusMode: boolean
  /** Last known focus-mode state (when rememberFocusMode is true) */
  focusModeLast: boolean
  /**
   * @deprecated Prefer sidePanelCollapsed (inverted). Kept for migration.
   * When true, side panel is open (not collapsed).
   */
  sidebarOpen: boolean
  /** Side panel width in px (Activity Bar companion column) */
  sidebarWidth: number
  /** Active Activity Bar view id */
  activeView: SidePanelViewId
  /** When true, only Activity Bar is visible (side panel hidden) */
  sidePanelCollapsed: boolean
  /**
   * Where to show backlinks for the active note:
   * - outline: section inside Outline view
   * - panel: dedicated Activity Bar icon + Side Panel view
   */
  backlinksPlacement: BacklinksPlacement
}

/** Activity Bar / Side Panel views (order: Explorer first) */
export type SidePanelViewId = 'explorer' | 'outline' | 'timeline' | 'search' | 'backlinks'

export type BacklinksPlacement = 'outline' | 'panel'

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
  mermaidFontSize: 14,
  mermaidCurve: 'basis',
  mermaidDiagramPadding: 12,
  showMarkdownOutline: true,
  outlineWidth: 220,
  newTabDefaultMarkdown: false,
  autoEnablePreviewOnMarkdown: true,
  showMarkdownProperties: true,
  rememberFocusMode: true,
  focusModeLast: false,
  sidebarOpen: true,
  sidebarWidth: 240,
  activeView: 'explorer',
  sidePanelCollapsed: false,
  backlinksPlacement: 'outline'
}

export const MIN_SIDEBAR_WIDTH = 160
export const MAX_SIDEBAR_WIDTH = 480
export const DEFAULT_SIDEBAR_WIDTH = 240
export const ACTIVITY_BAR_WIDTH = 48
export const SIDE_PANEL_TRANSITION_MS = 300

export const SIDE_PANEL_VIEWS: readonly SidePanelViewId[] = [
  'explorer',
  'outline',
  'timeline',
  'search',
  'backlinks'
] as const

export const MIN_MERMAID_FONT_SIZE = 10
export const MAX_MERMAID_FONT_SIZE = 24
export const MIN_MERMAID_PADDING = 4
export const MAX_MERMAID_PADDING = 40

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
