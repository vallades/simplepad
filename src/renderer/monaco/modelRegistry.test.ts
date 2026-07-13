import { describe, expect, it } from 'vitest'
import { createTabEntity } from '../store/useTabsStore'
import { getLanguageForTab } from './modelRegistry'

describe('modelRegistry helpers', () => {
  it('getLanguageForTab prefers isMarkdown flag', () => {
    const tab = createTabEntity({ title: 'notes.txt', isMarkdown: true })
    expect(getLanguageForTab(tab)).toBe('markdown')
  })

  it('getLanguageForTab uses filePath extension when isMarkdown is false', () => {
    const md = createTabEntity({
      title: 'a.md',
      filePath: '/tmp/a.md',
      isMarkdown: false
    })
    expect(getLanguageForTab(md)).toBe('markdown')
  })

  it('getLanguageForTab falls back to title extension', () => {
    const tab = createTabEntity({ title: 'readme.md', isMarkdown: false })
    expect(getLanguageForTab(tab)).toBe('markdown')
  })

  it('getLanguageForTab returns plaintext for plain titles', () => {
    const tab = createTabEntity({ title: 'Sem título 1', isMarkdown: false })
    expect(getLanguageForTab(tab)).toBe('plaintext')
  })
})
