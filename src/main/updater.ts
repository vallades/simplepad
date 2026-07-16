import { BrowserWindow, app, dialog, shell } from 'electron'
import { autoUpdater } from 'electron-updater'
import log from 'electron-log/main'
import { is } from '@electron-toolkit/utils'
import { spawn, spawnSync } from 'child_process'
import { chmodSync, existsSync, writeFileSync } from 'fs'
import { join, resolve } from 'path'
import type { UpdateEventPayload } from '../shared/session'

/** Must match electron-builder.yml → publish */
const GITHUB_FEED = {
  provider: 'github' as const,
  owner: 'vallades',
  repo: 'simplepad',
  private: false,
  releaseType: 'release' as const
}

const UPDATE_CHANNEL = 'latest'
const RELEASES_URL = 'https://github.com/vallades/simplepad/releases/latest'

let initialized = false
let checking = false
/** Last check was silent (background) — suppress noisy toasts for checking/not-available */
let lastCheckSilent = false
/** Path to the last downloaded update package (zip on mac, exe on win). */
let lastDownloadedFile: string | null = null
let lastDownloadedVersion: string | undefined

function broadcast(payload: UpdateEventPayload): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send('update:event', payload)
    }
  }
}

function logUpdaterState(label: string): void {
  log.info(`[updater] ${label}`, {
    appVersion: app.getVersion(),
    isPackaged: app.isPackaged,
    isDev: is.dev,
    channel: autoUpdater.channel,
    autoDownload: autoUpdater.autoDownload,
    allowPrerelease: autoUpdater.allowPrerelease,
    currentVersion: autoUpdater.currentVersion?.version,
    platform: process.platform,
    arch: process.arch,
    macDeveloperId: process.platform === 'darwin' ? hasDeveloperIdSignature() : undefined
  })
}

/** macOS: path to SimplePad.app bundle. */
function getAppBundlePath(): string {
  // process.execPath → …/SimplePad.app/Contents/MacOS/SimplePad
  return resolve(process.execPath, '..', '..', '..')
}

/**
 * True only when the running app is signed with Apple **Developer ID Application**.
 * Ad-hoc / CI unsigned builds return false — Squirrel.Mac will reject those updates.
 */
export function hasDeveloperIdSignature(): boolean {
  if (process.platform !== 'darwin') return false
  try {
    const bundle = getAppBundlePath()
    const r = spawnSync('codesign', ['-dv', '--verbose=2', bundle], { encoding: 'utf8' })
    const text = `${r.stdout || ''}${r.stderr || ''}`
    const ok = /Authority=Developer ID Application/i.test(text)
    log.info('[updater] codesign identity', { ok, snippet: text.split('\n').slice(0, 8) })
    return ok
  } catch (error) {
    log.warn('[updater] codesign check failed', error)
    return false
  }
}

function isSignatureError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error)
  return /signatur|code.?sign|not signed|ERR_UPDATER_INVALID_SIGNATURE|codesign|Certificate|authority/i.test(
    msg
  )
}

/**
 * Configures electron-updater against GitHub Releases.
 *
 * **macOS note:** Squirrel.Mac requires the same Developer ID certificate on the
 * running app and the update zip. Unsigned/ad-hoc CI builds download fine but
 * fail on install. We detect that and apply a custom zip install (ditto + xattr).
 */
