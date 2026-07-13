import { describe, expect, it } from 'vitest'
import { cursorPositionToOffset, offsetToCursorPosition } from './editorPosition'

describe('editorPosition', () => {
  const sample = 'abc\ndef\nghi'

  it('maps offset to line/column', () => {
    expect(offsetToCursorPosition(sample, 0)).toEqual({ lineNumber: 1, column: 1 })
    expect(offsetToCursorPosition(sample, 3)).toEqual({ lineNumber: 1, column: 4 })
    expect(offsetToCursorPosition(sample, 4)).toEqual({ lineNumber: 2, column: 1 })
    expect(offsetToCursorPosition(sample, sample.length)).toEqual({ lineNumber: 3, column: 4 })
  })

  it('maps line/column back to offset', () => {
    expect(cursorPositionToOffset(sample, { lineNumber: 1, column: 1 })).toBe(0)
    expect(cursorPositionToOffset(sample, { lineNumber: 2, column: 1 })).toBe(4)
    expect(cursorPositionToOffset(sample, { lineNumber: 3, column: 3 })).toBe(10)
  })

  it('round-trips offsets', () => {
    for (let offset = 0; offset <= sample.length; offset += 1) {
      const pos = offsetToCursorPosition(sample, offset)
      expect(cursorPositionToOffset(sample, pos)).toBe(offset)
    }
  })
})
