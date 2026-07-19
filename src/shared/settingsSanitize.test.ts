import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, MAX_RECENT_FILES } from './settings'
import { pushRecentFile, sanitizeRecentFiles, sanitizeSettings } from './settingsSanitize'

describe('sanitizeSettings', () => {
  it('returns defaults for invalid input', () => {
    expect(sanitizeSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(sanitizeSettings('x')).toEqual(DEFAULT_SETTINGS)
  })

  it('clamps font size and auto-save interval', () => {
    const result = sanitizeSettings({
      fontSize: 2,
      autoSaveIntervalSeconds: 9999,
      theme: 'dark',
      autoSaveEnabled: false,
      fontFamily: '  Consolas  '
    })
    expect(result.fontSize).toBe(10)
    expect(result.autoSaveIntervalSeconds).toBe(600)
    expect(result.theme).toBe('dark')
    expect(result.autoSaveEnabled).toBe(false)
    expect(result.fontFamily).toBe('Consolas')
  })

  it('falls back invalid theme', () => {
    expect(sanitizeSettings({ theme: 'neon' as 'system' }).theme).toBe('system')
  })

  it('clamps split ratio and validates orientation', () => {
    const result = sanitizeSettings({
      splitRatio: 0.05,
      splitOrientation: 'vertical'
    })
    expect(result.splitRatio).toBe(0.2)
    expect(result.splitOrientation).toBe('vertical')
    expect(
      sanitizeSettings({ splitOrientation: 'diagonal' as 'horizontal' }).splitOrientation
    ).toBe('horizontal')
  })

  it('preserves markdown advanced toggles', () => {
    const result = sanitizeSettings({
      markdownMathEnabled: false,
      markdownMermaidEnabled: false,
      showMarkdownOutline: false
    })
    expect(result.markdownMathEnabled).toBe(false)
    expect(result.markdownMermaidEnabled).toBe(false)
    expect(result.showMarkdownOutline).toBe(false)
    expect(sanitizeSettings({}).markdownMathEnabled).toBe(DEFAULT_SETTINGS.markdownMathEnabled)
  })

  it('preserves new-tab format defaults', () => {
    const result = sanitizeSettings({
      newTabDefaultMarkdown: true,
      autoEnablePreviewOnMarkdown: false
    })
    expect(result.newTabDefaultMarkdown).toBe(true)
    expect(result.autoEnablePreviewOnMarkdown).toBe(false)
    expect(sanitizeSettings({}).newTabDefaultMarkdown).toBe(false)
    expect(sanitizeSettings({}).autoEnablePreviewOnMarkdown).toBe(true)
  })
})

describe('sanitizeRecentFiles / pushRecentFile', () => {
  it('dedupes and caps length', () => {
    const many = Array.from({ length: 15 }, (_, i) => `/tmp/file-${i}.txt`)
    const sanitized = sanitizeRecentFiles(many)
    expect(sanitized).toHaveLength(MAX_RECENT_FILES)
    expect(sanitized[0]).toBe('/tmp/file-0.txt')
  })

  it('moves path to front on push', () => {
    const next = pushRecentFile(['/a.txt', '/b.txt'], '/b.txt')
    expect(next[0]).toBe('/b.txt')
    expect(next).toEqual(['/b.txt', '/a.txt'])
  })

  it('ignores empty paths', () => {
    expect(sanitizeRecentFiles(['', '  ', '/ok.txt'])).toEqual(['/ok.txt'])
  })
})
