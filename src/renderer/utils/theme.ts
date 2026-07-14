import type { ThemePreference } from '../../shared/settings'

/**
 * Applies light/dark document classes for Tailwind + native UI chrome.
 * Uses class-based dark mode so forced themes work regardless of OS.
 */
function systemPrefersDark(): boolean {
  if (typeof window === 'undefined') return false
  if (typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function applyThemeToDocument(theme: ThemePreference): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  const isDark = theme === 'dark' || (theme === 'system' && systemPrefersDark())

  root.classList.toggle('dark', isDark)
  root.style.colorScheme = isDark ? 'dark' : 'light'
}

/** Returns whether the resolved theme is currently dark. */
export function isResolvedDark(theme: ThemePreference): boolean {
  if (theme === 'dark') return true
  if (theme === 'light') return false
  return systemPrefersDark()
}
