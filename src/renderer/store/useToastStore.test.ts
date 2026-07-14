import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetToastStoreForTests, showToast, useToastStore } from './useToastStore'

describe('useToastStore', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    resetToastStoreForTests()
  })

  it('pushes and dismisses toasts', () => {
    showToast('Falha ao salvar', 'error')
    expect(useToastStore.getState().toasts).toHaveLength(1)
    expect(useToastStore.getState().toasts[0]?.message).toBe('Falha ao salvar')

    const id = useToastStore.getState().toasts[0]!.id
    useToastStore.getState().dismiss(id)
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('auto-dismisses after timeout', () => {
    showToast('ok', 'info')
    expect(useToastStore.getState().toasts).toHaveLength(1)
    vi.advanceTimersByTime(4500)
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('ignores empty messages', () => {
    showToast('   ')
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })
})
