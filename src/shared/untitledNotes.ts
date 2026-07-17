/**
 * Helpers for auto-saved untitled tabs under userData/untitled-notes/
 */

/** Format: untitled-YYYYMMDD-HHmmss.md */
export function formatUntitledFileName(date = new Date()): string {
  const y = date.getFullYear()
  const mo = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `untitled-${y}${mo}${d}-${h}${mi}${s}.md`
}

/** True when path points at an auto-saved untitled note (any OS separators). */
export function isUntitledNotesPath(filePath: string | undefined | null): boolean {
  if (!filePath) return false
  const normalized = filePath.replace(/\\/g, '/')
  return (
    normalized.includes('/untitled-notes/') &&
    /untitled-\d{8}-\d{6}\.md$/i.test(normalized.split('/').pop() || '')
  )
}

/** True when tab is untitled for auto-save purposes (no path or untitled-notes path). */
export function isUntitledAutoSaveCandidate(tab: { filePath?: string; isDirty: boolean }): boolean {
  if (!tab.isDirty) return false
  if (!tab.filePath) return true
  return isUntitledNotesPath(tab.filePath)
}
