import { beforeEach, describe, expect, it } from 'vitest'
import { resetUiStoreForTests, useUiStore } from './useUiStore'

describe('useUiStore', () => {
  beforeEach(() => {
    resetUiStoreForTests()
  })

  it('toggles split preview', () => {
    expect(useUiStore.getState().splitPreview).toBe(false)
    useUiStore.getState().toggleSplitPreview()
    expect(useUiStore.getState().splitPreview).toBe(true)
    useUiStore.getState().setSplitPreview(false)
    expect(useUiStore.getState().splitPreview).toBe(false)
  })

  it('toggles focus mode', () => {
    expect(useUiStore.getState().focusMode).toBe(false)
    useUiStore.getState().toggleFocusMode()
    expect(useUiStore.getState().focusMode).toBe(true)
    useUiStore.getState().setFocusMode(false)
    expect(useUiStore.getState().focusMode).toBe(false)
  })

  it('clamps editor scroll ratio', () => {
    useUiStore.getState().setEditorScrollRatio(1.5)
    expect(useUiStore.getState().editorScrollRatio).toBe(1)
    useUiStore.getState().setEditorScrollRatio(-0.2)
    expect(useUiStore.getState().editorScrollRatio).toBe(0)
  })

  it('toggles sidebar open', () => {
    expect(useUiStore.getState().sidebarOpen).toBe(false)
    useUiStore.getState().toggleSidebar()
    expect(useUiStore.getState().sidebarOpen).toBe(true)
    useUiStore.getState().setSidebarOpen(false)
    expect(useUiStore.getState().sidebarOpen).toBe(false)
  })
})
