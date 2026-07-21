/**
 * Resolve and open [[wiki links]] across open tabs and workspace files.
 */

import { useTabsStore } from '../store/useTabsStore'
import { useWorkspaceStore } from '../store/useWorkspaceStore'
import { showToast } from '../store/useToastStore'
import { isElectronApiAvailable } from './sessionBridge'
import { openRecentFile } from './fileActions'
import { createWorkspaceNote } from './workspaceActions'
import { noteKeyFromPathOrTitle, normalizeNoteKey } from '../../shared/wikiLinks'
import { revealInEditor } from './editorCommands'

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

/**
 * Best-effort resolve a wiki target to an absolute path under the workspace.
 */
async function resolveWorkspacePath(target: string): Promise<string | null> {
  if (!isElectronApiAvailable()) return null
  const root = useWorkspaceStore.getState().rootPath
  if (!root) return null

  // Prefer dedicated IPC when available
  if (typeof window.api.resolveWikiNote === 'function') {
    const result = await window.api.resolveWikiNote(target)
    if (result.ok && result.data?.filePath) return result.data.filePath
  }

  // Fallback: search recent files by basename
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
 * Open an internal note by wiki target name.
 * Returns true if a tab was focused or opened.
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
    await openRecentFile(path)
    return true
  }

  // Create note in workspace root if possible
  const root = useWorkspaceStore.getState().rootPath
  if (root && typeof createWorkspaceNote === 'function') {
    const fileName = /\.md$/i.test(trimmed) ? trimmed : `${trimmed}.md`
    const created = await createWorkspaceNote(
      root,
      fileName,
      `# ${trimmed.replace(/\.md$/i, '')}\n\n`
    )
    if (created) {
      await openRecentFile(created)
      showToast(`Nota criada: ${fileName}`, 'success')
      return true
    }
  }

  showToast(`Nota não encontrada: ${trimmed}`, 'info')
  return false
}

/** Open backlink source (tab or file) and jump to line. */
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

/** Candidate note titles for autocomplete (open tabs + recent basenames). */
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
