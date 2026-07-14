import { describe, expect, it } from 'vitest'
import { isResolvedDark } from './theme'

describe('isResolvedDark', () => {
  it('respects forced preferences', () => {
    expect(isResolvedDark('dark')).toBe(true)
    expect(isResolvedDark('light')).toBe(false)
  })
})
