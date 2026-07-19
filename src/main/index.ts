import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import log from 'electron-log/main'
import icon from '../../resources/icon.png?asset'
import { createAppMenu } from './menu'
import { registerIpcHandlers } from './ipc'
import { isQuitAllowed, requestQuitConfirmation, wireQuitHandlers } from './quitController'
import { getSessionManager } from './sessionManager'
import { getPreferencesManager } from './preferencesManager'
import { getWorkspaceManager } from './workspaceManager'
import { setupAutoUpdater } from './updater'

// Must run before Menu is built — otherwise macOS menu bar shows "Electron" in dev.
app.setName('SimplePad')
if (process.platform === 'darwin') {
  // Align About panel / dock naming with productName
  app.setAboutPanelOptions({
    applicationName: 'SimplePad',
    applicationVersion: app.getVersion(),
    copyright: 'Copyright © SimplePad contributors'
  })
}

// Initialize electron-log for main process (writes under userData/logs)
log.initialize()
Object.assign(console, log.functions)

function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 640,
    minHeight: 400,
    show: false,
    title: 'SimplePad',
    // hiddenInset embeds traffic lights over the web contents — header must pad ~76px left
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    trafficLightPosition: process.platform === 'darwin' ? { x: 16, y: 14 } : undefined,
    autoHideMenuBar: process.platform !== 'darwin',
    backgroundColor: '#ffffff',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // Monaco workers require node-like worker plumbing; sandbox breaks them.
      // Re-evaluate when migrating to a sandboxed worker strategy.
      sandbox: false,
      spellcheck: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Leave OS fullscreen → exit distraction-free chrome in the renderer
  mainWindow.on('leave-full-screen', () => {
    mainWindow.webContents.send('menu:command', 'exit-focus-mode')
  })

  // Intercept window close so we can confirm unsaved work + flush session
  mainWindow.on('close', (event) => {
    if (isQuitAllowed()) return
    event.preventDefault()
    requestQuitConfirmation()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.simplepad.app')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Bind workspace (or global) data dirs, then touch stores
  getWorkspaceManager()
  getSessionManager()
  getPreferencesManager()

  registerIpcHandlers()
  wireQuitHandlers()
  createAppMenu()
  createWindow()
  setupAutoUpdater()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

  log.info('[main] SimplePad v' + app.getVersion() + ' ready, userData=', app.getPath('userData'))
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // before-quit / close handlers already ran confirmation
    if (isQuitAllowed()) {
      app.quit()
    }
  }
})
