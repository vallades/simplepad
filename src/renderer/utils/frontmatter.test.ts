import { describe, expect, it } from 'vitest'
import {
  entriesFromFrontmatter,
  formatFrontmatterValue,
  getEditorDocumentText,
  isTagList,
  joinFrontmatter,
  mergeEditorBodyIntoContent,
  parseFrontmatter
} from './frontmatter'

const SAMPLE = `---
title: Minha Ideia
tags: [ideia, projeto]
status: in-progress
priority: high
created: 2026-07-19
---
# Conteúdo da nota

Hello world
`

describe('parseFrontmatter', () => {
  it('extracts data and body from YAML fence', () => {
    const p = parseFrontmatter(SAMPLE)
    expect(p.hasFrontmatter).toBe(true)
    expect(p.data.title).toBe('Minha Ideia')
    expect(p.data.status).toBe('in-progress')
    expect(Array.isArray(p.data.tags)).toBe(true)
    expect(p.body.startsWith('# Conteúdo da nota')).toBe(true)
    expect(p.body).not.toContain('---')
    expect(p.rawFrontmatter.startsWith('---')).toBe(true)
    expect(p.rawFrontmatter.endsWith('---')).toBe(true)
  })

  it('returns full text as body when no fence', () => {
    const p = parseFrontmatter('# just a note\n')
    expect(p.hasFrontmatter).toBe(false)
    expect(p.body).toBe('# just a note\n')
    expect(p.rawFrontmatter).toBe('')
  })

  it('treats incomplete fence as plain content', () => {
    const p = parseFrontmatter('---\ntitle: x\n# no close')
    expect(p.hasFrontmatter).toBe(false)
    expect(p.body).toContain('---')
  })
})

describe('joinFrontmatter / mergeEditorBodyIntoContent', () => {
  it('preserves frontmatter when body is edited', () => {
    const prev = SAMPLE
    const { rawFrontmatter } = parseFrontmatter(prev)
    const nextBody = '# Novo corpo\n\neditado'
    const full = joinFrontmatter(rawFrontmatter, nextBody)
    const again = parseFrontmatter(full)
    expect(again.hasFrontmatter).toBe(true)
    expect(again.data.title).toBe('Minha Ideia')
    expect(again.body).toBe(nextBody)
  })

  it('mergeEditorBodyIntoContent keeps YAML for markdown tabs', () => {
    const merged = mergeEditorBodyIntoContent(SAMPLE, '## Only body\n', true)
    expect(merged).toContain('title: Minha Ideia')
    expect(merged).toContain('## Only body')
    expect(getEditorDocumentText(merged, true)).toBe('## Only body\n')
  })

  it('mergeEditorBodyIntoContent is passthrough for plain text', () => {
    expect(mergeEditorBodyIntoContent('a', 'b', false)).toBe('b')
  })
})

describe('display helpers', () => {
  it('formats values and detects tag lists', () => {
    expect(formatFrontmatterValue(['a', 'b'])).toBe('a, b')
    expect(formatFrontmatterValue(true)).toBe('true')
    expect(isTagList('tags', ['x', 'y'])).toBe(true)
    expect(isTagList('status', 'open')).toBe(false)
  })

  it('lists entries sorted by key', () => {
    const entries = entriesFromFrontmatter({ z: 1, a: 2 })
    expect(entries.map((e) => e.key)).toEqual(['a', 'z'])
  })
})
