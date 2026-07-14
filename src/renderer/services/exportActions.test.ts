import { beforeEach, describe, expect, it, vi } from 'vitest'
import { exportActiveAsHtml, exportActiveAsPdf } from './exportActions'
import { resetTabsStoreForTests, useTabsStore } from '../store/useTabsStore'
import { resetToastStoreForTests, useToastStore } from '../store/useToastStore'

describe('exportActions', () => {
  beforeEach(() => {
    resetTabsStoreForTests()
    resetToastStoreForTests()
    // @ts-expect-error clear api
    delete window.api
  })

  it('shows toast when API is unavailable', async () => {
    useTabsStore.getState().updateTabContent(useTabsStore.getState().tabs[0]!.id, '# Hi')
    await exportActiveAsHtml()
    expect(useToastStore.getState().toasts.some((t) => t.kind === 'error')).toBe(true)
  })

  it('calls exportFile for HTML and PDF', async () => {
    const exportFile = vi
      .fn()
      .mockResolvedValueOnce({ canceled: false, filePath: '/tmp/a.html' })
      .mockResolvedValueOnce({ canceled: false, filePath: '/tmp/a.pdf' })

    window.api = {
      loadSession: vi.fn(),
      exportFile
    } as unknown as Window['api']

    const id = useTabsStore.getState().tabs[0]!.id
    useTabsStore.getState().setMarkdownMode(id, true)
    useTabsStore.getState().updateTabContent(id, '# Export me')

    await expect(exportActiveAsHtml()).resolves.toBe(true)
    await expect(exportActiveAsPdf()).resolves.toBe(true)

    expect(exportFile).toHaveBeenCalledTimes(2)
    expect(exportFile.mock.calls[0]?.[0]).toMatchObject({ format: 'html' })
    expect(exportFile.mock.calls[1]?.[0]).toMatchObject({ format: 'pdf' })
    expect(String(exportFile.mock.calls[0]?.[0].content)).toContain('<!DOCTYPE html>')
  })

  it('returns false when user cancels', async () => {
    window.api = {
      loadSession: vi.fn(),
      exportFile: vi.fn().mockResolvedValue({ canceled: true })
    } as unknown as Window['api']

    await expect(exportActiveAsHtml()).resolves.toBe(false)
  })
})
