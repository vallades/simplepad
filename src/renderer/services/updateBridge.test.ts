import { beforeEach, describe, expect, it } from 'vitest'
import { handleUpdateEvent } from './updateBridge'
import { resetToastStoreForTests, useToastStore } from '../store/useToastStore'

describe('handleUpdateEvent', () => {
  beforeEach(() => {
    resetToastStoreForTests()
  })

  it('shows info toast when checking', () => {
    handleUpdateEvent({ type: 'checking' })
    expect(useToastStore.getState().toasts[0]?.kind).toBe('info')
  })

  it('stays quiet when checking is silent', () => {
    handleUpdateEvent({ type: 'checking', silent: true })
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('announces available update with version even if silent flag set', () => {
    handleUpdateEvent({ type: 'available', version: '1.0.1', silent: false })
    expect(useToastStore.getState().toasts[0]?.message).toContain('1.0.1')
  })

  it('shows success when up to date', () => {
    handleUpdateEvent({ type: 'not-available', version: '1.0.0' })
    expect(useToastStore.getState().toasts[0]?.kind).toBe('success')
  })

  it('hides not-available toast when silent', () => {
    handleUpdateEvent({ type: 'not-available', version: '1.0.0', silent: true })
    expect(useToastStore.getState().toasts).toHaveLength(0)
  })

  it('shows error message', () => {
    handleUpdateEvent({ type: 'error', message: 'network fail' })
    expect(useToastStore.getState().toasts[0]?.message).toContain('network fail')
  })
})
