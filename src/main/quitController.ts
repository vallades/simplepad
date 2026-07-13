import { app, BrowserWindow } from 'electron'
import log from 'electron-log/main'

let quitAllowed = false
let quitInProgress = false

export function isQuitAllowed(): boolean {
  return quitAllowed
}

export function cancelQuit(): void {
  quitInProgress = false
  log.info('[quit] canceled by user')
}

/**
 * Called by the renderer after session save + unsaved confirmation.
 */
export function allowQuitAndExit(): void {
  quitAllowed = true
  quitInProgress = false
  log.info('[quit] confirmed — exiting')
  app.quit()
}

/**
 * Ask the focused (or first) window whether it's safe to quit.
 * Renderer must reply via `app:quit-response`.
 */
export function requestQuitConfirmation(): void {
  if (quitInProgress) return
  quitInProgress = true

  const window = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null

  if (!window) {
    allowQuitAndExit()
    return
  }

  log.info('[quit] requesting confirmation from renderer')
  window.webContents.send('app:request-quit')
}

export function wireQuitHandlers(): void {
  app.on('before-quit', (event) => {
    if (quitAllowed) return
    event.preventDefault()
    requestQuitConfirmation()
  })
}
