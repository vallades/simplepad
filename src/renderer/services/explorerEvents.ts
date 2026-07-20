/**
 * Lightweight pub/sub so the file explorer can refresh without coupling to every caller.
 */

import { useWorkspaceStore } from '../store/useWorkspaceStore'

type Listener = (reason?: string) => void

const listeners = new Set<Listener>()

export function subscribeExplorerRefresh(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Debounced so burst saves / chokidar events don't thrash the tree. */
let timer: ReturnType<typeof setTimeout> | null = null
const DEBOUNCE_MS = 120

export function requestExplorerRefresh(reason = 'manual'): void {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    timer = null
    for (const listener of listeners) {
      try {
        listener(reason)
      } catch (error) {
        console.error('[explorerEvents] listener failed', error)
      }
    }
  }, DEBOUNCE_MS)
}

export function requestExplorerRefreshNow(reason = 'manual'): void {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  for (const listener of listeners) {
    try {
      listener(reason)
    } catch (error) {
      console.error('[explorerEvents] listener failed', error)
    }
  }
}

export function isPathInActiveWorkspace(filePath: string | undefined | null): boolean {
  if (!filePath) return false
  const root = useWorkspaceStore.getState().rootPath
  if (!root) return false
  const nRoot = root.replace(/\\/g, '/').replace(/\/+$/, '')
  const nPath = filePath.replace(/\\/g, '/')
  return nPath === nRoot || nPath.startsWith(`${nRoot}/`)
}

export function refreshExplorerIfInWorkspace(filePath: string | undefined | null): void {
  if (isPathInActiveWorkspace(filePath)) {
    requestExplorerRefresh('save')
  }
}
