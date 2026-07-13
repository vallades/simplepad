import { BrowserWindow, Menu, app, type MenuItemConstructorOptions } from 'electron'
import log from 'electron-log/main'
import type { MenuCommand } from '../shared/session'
import { requestQuitConfirmation } from './quitController'

function sendMenuCommand(command: MenuCommand): void {
  const window = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null
  if (!window) {
    log.warn('[menu] no window for command', command)
    return
  }
  window.webContents.send('menu:command', command)
}

/**
 * Native application menu wired to renderer actions via IPC events.
 */
export function createAppMenu(): void {
  const isMac = process.platform === 'darwin'

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'services' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              {
                label: 'Sair do SimplePad',
                accelerator: 'CmdOrCtrl+Q',
                click: () => requestQuitConfirmation()
              }
            ]
          }
        ]
      : []),
    {
      label: 'Arquivo',
      submenu: [
        {
          label: 'Nova Aba',
          accelerator: 'CmdOrCtrl+N',
          click: () => sendMenuCommand('new-tab')
        },
        {
          label: 'Abrir...',
          accelerator: 'CmdOrCtrl+O',
          click: () => sendMenuCommand('open-file')
        },
        {
          label: 'Salvar',
          accelerator: 'CmdOrCtrl+S',
          click: () => sendMenuCommand('save-file')
        },
        {
          label: 'Salvar como...',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: () => sendMenuCommand('save-file-as')
        },
        { type: 'separator' },
        {
          label: 'Fechar Aba',
          accelerator: 'CmdOrCtrl+W',
          click: () => sendMenuCommand('close-tab')
        },
        { type: 'separator' },
        isMac
          ? { role: 'close' }
          : {
              label: 'Sair',
              accelerator: 'CmdOrCtrl+Q',
              click: () => requestQuitConfirmation()
            }
      ]
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'Exibir',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
  log.info('[menu] application menu ready')
}
