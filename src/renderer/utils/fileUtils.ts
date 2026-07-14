/**
 * File name and text helpers used by the renderer and tests.
 */

export function getFileExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.')
  if (lastDot <= 0 || lastDot === fileName.length - 1) {
    return ''
  }
  return fileName.slice(lastDot + 1).toLowerCase()
}

export function isMarkdownFile(fileName: string): boolean {
  const ext = getFileExtension(fileName)
  return ext === 'md' || ext === 'markdown'
}

export function sanitizeFilename(name: string): string {
  // Strip path separators, reserved characters and ASCII control codes
  const unsafe = new RegExp(
    `[<>:"/\\\\|?*${String.fromCharCode(0)}-${String.fromCharCode(31)}]`,
    'g'
  )
  return name.replace(unsafe, '_').replace(/\s+/g, ' ').trim().slice(0, 200)
}

export function countWords(text: string): number {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

export function titleFromPath(filePath: string): string {
  const segments = filePath.split(/[/\\]/)
  return segments[segments.length - 1] || 'Sem título'
}

/** Compact path for status bar (keeps last two segments when long). */
export function shortenPath(filePath: string): string {
  if (filePath.length <= 40) return filePath
  const parts = filePath.split(/[/\\]/)
  if (parts.length <= 2) return filePath
  return `…/${parts.slice(-2).join('/')}`
}
