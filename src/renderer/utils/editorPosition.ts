import type { CursorPosition } from '../types/tab'

/**
 * Converts a caret offset into Monaco-style 1-based line/column.
 */
export function offsetToCursorPosition(text: string, offset: number): CursorPosition {
  const safeOffset = Math.max(0, Math.min(offset, text.length))
  const before = text.slice(0, safeOffset)
  const lines = before.split('\n')
  const last = lines[lines.length - 1] ?? ''
  return {
    lineNumber: lines.length,
    column: last.length + 1
  }
}

/**
 * Converts Monaco-style line/column into a caret offset for textarea.
 */
export function cursorPositionToOffset(text: string, position: CursorPosition): number {
  const lines = text.split('\n')
  const lineIndex = Math.max(0, Math.min(position.lineNumber - 1, lines.length - 1))
  let offset = 0
  for (let i = 0; i < lineIndex; i += 1) {
    offset += (lines[i]?.length ?? 0) + 1 // +1 for '\n'
  }
  const line = lines[lineIndex] ?? ''
  const columnOffset = Math.max(0, Math.min(position.column - 1, line.length))
  return offset + columnOffset
}
