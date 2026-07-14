import { beforeEach, describe, expect, it, vi } from 'vitest'
import { confirmCloseTab, confirmQuitWithUnsaved } from './fileActions'

describe('confirm dialogs', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // @ts-expect-error test stub
    delete window.api
  })

  it('confirmCloseTab uses window.confirm without Electron API', async () => {
    const spy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    await expect(confirmCloseTab('nota.md')).resolves.toBe(true)
    expect(spy).toHaveBeenCalled()
    expect(String(spy.mock.calls[0]?.[0])).toContain('nota.md')
  })

  it('confirmQuitWithUnsaved uses window.confirm without Electron API', async () => {
    const spy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    await expect(confirmQuitWithUnsaved()).resolves.toBe(false)
    expect(spy).toHaveBeenCalled()
  })

  it('confirmCloseTab uses native dialog when API is present', async () => {
    const showConfirm = vi.fn().mockResolvedValue({ response: 1, canceled: false })
    window.api = {
      loadSession: vi.fn(),
      showConfirm
    } as unknown as Window['api']

    await expect(confirmCloseTab('x.txt')).resolves.toBe(true)
    expect(showConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Fechar aba',
        buttons: ['Cancelar', 'Fechar sem salvar']
      })
    )
  })

  it('confirmQuitWithUnsaved returns false on cancel button', async () => {
    const showConfirm = vi.fn().mockResolvedValue({ response: 0, canceled: true })
    window.api = {
      loadSession: vi.fn(),
      showConfirm
    } as unknown as Window['api']

    await expect(confirmQuitWithUnsaved()).resolves.toBe(false)
  })
})
