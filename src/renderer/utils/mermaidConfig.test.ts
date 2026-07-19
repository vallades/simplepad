import { describe, expect, it } from 'vitest'
import {
  buildMermaidInitConfig,
  clampMermaidZoom,
  isMermaidCurve,
  parseMermaidError,
  svgElementToString
} from './mermaidConfig'

describe('buildMermaidInitConfig', () => {
  it('uses dark theme variables when isDark', () => {
    const dark = buildMermaidInitConfig(true, { fontSize: 16, curve: 'linear', diagramPadding: 20 })
    expect(dark.theme).toBe('dark')
    expect(dark.themeVariables.primaryTextColor).toBe('#f4f4f5')
    expect(dark.flowchart.curve).toBe('linear')
    expect(dark.flowchart.padding).toBe(20)
    expect(dark.fontSize).toBe(16)
  })

  it('uses light theme by default', () => {
    const light = buildMermaidInitConfig(false)
    expect(light.theme).toBe('default')
    expect(light.themeVariables.background).toBe('#ffffff')
    expect(light.flowchart.curve).toBe('basis')
  })
})

describe('parseMermaidError', () => {
  it('extracts line number from parse errors', () => {
    const r = parseMermaidError(new Error('Parse error on line 4: Unexpected token'))
    expect(r.lineNumber).toBe(4)
    expect(r.message).toContain('line 4')
  })

  it('handles plain strings', () => {
    const r = parseMermaidError('Invalid diagram')
    expect(r.lineNumber).toBeUndefined()
    expect(r.message).toBe('Invalid diagram')
  })
})

describe('svgElementToString', () => {
  it('ensures xmlns on raw svg markup', () => {
    const out = svgElementToString('<svg width="10" height="10"></svg>')
    expect(out).toContain('xmlns="http://www.w3.org/2000/svg"')
  })

  it('passes through already namespaced svg', () => {
    const src = '<svg xmlns="http://www.w3.org/2000/svg"></svg>'
    expect(svgElementToString(src)).toBe(src)
  })
})

describe('clampMermaidZoom', () => {
  it('clamps to 0.25–4', () => {
    expect(clampMermaidZoom(0.1)).toBe(0.25)
    expect(clampMermaidZoom(10)).toBe(4)
    expect(clampMermaidZoom(1.5)).toBe(1.5)
  })
})

describe('isMermaidCurve', () => {
  it('validates curve styles', () => {
    expect(isMermaidCurve('basis')).toBe(true)
    expect(isMermaidCurve('zigzag')).toBe(false)
  })
})
