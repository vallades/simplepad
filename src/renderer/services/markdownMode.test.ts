import { beforeEach, describe, expect, it } from 'vitest'
import { applyMarkdownMode, toggleMarkdownModeForTab } from './markdownMode'
import { resetTabsStoreForTests, useTabsStore } from '../store/useTabsStore'
import { resetUiStoreForTests, useUiStore } from '../store/useUiStore'
import { resetSettingsStoreForTests } from '../store/useSettingsStore'
import { resetToastStoreForTests, useToastStore } from '../store/useToastStore'

describe('markdownMode', () => {
  beforeEach(() => {
    resetTabsStoreForTests()
    resetUiStoreForTests()
    resetSettingsStoreForTests({
      autoEnablePreviewOnMarkdown: true,
      newTabDefaultMarkdown: false
    })
    resetToastStoreForTests()
  })

  it('enables markdown, Monaco language flag, and preview when configured', () => {
    const id = useTabsStore.getState().tabs[0]!.id
    expect(useTabsStore.getState().tabs[0]?.isMarkdown).toBe(false)
    expect(useUiStore.getState().splitPreview).toBe(false)

    applyMarkdownMode(id, true)

    expect(useTabsStore.getState().tabs[0]?.isMarkdown).toBe(true)
    expect(useUiStore.getState().splitPreview).toBe(true)
    expect(useToastStore.getState().toasts.some((t) => t.message.includes('Markdown'))).toBe(true)
  })

  it('disables markdown without forcing preview off', () => {
    const id = useTabsStore.getState().tabs[0]!.id
    useUiStore.getState().setSplitPreview(true)
    applyMarkdownMode(id, true)
    applyMarkdownMode(id, false)

    expect(useTabsStore.getState().tabs[0]?.isMarkdown).toBe(false)
    expect(useUiStore.getState().splitPreview).toBe(true)
  })

  it('toggleMarkdownModeForTab flips mode', () => {
    const id = useTabsStore.getState().tabs[0]!.id
    toggleMarkdownModeForTab(id)
    expect(useTabsStore.getState().tabs[0]?.isMarkdown).toBe(true)
    toggleMarkdownModeForTab(id)
    expect(useTabsStore.getState().tabs[0]?.isMarkdown).toBe(false)
  })

  it('skips preview auto-enable when setting is off', () => {
    resetSettingsStoreForTests({ autoEnablePreviewOnMarkdown: false })
    const id = useTabsStore.getState().tabs[0]!.id
    applyMarkdownMode(id, true)
    expect(useTabsStore.getState().tabs[0]?.isMarkdown).toBe(true)
    expect(useUiStore.getState().splitPreview).toBe(false)
  })
})

describe('createNewTab default format', () => {
  beforeEach(() => {
    resetTabsStoreForTests()
    resetSettingsStoreForTests({ newTabDefaultMarkdown: false })
  })

  it('starts untitled tabs as Plain Text by default', () => {
    const id = useTabsStore.getState().createNewTab()
    expect(useTabsStore.getState().tabs.find((t) => t.id === id)?.isMarkdown).toBe(false)
  })

  it('starts untitled tabs as Markdown when setting is on', () => {
    resetSettingsStoreForTests({ newTabDefaultMarkdown: true })
    const id = useTabsStore.getState().createNewTab()
    expect(useTabsStore.getState().tabs.find((t) => t.id === id)?.isMarkdown).toBe(true)
  })

  it('opens .md paths as Markdown regardless of default setting', () => {
    resetSettingsStoreForTests({ newTabDefaultMarkdown: false })
    const id = useTabsStore.getState().createNewTab({
      filePath: '/tmp/notes.md',
      title: 'notes.md',
      content: '# Hi',
      isDirty: false
    })
    expect(useTabsStore.getState().tabs.find((t) => t.id === id)?.isMarkdown).toBe(true)
  })
})
