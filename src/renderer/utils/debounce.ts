/**
 * Lightweight debounce for preview / export helpers (unit-testable).
 */
export function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  waitMs: number
): ((...args: TArgs) => void) & { cancel: () => void; flush: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastArgs: TArgs | null = null

  const debounced = ((...args: TArgs) => {
    lastArgs = args
    if (timer !== null) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      if (lastArgs) fn(...lastArgs)
      lastArgs = null
    }, waitMs)
  }) as ((...args: TArgs) => void) & { cancel: () => void; flush: () => void }

  debounced.cancel = () => {
    if (timer !== null) clearTimeout(timer)
    timer = null
    lastArgs = null
  }

  debounced.flush = () => {
    if (timer !== null) clearTimeout(timer)
    timer = null
    if (lastArgs) {
      const args = lastArgs
      lastArgs = null
      fn(...args)
    }
  }

  return debounced
}

/** Scroll ratio 0–1 from element metrics. */
export function scrollRatioFromElement(el: {
  scrollTop: number
  scrollHeight: number
  clientHeight: number
}): number {
  const max = el.scrollHeight - el.clientHeight
  if (max <= 0) return 0
  return Math.min(1, Math.max(0, el.scrollTop / max))
}

export function applyScrollRatio(
  el: { scrollHeight: number; clientHeight: number; scrollTop: number },
  ratio: number
): void {
  const max = el.scrollHeight - el.clientHeight
  if (max <= 0) {
    el.scrollTop = 0
    return
  }
  const safe = Number.isFinite(ratio) ? Math.min(1, Math.max(0, ratio)) : 0
  el.scrollTop = safe * max
}
