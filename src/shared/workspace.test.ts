import { describe, expect, it } from 'vitest'
import {
  MAX_RECENT_WORKSPACES,
  pushRecentWorkspace,
  sanitizeRecentWorkspaces,
  sanitizeWorkspacesRegistry,
  workspaceDisplayName,
  workspaceIdFromPath
} from './workspace'

describe('workspaceIdFromPath', () => {
  it('is stable for the same path', () => {
    expect(workspaceIdFromPath('/Users/me/Notes')).toBe(workspaceIdFromPath('/Users/me/Notes'))
  })

  it('differs for different paths', () => {
    expect(workspaceIdFromPath('/a')).not.toBe(workspaceIdFromPath('/b'))
  })
})

describe('workspaceDisplayName', () => {
  it('uses folder basename', () => {
    expect(workspaceDisplayName('/Users/me/My Vault')).toBe('My Vault')
  })

  it('defaults to Pessoal when null', () => {
    expect(workspaceDisplayName(null)).toBe('Pessoal')
  })
})

describe('recent workspaces', () => {
  it('caps at MAX_RECENT_WORKSPACES', () => {
    const many = Array.from({ length: 10 }, (_, i) => `/ws/${i}`)
    expect(sanitizeRecentWorkspaces(many)).toHaveLength(MAX_RECENT_WORKSPACES)
  })

  it('moves path to front on push', () => {
    const next = pushRecentWorkspace(['/a', '/b'], '/b')
    expect(next[0]).toBe('/b')
    expect(next).toEqual(['/b', '/a'])
  })
})

describe('sanitizeWorkspacesRegistry', () => {
  it('defaults invalid input', () => {
    const r = sanitizeWorkspacesRegistry(null)
    expect(r.activeRoot).toBeNull()
    expect(r.recentWorkspaces).toEqual([])
  })

  it('keeps valid activeRoot', () => {
    const r = sanitizeWorkspacesRegistry({
      version: 1,
      activeRoot: '/notes',
      recentWorkspaces: ['/notes', '/other']
    })
    expect(r.activeRoot).toBe('/notes')
    expect(r.recentWorkspaces).toEqual(['/notes', '/other'])
  })
})
