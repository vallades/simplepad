import { describe, expect, it } from 'vitest'
import {
  formatUntitledFileName,
  isUntitledAutoSaveCandidate,
  isUntitledNotesPath
} from './untitledNotes'

describe('formatUntitledFileName', () => {
  it('formats untitled-YYYYMMDD-HHmmss.md', () => {
    const name = formatUntitledFileName(new Date(2026, 6, 16, 9, 5, 7))
    expect(name).toBe('untitled-20260716-090507.md')
  })
})

describe('isUntitledNotesPath', () => {
  it('detects untitled-notes paths on posix and windows', () => {
    expect(
      isUntitledNotesPath(
        '/Users/a/Library/Application Support/simplepad/untitled-notes/untitled-20260716-120000.md'
      )
    ).toBe(true)
    expect(
      isUntitledNotesPath(
        'C:\\Users\\a\\AppData\\Roaming\\simplepad\\untitled-notes\\untitled-20260716-120000.md'
      )
    ).toBe(true)
    expect(isUntitledNotesPath('/tmp/note.md')).toBe(false)
    expect(isUntitledNotesPath(undefined)).toBe(false)
  })
})

describe('isUntitledAutoSaveCandidate', () => {
  it('includes dirty without path and dirty untitled-notes', () => {
    expect(isUntitledAutoSaveCandidate({ isDirty: true })).toBe(true)
    expect(
      isUntitledAutoSaveCandidate({
        isDirty: true,
        filePath: '/x/untitled-notes/untitled-20260716-120000.md'
      })
    ).toBe(true)
    expect(isUntitledAutoSaveCandidate({ isDirty: false })).toBe(false)
    expect(isUntitledAutoSaveCandidate({ isDirty: true, filePath: '/x/real.md' })).toBe(false)
  })
})
