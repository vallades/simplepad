import { SESSION_VERSION, type AppSession, type TabDTO } from './session'

/**
 * Pure validation / normalization — unit-testable without Electron.
 */
export function sanitizeSession(raw: unknown): AppSession | null {
  if (!raw || typeof raw !== 'object') return null

  const candidate = raw as Partial<AppSession>
  if (!Array.isArray(candidate.tabs)) return null

  const tabs: TabDTO[] = []
  for (const item of candidate.tabs) {
    if (!item || typeof item !== 'object') continue
    const tab = item as Partial<TabDTO>
    if (typeof tab.id !== 'string' || tab.id.length === 0) continue

    const cursor = tab.cursorPosition
    tabs.push({
      id: tab.id,
      title: typeof tab.title === 'string' ? tab.title : 'Sem título',
      content: typeof tab.content === 'string' ? tab.content : '',
      isDirty: Boolean(tab.isDirty),
      isMarkdown: Boolean(tab.isMarkdown),
      filePath: typeof tab.filePath === 'string' ? tab.filePath : undefined,
      cursorPosition: {
        lineNumber:
          cursor && typeof cursor.lineNumber === 'number' && cursor.lineNumber > 0
            ? cursor.lineNumber
            : 1,
        column: cursor && typeof cursor.column === 'number' && cursor.column > 0 ? cursor.column : 1
      },
      scrollPosition: typeof tab.scrollPosition === 'number' ? tab.scrollPosition : 0,
      lastModified:
        typeof tab.lastModified === 'string' && !Number.isNaN(Date.parse(tab.lastModified))
          ? tab.lastModified
          : new Date().toISOString()
    })
  }

  if (tabs.length === 0) return null

  const activeTabId =
    typeof candidate.activeTabId === 'string' && tabs.some((t) => t.id === candidate.activeTabId)
      ? candidate.activeTabId
      : (tabs[0]?.id ?? null)

  return {
    version: typeof candidate.version === 'number' ? candidate.version : SESSION_VERSION,
    tabs,
    activeTabId
  }
}

export function createEmptySession(): AppSession {
  return {
    version: SESSION_VERSION,
    tabs: [],
    activeTabId: null
  }
}
