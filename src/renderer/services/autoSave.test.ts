import { describe, expect, it } from 'vitest'
import { collectAutoSaveTargets, intervalMsFromSeconds } from './autoSave'

describe('collectAutoSaveTargets', () => {
  it('only includes dirty tabs with a file path', () => {
    const targets = collectAutoSaveTargets([
      { id: '1', filePath: '/a.txt', isDirty: true },
      { id: '2', filePath: '/b.txt', isDirty: false },
      { id: '3', isDirty: true },
      { id: '4', filePath: '/c.md', isDirty: true }
    ])
    expect(targets).toEqual([
      { id: '1', filePath: '/a.txt' },
      { id: '4', filePath: '/c.md' }
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
