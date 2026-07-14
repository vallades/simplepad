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

  it('clamps editor scroll ratio', () => {
    useUiStore.getState().setEditorScrollRatio(1.5)
    expect(useUiStore.getState().editorScrollRatio).toBe(1)
    useUiStore.getState().setEditorScrollRatio(-0.2)
    expect(useUiStore.getState().editorScrollRatio).toBe(0)
  })
})
