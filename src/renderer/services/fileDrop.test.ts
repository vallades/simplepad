import { describe, expect, it } from 'vitest'
import { isDroppableTextPath } from './fileActions'

describe('isDroppableTextPath', () => {
  it('accepts common text extensions', () => {
    expect(isDroppableTextPath('/tmp/a.md')).toBe(true)
    expect(isDroppableTextPath('/tmp/a.txt')).toBe(true)
    expect(isDroppableTextPath('C:\\x\\n.json')).toBe(true)
    expect(isDroppableTextPath('/src/app.ts')).toBe(true)
    expect(isDroppableTextPath('/notes/README')).toBe(true)
  })

  it('rejects binaries', () => {
    expect(isDroppableTextPath('/tmp/photo.png')).toBe(false)
    expect(isDroppableTextPath('/tmp/a.pdf')).toBe(false)
    expect(isDroppableTextPath('/tmp/app.exe')).toBe(false)
  })
})
