import {
  DEFAULT_SETTINGS,
  MAX_AUTO_SAVE_SECONDS,
  MAX_FONT_SIZE,
  MAX_RECENT_FILES,
  MIN_AUTO_SAVE_SECONDS,
  MIN_FONT_SIZE,
  type AppSettings,
  type ThemePreference
} from './settings'

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark'
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

  return {
    fontFamily,
    fontSize,
    theme,
    autoSaveEnabled,
    autoSaveIntervalSeconds
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
