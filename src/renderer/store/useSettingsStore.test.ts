import { beforeEach, describe, expect, it } from 'vitest'
import { getEditorThemeId, resetSettingsStoreForTests, useSettingsStore } from './useSettingsStore'
import { DEFAULT_SETTINGS } from '../../shared/settings'

describe('useSettingsStore', () => {
  beforeEach(() => {
    resetSettingsStoreForTests()
  })

  it('starts with defaults when reset', () => {
    const state = useSettingsStore.getState()
    expect(state.fontSize).toBe(DEFAULT_SETTINGS.fontSize)
    expect(state.theme).toBe(DEFAULT_SETTINGS.theme)
    expect(state.autoSaveEnabled).toBe(DEFAULT_SETTINGS.autoSaveEnabled)
    expect(state.hydrated).toBe(true)
  })

  it('setLocal updates font and theme optimistically', () => {
    useSettingsStore.getState().setLocal({ fontSize: 18, theme: 'dark' })
    const state = useSettingsStore.getState()
    expect(state.fontSize).toBe(18)
    expect(state.theme).toBe('dark')
  })

  it('clamps invalid local font size', () => {
    useSettingsStore.getState().setLocal({ fontSize: 100 })
    expect(useSettingsStore.getState().fontSize).toBe(32)
  })
})

describe('getEditorThemeId', () => {
  it('resolves forced and system themes', () => {
    expect(getEditorThemeId('light', true)).toBe('vs')
    expect(getEditorThemeId('dark', false)).toBe('vs-dark')
    expect(getEditorThemeId('system', true)).toBe('vs-dark')
    expect(getEditorThemeId('system', false)).toBe('vs')
  })
})
