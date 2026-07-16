import { BrowserWindow, app, dialog } from 'electron'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log/main'
import { is } from '@electron-toolkit/utils'
import type { UpdateEventPayload } from '../shared/session'

let initialized = false
let checking = false
/** Last check was silent (background) — suppress noisy toasts for checking/not-available */
let lastCheckSilent = false

function broadcast(payload: UpdateEventPayload): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send('update:event', payload)
    }
  }
}

/**
 * Configures electron-updater (GitHub Releases via electron-builder publish).
 *
 * Flow for end users (packaged app only):
 * 1. You bump version + tag vX.Y.Z → Release workflow uploads installers + latest*.yml
 * 2. On launch, app checks GitHub for a newer version than app.getVersion()
 * 3. If found: toast "disponível — baixando", download automatic
 * 4. When done: toast + dialog "Reiniciar agora?" → quitAndInstall
 *
 * Dev (`npm run dev`) does not auto-check (no meaningful install channel).
 */
export function setupAutoUpdater(): void {
  if (initialized) return
  initialized = true

  autoUpdater.logger = log
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.allowPrerelease = false

  if (is.dev) {
    // Optional local feed testing via dev-app-update.yml
    autoUpdater.forceDevUpdateConfig = true
    log.info('[updater] dev mode — forceDevUpdateConfig=true (manual check only)')
  }

  autoUpdater.on('checking-for-update', () => {
    checking = true
    log.info('[updater] checking for update')
    broadcast({ type: 'checking', silent: lastCheckSilent })
  })

  autoUpdater.on('update-available', (info) => {
    checking = false
    log.info('[updater] update available', info.version)
    // Always notify when something will download
    broadcast({ type: 'available', version: info.version, silent: false })
  })

  autoUpdater.on('update-not-available', (info) => {
    checking = false
    log.info('[updater] no update', info.version)
    broadcast({ type: 'not-available', version: info.version, silent: lastCheckSilent })
  })

  autoUpdater.on('download-progress', (progress) => {
    broadcast({
      type: 'progress',
      percent: Math.round(progress.percent),
      message: `${Math.round(progress.percent)}%`,
      silent: false
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    checking = false
    log.info('[updater] downloaded', info.version)
    broadcast({ type: 'downloaded', version: info.version, silent: false })
    void promptInstall(info.version)
  })

  autoUpdater.on('error', (error) => {
    checking = false
    log.error('[updater] error', error)
    broadcast({
      type: 'error',
      message: error instanceof Error ? error.message : String(error),
      silent: lastCheckSilent
    })
  })

  // Packaged app only: check a few seconds after launch (silent unless update found)
  if (!is.dev && app.isPackaged) {
    setTimeout(() => {
      void checkForUpdates({ silent: true })
    }, 8_000)

    // Re-check once a day while the app stays open
    setInterval(
      () => {
        void checkForUpdates({ silent: true })
      },
      24 * 60 * 60 * 1000
    )
  }
}

async function promptInstall(version?: string): Promise<void> {
  const window = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null
  const opts: Electron.MessageBoxOptions = {
    type: 'info',
    title: 'Atualização pronta',
    message: version
      ? `A versão ${version} do SimplePad foi baixada.`
      : 'Uma atualização do SimplePad foi baixada.',
    detail:
      'Reinicie agora para instalar. Você também pode continuar e a atualização será aplicada ao sair do app.',
    buttons: ['Reiniciar agora', 'Depois'],
    defaultId: 0,
    cancelId: 1,
    noLink: true
  }

  try {
    const result = window
      ? await dialog.showMessageBox(window, opts)
      : await dialog.showMessageBox(opts)
    if (result.response === 0) {
      quitAndInstallUpdate()
    }
  } catch (error) {
    log.error('[updater] promptInstall failed', error)
  }
}

export interface CheckUpdatesOptions {
  /** When true, suppress "checking" / "up to date" / error noise in the UI */
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

  lastCheckSilent = Boolean(options.silent)

  try {
    const result = await autoUpdater.checkForUpdates()
    if (!result && !options.silent) {
      broadcast({
        type: 'error',
        message: 'Não foi possível iniciar a verificação de atualizações.',
        silent: false
      })
    }
  } catch (error) {
    log.error('[updater] checkForUpdates failed', error)
    if (!options.silent) {
      broadcast({
        type: 'error',
        message: error instanceof Error ? error.message : String(error),
        silent: false
      })
    }
  }
}

/** Quit and install after download (user confirmed or app quit). */
export function quitAndInstallUpdate(): void {
  log.info('[updater] quitAndInstall')
  autoUpdater.quitAndInstall(false, true)
}
