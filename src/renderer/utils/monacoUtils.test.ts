import { describe, expect, it } from 'vitest'
import {
  DEFAULT_FONT_SIZE,
  EDITOR_FONT_FAMILY,
  getDefaultEditorOptions,
  resolveLanguage,
  themeFromColorScheme
} from './monacoUtils'

describe('monacoUtils', () => {
  describe('resolveLanguage', () => {
    it('maps boolean flags', () => {
      expect(resolveLanguage(true)).toBe('markdown')
      expect(resolveLanguage(false)).toBe('plaintext')
    })

    it('detects markdown extensions', () => {
      expect(resolveLanguage('notes.md')).toBe('markdown')
      expect(resolveLanguage('README.MARKDOWN')).toBe('markdown')
      expect(resolveLanguage('todo.txt')).toBe('plaintext')
    })
  })

  describe('themeFromColorScheme', () => {
    it('returns vs / vs-dark', () => {
      expect(themeFromColorScheme(false)).toBe('vs')
      expect(themeFromColorScheme(true)).toBe('vs-dark')
    })
  })

  describe('getDefaultEditorOptions', () => {
    it('uses minimalist defaults', () => {
      const options = getDefaultEditorOptions()
      expect(options.fontSize).toBe(DEFAULT_FONT_SIZE)
      expect(options.fontFamily).toBe(EDITOR_FONT_FAMILY)
      expect(options.minimap).toEqual({ enabled: false })
      expect(options.wordWrap).toBe('on')
      expect(options.automaticLayout).toBe(true)
      expect(options.scrollBeyondLastLine).toBe(false)
    })

    it('allows custom font size and family', () => {
      expect(getDefaultEditorOptions(16).fontSize).toBe(16)
      expect(getDefaultEditorOptions(14, 'monospace').fontFamily).toBe('monospace')
    })
  })
})
