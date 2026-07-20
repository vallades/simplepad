import { describe, expect, it } from 'vitest'
import { extractPortableTabs, isPortableTab } from '../../shared/workspacePortable'

describe('workspace switch portable tabs (integration helpers)', () => {
  it('keeps drafts without path when switching', () => {
    const tabs = [
      { id: '1', title: 'Sem título 1', filePath: undefined as string | undefined, isDirty: true },
      { id: '2', title: 'readme.md', filePath: '/tmp/ws/readme.md', isDirty: false }
    ]
    const portable = extractPortableTabs(tabs)
    expect(portable).toHaveLength(1)
    expect(portable[0]?.id).toBe('1')
    expect(isPortableTab(tabs[1]!)).toBe(false)
  })
})
