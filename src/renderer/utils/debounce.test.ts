import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { applyScrollRatio, debounce, scrollRatioFromElement } from './debounce'

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('delays invocation', () => {
    const fn = vi.fn()
    const d = debounce(fn, 100)
    d('a')
    d('b')
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(100)
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('b')
  })

  it('flush runs immediately', () => {
    const fn = vi.fn()
    const d = debounce(fn, 200)
    d(1)
    d.flush()
    expect(fn).toHaveBeenCalledWith(1)
  })
})

describe('scroll ratio helpers', () => {
  it('computes ratio from metrics', () => {
    expect(scrollRatioFromElement({ scrollTop: 50, scrollHeight: 200, clientHeight: 100 })).toBe(
      0.5
    )
    expect(scrollRatioFromElement({ scrollTop: 0, scrollHeight: 100, clientHeight: 100 })).toBe(0)
  })

  it('applies ratio to element', () => {
    const el = { scrollTop: 0, scrollHeight: 300, clientHeight: 100 }
    applyScrollRatio(el, 0.5)
    expect(el.scrollTop).toBe(100)
  })
})
