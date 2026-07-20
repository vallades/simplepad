import { beforeEach, describe, expect, it } from 'vitest'
import { resetWorkspaceStoreForTests, useWorkspaceStore } from './useWorkspaceStore'

describe('useWorkspaceStore', () => {
  beforeEach(() => {
    resetWorkspaceStoreForTests()
  })

  it('starts as Pessoal / global', () => {
    const s = useWorkspaceStore.getState()
    expect(s.rootPath).toBeNull()
    expect(s.name).toBe('Pessoal')
    expect(s.id).toBe('global')
  })

  it('setFromInfo updates workspace fields', () => {
    useWorkspaceStore.getState().setFromInfo({
      rootPath: '/Users/me/Notes',
      name: 'Notes',
      dataPath: '/data/ws',
      id: 'abc'
    })
    const s = useWorkspaceStore.getState()
    expect(s.hydrated).toBe(true)
    expect(s.rootPath).toBe('/Users/me/Notes')
    expect(s.name).toBe('Notes')
    expect(s.id).toBe('abc')
  })
})
