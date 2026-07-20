/**
 * Watch active workspace folder for external/create/save changes (chokidar).
 */

import chokidar, { type FSWatcher } from 'chokidar'
import { BrowserWindow } from 'electron'
import log from 'electron-log/main'
import { EXPLORER_IGNORE_NAMES } from '../shared/workspace'

let watcher: FSWatcher | null = null
let watchedRoot: string | null = null
let debounceTimer: ReturnType<typeof setTimeout> | null = null

const DEBOUNCE_MS = 200

function broadcastFsChanged(rootPath: string): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send('workspace:fs-changed', { rootPath })
    }
  }
}

function scheduleBroadcast(rootPath: string): void {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debounceTimer = null
    broadcastFsChanged(rootPath)
  }, DEBOUNCE_MS)
}

function shouldIgnore(path: string): boolean {
  const parts = path.replace(/\\/g, '/').split('/')
  return parts.some((p) => EXPLORER_IGNORE_NAMES.has(p) || (p.startsWith('.') && p !== '.env'))
}

export async function startWorkspaceWatcher(rootPath: string | null): Promise<void> {
  await stopWorkspaceWatcher()
  if (!rootPath) return

  watchedRoot = rootPath
  try {
    watcher = chokidar.watch(rootPath, {
      ignoreInitial: true,
      persistent: true,
      depth: 8,
      awaitWriteFinish: { stabilityThreshold: 150, pollInterval: 50 },
      ignored: (p: string) => shouldIgnore(p)
    })

    const onAny = (): void => {
      if (watchedRoot) scheduleBroadcast(watchedRoot)
    }
    watcher.on('add', onAny)
    watcher.on('addDir', onAny)
    watcher.on('change', onAny)
    watcher.on('unlink', onAny)
    watcher.on('unlinkDir', onAny)
    watcher.on('error', (error) => {
      log.warn('[workspaceWatcher] error', error)
    })
    log.info('[workspaceWatcher] watching', rootPath)
  } catch (error) {
    log.error('[workspaceWatcher] failed to start', error)
    watcher = null
    watchedRoot = null
  }
}

export async function stopWorkspaceWatcher(): Promise<void> {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
  if (watcher) {
    try {
      await watcher.close()
    } catch (error) {
      log.warn('[workspaceWatcher] close failed', error)
    }
    watcher = null
  }
  watchedRoot = null
}
