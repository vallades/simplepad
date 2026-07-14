import { BrowserWindow, app } from 'electron'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log/main'
import { is } from '@electron-toolkit/utils'
import type { UpdateEventPayload } from '../shared/session'

let initialized = false
let checking = false

function broadcast(payload: UpdateEventPayload): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send('update:event', payload)
    }
  }
}

/**
 * Configures electron-updater (GitHub Releases via electron-builder publish).
 * In development, uses forceDevUpdateConfig + dev-app-update.yml when present.
 */
export function setupAutoUpdater(): void {
  if (initialized) return
  initialized = true

  autoUpdater.logger = log
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  // Avoid noisy errors in unsigned local builds
  autoUpdater.allowPrerelease = false

  if (is.dev) {
    // Enables testing the update pipeline against dev-app-update.yml
    autoUpdater.forceDevUpdateConfig = true
    log.info('[updater] dev mode — forceDevUpdateConfig=true')
  }

  autoUpdater.on('checking-for-update', () => {
    checking = true
    log.info('[updater] checking for update')
    broadcast({ type: 'checking' })
  })

  autoUpdater.on('update-available', (info) => {
    checking = false
    log.info('[updater] update available', info.version)
    broadcast({ type: 'available', version: info.version })
  })

  autoUpdater.on('update-not-available', (info) => {
    checking = false
    log.info('[updater] no update', info.version)
    broadcast({ type: 'not-available', version: info.version })
  })

  autoUpdater.on('download-progress', (progress) => {
    broadcast({
      type: 'progress',
      percent: Math.round(progress.percent),
      message: `${Math.round(progress.percent)}%`
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    checking = false
    log.info('[updater] downloaded', info.version)
    broadcast({ type: 'downloaded', version: info.version })
  })

  autoUpdater.on('error', (error) => {
    checking = false
    log.error('[updater] error', error)
    broadcast({
      type: 'error',
      message: error instanceof Error ? error.message : String(error)
    })
  })

  // Quiet background check a few seconds after launch (packaged only)
  if (!is.dev && app.isPackaged) {
    setTimeout(() => {
      void checkForUpdates({ silent: true })
    }, 8_000)
  }
}

export interface CheckUpdatesOptions {
  /** When true, suppress "not available" noise if desired by caller */
  silent?: boolean
}

/**
 * Manual or automatic check. Safe to call multiple times.
 */
export async function checkForUpdates(options: CheckUpdatesOptions = {}): Promise<void> {
  if (checking) {
    log.info('[updater] check already in progress')
    return
  }

  try {
    // In pure dev without publish feed this will emit error — that is expected.
    const result = await autoUpdater.checkForUpdates()
    if (!result && !options.silent) {
      broadcast({
        type: 'error',
        message: 'Não foi possível iniciar a verificação de atualizações.'
      })
    }
  } catch (error) {
    log.error('[updater] checkForUpdates failed', error)
    if (!options.silent) {
      broadcast({
        type: 'error',
        message: error instanceof Error ? error.message : String(error)
      })
    }
  }
}

/** Quit and install after download (user confirmed). */
export function quitAndInstallUpdate(): void {
  log.info('[updater] quitAndInstall')
  // isSilent, isForceRunAfter
  autoUpdater.quitAndInstall(false, true)
}
