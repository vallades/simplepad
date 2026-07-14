import { describe, expect, it } from 'vitest'
import {
  countWords,
  getFileExtension,
  isMarkdownFile,
  sanitizeFilename,
  shortenPath,
  titleFromPath
} from './fileUtils'

describe('fileUtils', () => {
  it('extracts file extensions', () => {
    expect(getFileExtension('notes.md')).toBe('md')
    expect(getFileExtension('archive.tar.gz')).toBe('gz')
    expect(getFileExtension('Makefile')).toBe('')
  })

  it('detects markdown files', () => {
    expect(isMarkdownFile('readme.md')).toBe(true)
    expect(isMarkdownFile('notes.markdown')).toBe(true)
    expect(isMarkdownFile('data.txt')).toBe(false)
  })

  it('sanitizes unsafe filenames', () => {
    expect(sanitizeFilename('my:file*.txt')).toBe('my_file_.txt')
  })

  it('counts words', () => {
    expect(countWords('')).toBe(0)
    expect(countWords('  olá   mundo  ')).toBe(2)
  })

  it('derives title from path', () => {
    expect(titleFromPath('/Users/me/Docs/nota.txt')).toBe('nota.txt')
    expect(titleFromPath('C:\\Users\\me\\nota.txt')).toBe('nota.txt')
  })

  it('shortens long paths for status bar', () => {
    expect(shortenPath('/short.txt')).toBe('/short.txt')
    expect(shortenPath('/Users/me/very/long/nested/path/to/document.txt')).toBe('…/to/document.txt')
  })
})
