/**
 * Resolve and open [[wiki links]] — always lands on a tab (new tab if needed).
 */

import { useTabsStore } from '../store/useTabsStore'
import { useWorkspaceStore } from '../store/useWorkspaceStore'
import { showToast } from '../store/useToastStore'
import { isElectronApiAvailable } from './sessionBridge'
import { openRecentFile } from './fileActions'
import { createWorkspaceNote } from './workspaceActions'
import { noteKeyFromPathOrTitle, normalizeNoteKey } from '../../shared/wikiLinks'
import { revealInEditor } from './editorCommands'
import { isMarkdownFile } from '../utils/fileUtils'
import { requestExplorerRefresh } from './explorerEvents'

function displayTitle(target: string): string {
  return (
    target
      .replace(/\.markdown$/i, '')
      .replace(/\.md$/i, '')
      .trim() || 'Nota'
  )
}

function fileNameForTarget(target: string): string {
  const t = target.trim()
  if (/\.(md|markdown)$/i.test(t)) return t
  return `${t}.md`
}

function findOpenTabByWikiTarget(target: string): string | null {
  const key = normalizeNoteKey(target)
  if (!key) return null
  const tabs = useTabsStore.getState().tabs
  for (const tab of tabs) {
    if (normalizeNoteKey(tab.title) === key) return tab.id
    if (tab.filePath && noteKeyFromPathOrTitle(tab.filePath) === key) return tab.id
  }
  return null
}

async function resolveWorkspacePath(target: string): Promise<string | null> {
  if (!isElectronApiAvailable()) return null
  const root = useWorkspaceStore.getState().rootPath
  if (!root) return null

  if (typeof window.api.resolveWikiNote === 'function') {
    const result = await window.api.resolveWikiNote(target)
    if (result.ok && result.data?.filePath) return result.data.filePath
  }

  if (typeof window.api.listRecentFiles === 'function') {
    const recent = await window.api.listRecentFiles()
    const key = normalizeNoteKey(target)
    for (const p of recent.data ?? []) {
      if (noteKeyFromPathOrTitle(p) === key) return p
    }
  }
  return null
}

/**
 * Open an internal note by wiki target.
 * - Exists as open tab → focus that tab
 * - Exists on disk → open in a tab (new tab if not already open)
 * - Missing → create new Markdown tab with basic content (and file if workspace open)
 */
export async function openWikiLink(target: string): Promise<boolean> {
  const trimmed = target.trim()
  if (!trimmed) return false

  const openId = findOpenTabByWikiTarget(trimmed)
  if (openId) {
    useTabsStore.getState().switchTab(openId)
    return true
  }

  const path = await resolveWorkspacePath(trimmed)
  if (path) {
    // openRecentFile creates a new tab when the path is not already open
    await openRecentFile(path)
    return true
  }

  // Create new note
  const title = displayTitle(trimmed)
  const fileName = fileNameForTarget(trimmed)
  const body = `# ${title}\n\n`

  const root = useWorkspaceStore.getState().rootPath
  if (root) {
    const created = await createWorkspaceNote(root, fileName, body)
    if (created) {
      await openRecentFile(created)
      requestExplorerRefresh('wiki-create')
      showToast(`Nota criada: ${fileName}`, 'success')
      return true
    }
  }

  // No workspace (or create failed): still open a new unsaved tab
  useTabsStore.getState().createNewTab({
    title: fileName,
    content: body,
    isMarkdown: true,
    isDirty: true
  })
  showToast(`Nova aba: ${title}`, 'info')
  return true
}

/** Open backlink source (prefer existing tab, else new tab from disk) and jump to line. */
export async function openBacklinkSource(
  sourceId: string,
  filePath: string | undefined,
  lineNumber: number
): Promise<void> {
  const tabs = useTabsStore.getState().tabs
  const byId = tabs.find((t) => t.id === sourceId)
  if (byId) {
    useTabsStore.getState().switchTab(byId.id)
  } else if (filePath) {
    await openRecentFile(filePath)
  } else {
    return
  }
  window.requestAnimationFrame(() => {
    window.setTimeout(() => revealInEditor(lineNumber, 1, { smooth: true }), 50)
  })
}

export function collectNoteTitleCandidates(): string[] {
  const titles: string[] = []
  for (const tab of useTabsStore.getState().tabs) {
    titles.push(tab.title.replace(/\.md$/i, ''))
    if (tab.filePath) {
      const base = tab.filePath.split(/[/\\]/).pop() ?? ''
      titles.push(base.replace(/\.md$/i, ''))
    }
  }
  return titles
}

export { isMarkdownFile }
