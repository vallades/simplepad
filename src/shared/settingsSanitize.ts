import {
  DEFAULT_SETTINGS,
  MAX_AUTO_SAVE_SECONDS,
  MAX_FONT_SIZE,
  MAX_MERMAID_FONT_SIZE,
  MAX_MERMAID_PADDING,
  MAX_OUTLINE_WIDTH,
  MAX_RECENT_FILES,
  MAX_SIDEBAR_WIDTH,
  MAX_SPLIT_RATIO,
  MIN_AUTO_SAVE_SECONDS,
  MIN_FONT_SIZE,
  MIN_MERMAID_FONT_SIZE,
  MIN_MERMAID_PADDING,
  MIN_OUTLINE_WIDTH,
  MIN_SIDEBAR_WIDTH,
  MIN_SPLIT_RATIO,
  type AppSettings,
  type BacklinksPlacement,
  type SidePanelViewId,
  type SplitOrientation,
  type ThemePreference,
  SIDE_PANEL_VIEWS
} from './settings'

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark'
}

function isSplitOrientation(value: unknown): value is SplitOrientation {
  return value === 'horizontal' || value === 'vertical'
}

/**
 * Pure validation / normalization for settings — unit-testable without Electron.
 */
export function sanitizeSettings(raw: unknown): AppSettings {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_SETTINGS }
  }

  const candidate = raw as Partial<AppSettings>
  const fontFamily =
    typeof candidate.fontFamily === 'string' && candidate.fontFamily.trim().length > 0
      ? candidate.fontFamily.trim()
      : DEFAULT_SETTINGS.fontFamily

  const fontSize = clamp(
    typeof candidate.fontSize === 'number' ? candidate.fontSize : DEFAULT_SETTINGS.fontSize,
    MIN_FONT_SIZE,
    MAX_FONT_SIZE
  )

  const theme = isThemePreference(candidate.theme) ? candidate.theme : DEFAULT_SETTINGS.theme

  const autoSaveEnabled =
    typeof candidate.autoSaveEnabled === 'boolean'
      ? candidate.autoSaveEnabled
      : DEFAULT_SETTINGS.autoSaveEnabled

  const autoSaveIntervalSeconds = clamp(
    typeof candidate.autoSaveIntervalSeconds === 'number'
      ? Math.round(candidate.autoSaveIntervalSeconds)
      : DEFAULT_SETTINGS.autoSaveIntervalSeconds,
    MIN_AUTO_SAVE_SECONDS,
    MAX_AUTO_SAVE_SECONDS
  )

  const splitRatio = clamp(
    typeof candidate.splitRatio === 'number' ? candidate.splitRatio : DEFAULT_SETTINGS.splitRatio,
    MIN_SPLIT_RATIO,
    MAX_SPLIT_RATIO
  )

  const splitOrientation = isSplitOrientation(candidate.splitOrientation)
    ? candidate.splitOrientation
    : DEFAULT_SETTINGS.splitOrientation

  const markdownMathEnabled =
    typeof candidate.markdownMathEnabled === 'boolean'
      ? candidate.markdownMathEnabled
      : DEFAULT_SETTINGS.markdownMathEnabled

  const markdownMermaidEnabled =
    typeof candidate.markdownMermaidEnabled === 'boolean'
      ? candidate.markdownMermaidEnabled
      : DEFAULT_SETTINGS.markdownMermaidEnabled

  const mermaidFontSize = clamp(
    typeof candidate.mermaidFontSize === 'number'
      ? Math.round(candidate.mermaidFontSize)
      : DEFAULT_SETTINGS.mermaidFontSize,
    MIN_MERMAID_FONT_SIZE,
    MAX_MERMAID_FONT_SIZE
  )

  const mermaidCurve =
    candidate.mermaidCurve === 'basis' ||
    candidate.mermaidCurve === 'linear' ||
    candidate.mermaidCurve === 'cardinal' ||
    candidate.mermaidCurve === 'step'
      ? candidate.mermaidCurve
      : DEFAULT_SETTINGS.mermaidCurve

  const mermaidDiagramPadding = clamp(
    typeof candidate.mermaidDiagramPadding === 'number'
      ? Math.round(candidate.mermaidDiagramPadding)
      : DEFAULT_SETTINGS.mermaidDiagramPadding,
    MIN_MERMAID_PADDING,
    MAX_MERMAID_PADDING
  )

  const showMarkdownOutline =
    typeof candidate.showMarkdownOutline === 'boolean'
      ? candidate.showMarkdownOutline
      : DEFAULT_SETTINGS.showMarkdownOutline

  const outlineWidth = clamp(
    typeof candidate.outlineWidth === 'number'
      ? Math.round(candidate.outlineWidth)
      : DEFAULT_SETTINGS.outlineWidth,
    MIN_OUTLINE_WIDTH,
    MAX_OUTLINE_WIDTH
  )

  const newTabDefaultMarkdown =
    typeof candidate.newTabDefaultMarkdown === 'boolean'
      ? candidate.newTabDefaultMarkdown
      : DEFAULT_SETTINGS.newTabDefaultMarkdown

  const autoEnablePreviewOnMarkdown =
    typeof candidate.autoEnablePreviewOnMarkdown === 'boolean'
      ? candidate.autoEnablePreviewOnMarkdown
      : DEFAULT_SETTINGS.autoEnablePreviewOnMarkdown

  const showMarkdownProperties =
    typeof candidate.showMarkdownProperties === 'boolean'
      ? candidate.showMarkdownProperties
      : DEFAULT_SETTINGS.showMarkdownProperties

  const rememberFocusMode =
    typeof candidate.rememberFocusMode === 'boolean'
      ? candidate.rememberFocusMode
      : DEFAULT_SETTINGS.rememberFocusMode

  const focusModeLast =
    typeof candidate.focusModeLast === 'boolean'
      ? candidate.focusModeLast
      : DEFAULT_SETTINGS.focusModeLast

  const sidebarWidth = clamp(
    typeof candidate.sidebarWidth === 'number'
      ? Math.round(candidate.sidebarWidth)
      : DEFAULT_SETTINGS.sidebarWidth,
    MIN_SIDEBAR_WIDTH,
    MAX_SIDEBAR_WIDTH
  )

  const activeView: SidePanelViewId =
    typeof candidate.activeView === 'string' &&
    (SIDE_PANEL_VIEWS as readonly string[]).includes(candidate.activeView)
      ? (candidate.activeView as SidePanelViewId)
      : DEFAULT_SETTINGS.activeView

  // Prefer explicit sidePanelCollapsed; migrate from legacy sidebarOpen
  let sidePanelCollapsed: boolean
  if (typeof candidate.sidePanelCollapsed === 'boolean') {
    sidePanelCollapsed = candidate.sidePanelCollapsed
  } else if (typeof candidate.sidebarOpen === 'boolean') {
    sidePanelCollapsed = !candidate.sidebarOpen
  } else {
    sidePanelCollapsed = DEFAULT_SETTINGS.sidePanelCollapsed
  }

  const sidebarOpen = !sidePanelCollapsed

  const backlinksPlacement: BacklinksPlacement =
    candidate.backlinksPlacement === 'panel' || candidate.backlinksPlacement === 'outline'
      ? candidate.backlinksPlacement
      : DEFAULT_SETTINGS.backlinksPlacement

  return {
    fontFamily,
    fontSize,
    theme,
    autoSaveEnabled,
    autoSaveIntervalSeconds,
    splitRatio,
    splitOrientation,
    markdownMathEnabled,
    markdownMermaidEnabled,
    mermaidFontSize,
    mermaidCurve,
    mermaidDiagramPadding,
    showMarkdownOutline,
    outlineWidth,
    newTabDefaultMarkdown,
    autoEnablePreviewOnMarkdown,
    showMarkdownProperties,
    rememberFocusMode,
    focusModeLast,
    sidebarOpen,
    sidebarWidth,
    activeView,
    sidePanelCollapsed,
    backlinksPlacement
  }
}

/**
 * Keeps the most recent unique absolute paths (max MAX_RECENT_FILES).
 * Newest first.
 */
export function sanitizeRecentFiles(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []

  const seen = new Set<string>()
  const result: string[] = []

  for (const item of raw) {
    if (typeof item !== 'string') continue
    const path = item.trim()
    if (path.length === 0) continue
    if (seen.has(path)) continue
    seen.add(path)
    result.push(path)
    if (result.length >= MAX_RECENT_FILES) break
  }

  return result
}

/** Prepend path and drop duplicates beyond the cap. */
export function pushRecentFile(current: string[], filePath: string): string[] {
  const path = filePath.trim()
  if (!path) return sanitizeRecentFiles(current)
  const rest = current.filter((item) => item !== path)
  return sanitizeRecentFiles([path, ...rest])
}
