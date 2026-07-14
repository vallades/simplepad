import { BrowserWindow, Menu, app, type MenuItemConstructorOptions } from 'electron'
import { basename } from 'path'
import log from 'electron-log/main'
import type { MenuCommand } from '../shared/session'
import { requestQuitConfirmation } from './quitController'
import { getPreferencesManager } from './preferencesManager'

function sendMenuCommand(command: MenuCommand): void {
  const window = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null
  if (!window) {
    log.warn('[menu] no window for command', command)
    return
  }
  window.webContents.send('menu:command', command)
}

function sendOpenRecent(filePath: string): void {
  const window = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? null
  if (!window) {
    log.warn('[menu] no window for open-recent')
    return
  }
  window.webContents.send('menu:open-recent', filePath)
}

function buildRecentSubmenu(recentFiles: string[]): MenuItemConstructorOptions {
  if (recentFiles.length === 0) {
    return {
      label: 'Recentes',
      submenu: [{ label: 'Nenhum arquivo recente', enabled: false }]
    }
  }

  return {
    label: 'Recentes',
    submenu: [
      ...recentFiles.map((filePath) => ({
        label: basename(filePath),
        toolTip: filePath,
        click: (): void => sendOpenRecent(filePath)
      })),
      { type: 'separator' as const },
      {
        label: 'Limpar lista',
        click: (): void => sendMenuCommand('clear-recent')
      }
    ]
  }
}

/**
 * Native application menu wired to renderer actions via IPC events.
 */
export function createAppMenu(recentFiles?: string[]): void {
  const isMac = process.platform === 'darwin'
  const files = recentFiles ?? getPreferencesManager().getRecentFiles()

  const template: MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              {
                label: 'Configurações…',
                accelerator: 'CmdOrCtrl+,',
                click: () => sendMenuCommand('open-settings')
              },
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
        buildRecentSubmenu(files),
        { type: 'separator' },
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
        {
          label: 'Exportar como…',
          submenu: [
            {
              label: 'HTML…',
              click: () => sendMenuCommand('export-html')
            },
            {
              label: 'PDF…',
              click: () => sendMenuCommand('export-pdf')
            }
          ]
        },
        { type: 'separator' },
        ...(isMac
          ? []
          : [
              {
                label: 'Configurações…',
                accelerator: 'CmdOrCtrl+,',
                click: () => sendMenuCommand('open-settings')
              },
              { type: 'separator' as const }
            ]),
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
        {
          label: 'Split View (Preview)',
          accelerator: 'CmdOrCtrl+Shift+P',
          click: () => sendMenuCommand('toggle-preview')
        },
        {
          label: 'Modo Markdown',
          accelerator: 'CmdOrCtrl+Shift+M',
          click: () => sendMenuCommand('toggle-markdown')
        },
        { type: 'separator' },
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
  log.info('[menu] application menu ready', `(${files.length} recent)`)
}

/** Rebuild menu when recent files change. */
export function refreshAppMenu(): void {
  createAppMenu(getPreferencesManager().getRecentFiles())
}