export function setupAutoUpdater(): void {
  if (initialized) return
  initialized = true

  autoUpdater.logger = log
  log.transports.file.level = 'info'
  log.transports.console.level = is.dev ? 'debug' : 'info'

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true
  autoUpdater.allowPrerelease = false
  autoUpdater.allowDowngrade = false
  autoUpdater.channel = UPDATE_CHANNEL

  try {
    autoUpdater.setFeedURL(GITHUB_FEED)
    log.info('[updater] setFeedURL', GITHUB_FEED, `channel=${UPDATE_CHANNEL}`)
  } catch (error) {
    log.warn('[updater] setFeedURL failed — using app-update.yml if present', error)
  }

  if (is.dev) {
    autoUpdater.forceDevUpdateConfig = true
    log.info('[updater] dev mode — forceDevUpdateConfig=true (manual check only)')
  }

  logUpdaterState('configured')

  autoUpdater.on('checking-for-update', () => {
    checking = true
    log.info('[updater] event:checking-for-update', {
      current: app.getVersion(),
      silent: lastCheckSilent
    })
    broadcast({ type: 'checking', silent: lastCheckSilent })
  })

  autoUpdater.on('update-available', (info) => {
    checking = false
    log.info('[updater] event:update-available', {
      from: app.getVersion(),
      to: info.version,
      files: info.files?.map((f) => f.url),
      path: info.path,
      releaseDate: info.releaseDate
    })
    broadcast({ type: 'available', version: info.version, silent: false })
  })

  autoUpdater.on('update-not-available', (info) => {
    checking = false
    log.info('[updater] event:update-not-available', {
      installed: app.getVersion(),
      feedVersion: info.version
    })
    broadcast({ type: 'not-available', version: info.version, silent: lastCheckSilent })
  })

  autoUpdater.on('download-progress', (progress) => {
    const percent = Math.round(progress.percent)
    log.info(
      `[updater] event:download-progress ${percent}%`,
      `${Math.round(progress.bytesPerSecond / 1024)} KiB/s`
    )
    broadcast({
      type: 'progress',
      percent,
      message: `${percent}%`,
      silent: false
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    checking = false
    lastDownloadedFile = info.downloadedFile || null
    lastDownloadedVersion = info.version
    log.info('[updater] event:update-downloaded', {
      version: info.version,
      downloadedFile: lastDownloadedFile
    })
    broadcast({ type: 'downloaded', version: info.version, silent: false })
    void promptInstall(info.version)
  })

  autoUpdater.on('error', (error) => {
    checking = false
    log.error('[updater] event:error', error)

    if (process.platform === 'darwin' && isSignatureError(error)) {
      void promptMacSignatureFallback(error instanceof Error ? error.message : String(error))
      return
    }

    broadcast({
      type: 'error',
      message: error instanceof Error ? error.message : String(error),
      silent: lastCheckSilent
    })
  })

  if (!is.dev && app.isPackaged) {
    setTimeout(() => {
      void checkForUpdates({ silent: true })
    }, 8_000)

    setInterval(
      () => {
        void checkForUpdates({ silent: true })
      },
      24 * 60 * 60 * 1000
    )
  } else {
    log.info(
      '[updater] auto-check skipped',
      `(is.dev=${is.dev}, isPackaged=${app.isPackaged}) — use Ajuda → Verificar atualizações`
    )
  }
}

async function promptInstall(version?: string): Promise<void> {
  const window = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null
  const isMacUnsigned = process.platform === 'darwin' && !hasDeveloperIdSignature()

  const opts: Electron.MessageBoxOptions = isMacUnsigned
    ? {
        type: 'info',
        title: 'Atualização pronta',
        message: version
          ? `A versão ${version} do SimplePad foi baixada.`
          : 'Uma atualização do SimplePad foi baixada.',
        detail:
          'Este build do Mac ainda não tem assinatura Apple Developer ID.\n\n' +
          'A instalação automática do sistema (Squirrel) costuma falhar com erro de signature.\n\n' +
          'Use “Instalar agora” — o SimplePad aplica o ZIP baixado, remove a quarentena (xattr) e reabre o app.\n' +
          'Ou baixe o .dmg manualmente na página de Releases.',
        buttons: ['Instalar agora', 'Baixar manualmente', 'Depois'],
        defaultId: 0,
        cancelId: 2,
        noLink: true
      }
    : {
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

    if (isMacUnsigned) {
      if (result.response === 0) {
        installMacUpdateCustom()
      } else if (result.response === 1) {
        await openManualDownload()
      }
      return
    }

    if (result.response === 0) {
      quitAndInstallUpdate()
    }
  } catch (error) {
    log.error('[updater] promptInstall failed', error)
  }
}

/** When Squirrel.Mac rejects the package with a signature error. */
async function promptMacSignatureFallback(errorMessage: string): Promise<void> {
  broadcast({
    type: 'error',
    message:
      'Assinatura de código (macOS): instalação automática bloqueada. Use a instalação alternativa ou o download manual.',
    silent: false
  })

  const window = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null
  const opts: Electron.MessageBoxOptions = {
    type: 'warning',
    title: 'Atualização — assinatura macOS',
    message: 'O macOS bloqueou a instalação automática (code signature).',
    detail:
      `${errorMessage}\n\n` +
      'Builds sem Apple Developer ID (~US$ 99/ano) não passam no Squirrel.Mac.\n\n' +
      'Opções:\n' +
      '• Instalar via ZIP baixado (recomendado sem certificado)\n' +
      '• Abrir a página de Releases e instalar o .dmg (+ xattr -cr se pedir “danificado”)\n\n' +
      'Correção definitiva: assinar com Developer ID + notarizar (docs/DISTRIBUTION.md).',
    buttons: ['Instalar via ZIP', 'Abrir Releases', 'Cancelar'],
    defaultId: 0,
    cancelId: 2,
    noLink: true
  }

  try {
    const result = window
      ? await dialog.showMessageBox(window, opts)
      : await dialog.showMessageBox(opts)
    if (result.response === 0) {
      installMacUpdateCustom()
    } else if (result.response === 1) {
      await openManualDownload()
    }
  } catch (error) {
    log.error('[updater] promptMacSignatureFallback failed', error)
  }
}

async function openManualDownload(): Promise<void> {
  // Prefer opening the already-downloaded zip so the user can install offline
  if (lastDownloadedFile && existsSync(lastDownloadedFile)) {
    log.info('[updater] revealing downloaded package', lastDownloadedFile)
    shell.showItemInFolder(lastDownloadedFile)
  }
  await shell.openExternal(RELEASES_URL)
}

/**
 * Install macOS update without Squirrel.Mac:
 * 1. Wait for SimplePad to quit
 * 2. Unzip the update package
 * 3. Replace the .app with ditto
 * 4. Strip Gatekeeper quarantine (xattr -cr)
 * 5. Relaunch
 *
 * This is the practical workaround until Developer ID + notarization are configured.
 */
function installMacUpdateCustom(): void {
  if (process.platform !== 'darwin') {
    quitAndInstallUpdate()
    return
  }

  const zipPath = lastDownloadedFile
  if (!zipPath || !existsSync(zipPath)) {
    log.error('[updater] no downloaded zip for custom install', zipPath)
    void dialog
      .showMessageBox({
        type: 'error',
        title: 'Atualização',
        message: 'Arquivo da atualização não encontrado.',
        detail:
          'Baixe o instalador em:\n' +
          RELEASES_URL +
          '\n\nSe o macOS disser que o app está danificado:\n' +
          'xattr -cr /Applications/SimplePad.app',
        buttons: ['Abrir Releases', 'OK'],
        defaultId: 0
      })
      .then((r) => {
        if (r.response === 0) void shell.openExternal(RELEASES_URL)
      })
    return
  }

  const appBundle = getAppBundlePath()
  const scriptPath = join(app.getPath('temp'), 'simplepad-apply-update.sh')
  const logPath = join(app.getPath('logs'), 'update-install.log')

  // Shell script runs detached after we quit — do not use Squirrel.
  const script = `#!/bin/bash
set -euo pipefail
ZIP=${JSON.stringify(zipPath)}
APP_BUNDLE=${JSON.stringify(appBundle)}
LOG=${JSON.stringify(logPath)}
mkdir -p "$(dirname "$LOG")"
exec >>"$LOG" 2>&1
echo "==== $(date -u +%Y-%m-%dT%H:%M:%SZ) SimplePad custom update ===="
echo "ZIP=$ZIP"
echo "APP_BUNDLE=$APP_BUNDLE"

# Wait until the running app exits (max ~60s)
for i in $(seq 1 120); do
  if ! pgrep -f "$APP_BUNDLE/Contents/MacOS" >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done
sleep 1

TMP=$(mktemp -d /tmp/simplepad-update.XXXXXX)
cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

echo "Extracting…"
# ditto handles zip reliably on macOS
ditto -x -k "$ZIP" "$TMP"

NEW_APP=$(find "$TMP" -name "*.app" -type d -maxdepth 4 | head -n 1 || true)
if [ -z "\${NEW_APP}" ]; then
  echo "ERROR: no .app found inside zip"
  exit 1
fi
echo "NEW_APP=$NEW_APP"

PARENT=$(dirname "$APP_BUNDLE")
if [ ! -w "$PARENT" ]; then
  echo "WARNING: parent not writable: $PARENT (may need admin for /Applications)"
fi

echo "Replacing app bundle…"
rm -rf "$APP_BUNDLE"
ditto "$NEW_APP" "$APP_BUNDLE"

echo "Clearing quarantine (Gatekeeper)…"
xattr -cr "$APP_BUNDLE" || true

echo "Relaunching…"
open "$APP_BUNDLE"
echo "Done."
`

  try {
    writeFileSync(scriptPath, script, { encoding: 'utf8' })
    chmodSync(scriptPath, 0o755)
    log.info('[updater] launching custom mac installer', {
      scriptPath,
      zipPath,
      appBundle,
      logPath,
      version: lastDownloadedVersion
    })

    broadcast({
      type: 'downloaded',
      version: lastDownloadedVersion,
      message: 'Instalando atualização e reiniciando…',
      silent: false
    })

    const child = spawn('/bin/bash', [scriptPath], {
      detached: true,
      stdio: 'ignore'
    })
    child.unref()

    // Give the script a moment to spawn, then quit so replacement can proceed
    setTimeout(() => {
      log.info('[updater] quitting for custom mac install')
      app.exit(0)
    }, 400)
  } catch (error) {
    log.error('[updater] custom mac install failed to start', error)
    broadcast({
      type: 'error',
      message:
        error instanceof Error
          ? error.message
          : 'Falha ao iniciar instalador local. Use o download manual.',
      silent: false
    })
    void openManualDownload()
  }
}

export interface CheckUpdatesOptions {
  /** When true, suppress "checking" / "up to date" / error noise in the UI */
  silent?: boolean
}

/**
 * Manual or automatic check. Safe to call multiple times.
 * Prefer this over checkForUpdatesAndNotify so toasts stay under our control.
 */
export async function checkForUpdates(options: CheckUpdatesOptions = {}): Promise<void> {
  if (checking) {
    log.info('[updater] check already in progress — ignored')
    return
  }

  lastCheckSilent = Boolean(options.silent)
  logUpdaterState(`checkForUpdates(silent=${lastCheckSilent})`)

  if (!app.isPackaged && !is.dev) {
    log.warn('[updater] app is not packaged — update check may fail without feed config')
  }

  try {
    const result = await autoUpdater.checkForUpdates()
    log.info('[updater] checkForUpdates result', {
      updateInfo: result?.updateInfo
        ? {
            version: result.updateInfo.version,
            files: result.updateInfo.files?.map((f) => f.url),
            path: result.updateInfo.path,
            releaseDate: result.updateInfo.releaseDate
          }
        : null,
      cancellationToken: Boolean(result?.cancellationToken),
      downloadPromise: Boolean(result?.downloadPromise)
    })

    if (!result && !options.silent) {
      broadcast({
        type: 'error',
        message:
          'Não foi possível iniciar a verificação. Confira se a Release no GitHub tem latest.yml / latest-mac.yml / latest-linux.yml e versão maior que a instalada.',
        silent: false
      })
    }
  } catch (error) {
    log.error('[updater] checkForUpdates failed', error)
    if (process.platform === 'darwin' && isSignatureError(error)) {
      void promptMacSignatureFallback(error instanceof Error ? error.message : String(error))
      return
    }
    if (!options.silent) {
      const msg = error instanceof Error ? error.message : String(error)
      broadcast({
        type: 'error',
        message: msg,
        silent: false
      })
    }
  }
}

/**
 * Quit and install after download.
 * On macOS without Developer ID, uses custom zip installer (Squirrel would fail).
 */
export function quitAndInstallUpdate(): void {
  if (process.platform === 'darwin' && !hasDeveloperIdSignature()) {
    log.info('[updater] quitAndInstall → custom mac path (no Developer ID)')
    installMacUpdateCustom()
    return
  }

  log.info('[updater] quitAndInstall (native electron-updater / Squirrel)')
  autoUpdater.quitAndInstall(false, true)
}
