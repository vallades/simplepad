import { beforeEach, describe, expect, it, vi } from 'vitest'
import { exportMermaidPng, exportMermaidSvg } from './mermaidExport'
import { resetToastStoreForTests, useToastStore } from '../store/useToastStore'

describe('mermaidExport', () => {
  beforeEach(() => {
    resetToastStoreForTests()
    // @ts-expect-error clear
    delete window.api
  })

  it('shows error toast when API missing', async () => {
    await exportMermaidSvg('<svg></svg>')
    expect(useToastStore.getState().toasts.some((t) => t.kind === 'error')).toBe(true)
  })

  it('saves SVG via saveBinaryFile', async () => {
    const saveBinaryFile = vi.fn().mockResolvedValue({ canceled: false, filePath: '/tmp/d.svg' })
    window.api = {
      loadSession: vi.fn(),
      saveBinaryFile
    } as unknown as Window['api']

    await expect(exportMermaidSvg('<svg xmlns="http://www.w3.org/2000/svg"></svg>')).resolves.toBe(
      true
    )
    expect(saveBinaryFile).toHaveBeenCalledWith(
      expect.objectContaining({
        format: 'svg',
        isBase64: false,
        defaultPath: 'diagrama.svg'
      })
    )
    expect(useToastStore.getState().toasts.some((t) => t.kind === 'success')).toBe(true)
  })

  it('returns false when user cancels SVG export', async () => {
    window.api = {
      loadSession: vi.fn(),
      saveBinaryFile: vi.fn().mockResolvedValue({ canceled: true })
    } as unknown as Window['api']
    await expect(exportMermaidSvg('<svg></svg>')).resolves.toBe(false)
  })
})

// PNG path needs canvas/Image — skip heavy browser APIs in unit env
describe('exportMermaidPng (api contract)', () => {
  beforeEach(() => {
    resetToastStoreForTests()
  })

  it('fails gracefully without API', async () => {
    // @ts-expect-error clear
    delete window.api
    await exportMermaidPng('<svg></svg>')
    expect(useToastStore.getState().toasts.some((t) => t.kind === 'error')).toBe(true)
  })
})
