import { describe, expect, it } from 'vitest'
import { collectAutoSaveTargets, intervalMsFromSeconds } from './autoSave'

describe('collectAutoSaveTargets', () => {
  it('includes dirty disk tabs and dirty untitled tabs', () => {
    const targets = collectAutoSaveTargets([
      { id: '1', filePath: '/a.txt', isDirty: true },
      { id: '2', filePath: '/b.txt', isDirty: false },
      { id: '3', isDirty: true },
      { id: '4', filePath: '/c.md', isDirty: true },
      {
        id: '5',
        filePath:
          '/Users/me/Library/Application Support/simplepad/untitled-notes/untitled-20260716-120000.md',
        isDirty: true
      },
      {
        id: '6',
        filePath:
          '/Users/me/Library/Application Support/simplepad/untitled-notes/untitled-20260716-120001.md',
        isDirty: false
      }
    ])
    expect(targets).toEqual([
      { id: '1', filePath: '/a.txt', kind: 'disk' },
      { id: '3', filePath: undefined, kind: 'untitled' },
      { id: '4', filePath: '/c.md', kind: 'disk' },
      {
        id: '5',
        filePath:
          '/Users/me/Library/Application Support/simplepad/untitled-notes/untitled-20260716-120000.md',
        kind: 'untitled'
      }
    ])
  })
})

describe('intervalMsFromSeconds', () => {
  it('converts and clamps minimum to 5s', () => {
    expect(intervalMsFromSeconds(30)).toBe(30_000)
    expect(intervalMsFromSeconds(1)).toBe(5_000)
    expect(intervalMsFromSeconds(Number.NaN)).toBe(30_000)
  })
})
