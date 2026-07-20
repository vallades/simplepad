import { app, dialog, BrowserWindow } from 'electron'
import { existsSync, mkdirSync, readdirSync, statSync } from 'fs'
import { join, normalize, resolve, sep } from 'path'
import log from 'electron-log/main'
import ElectronStore from 'electron-store'
import type {
  DirEntryDTO,
  ListDirResult,
  WorkspaceInfo,
  WorkspacesRegistry
} from '../shared/workspace'
import {
  EXPLORER_IGNORE_NAMES,
  createDefaultRegistry,
  pushRecentWorkspace,
  sanitizeWorkspacesRegistry,
  workspaceDisplayName,
  workspaceIdFromPath
} from '../shared/workspace'
import { SessionManager, resetSessionManagerForTests } from './sessionManager'
import { PreferencesManager, resetPreferencesManagerForTests } from './preferencesManager'
import { rebindTemplateManager, resetTemplateManagerForTests } from './templateManager'
import {
  rebindUntitledNotesManager,
  resetUntitledNotesManagerForTests
} from './untitledNotesManager'
import { startWorkspaceWatcher } from './workspaceWatcher'

interface RegistryStore {
  path: string
  get: (key: 'registry', defaultValue?: WorkspacesRegistry) => WorkspacesRegistry
  set: (key: 'registry', value: WorkspacesRegistry) => void
}

type StoreConstructor = new (options?: {
  name?: string
  cwd?: string
  defaults?: { registry: WorkspacesRegistry }
  clearInvalidConfig?: boolean
}) => RegistryStore

function resolveStoreConstructor(): StoreConstructor {
  const mod: unknown = ElectronStore
  if (typeof mod === 'function') return mod as StoreConstructor
  if (mod && typeof mod === 'object' && 'default' in mod) {
    const nested = (mod as { default: unknown }).default
    if (typeof nested === 'function') return nested as StoreConstructor
  }
  throw new TypeError('electron-store Store is not a constructor')
}

const Store = resolveStoreConstructor()

/**
 * Global workspace registry + rebind of per-workspace managers.
 *
 * Data layout:
 * - Global (no folder): app userData (session, preferences, templates, untitled)
 * - Folder workspace: userData/workspaces/<id>/...
 * - Registry always: userData/workspaces-registry.json
 * - Snippets always global userData
 */
export class WorkspaceManager {
  private readonly store: RegistryStore
  private activeRoot: string | null = null
  private boundDataPath: string

  constructor() {
    const userData = app.getPath('userData')
    this.store = new Store({
      name: 'workspaces-registry',
      cwd: userData,
      defaults: { registry: createDefaultRegistry() },
      clearInvalidConfig: true
    })
    this.boundDataPath = userData

    const registry = this.readRegistry()
    if (registry.activeRoot && existsSync(registry.activeRoot)) {
      this.activeRoot = registry.activeRoot
    } else if (registry.activeRoot) {
      log.warn('[workspace] last root missing, falling back to global', registry.activeRoot)
      this.activeRoot = null
      this.writeRegistry({ ...registry, activeRoot: null })
    }

    this.rebindManagers()
    void startWorkspaceWatcher(this.activeRoot)
    log.info('[workspace] ready', this.getInfo())
  }

  getGlobalUserData(): string {
    return app.getPath('userData')
  }

  getActiveRoot(): string | null {
    return this.activeRoot
  }

  getDataPath(): string {
    if (!this.activeRoot) return this.getGlobalUserData()
    return join(this.getGlobalUserData(), 'workspaces', workspaceIdFromPath(this.activeRoot))
  }

  getInfo(): WorkspaceInfo {
    const rootPath = this.activeRoot
    const dataPath = this.getDataPath()
    return {
      rootPath,
      name: workspaceDisplayName(rootPath),
      dataPath,
      id: rootPath ? workspaceIdFromPath(rootPath) : 'global'
    }
  }

  listRecent(): string[] {
    return this.readRegistry().recentWorkspaces.filter((p) => existsSync(p))
  }

  private readRegistry(): WorkspacesRegistry {
    try {
      return sanitizeWorkspacesRegistry(this.store.get('registry', createDefaultRegistry()))
    } catch {
      return createDefaultRegistry()
    }
  }

  private writeRegistry(registry: WorkspacesRegistry): void {
    this.store.set('registry', sanitizeWorkspacesRegistry(registry))
  }

  /** Re-create session/prefs/templates/untitled bound to current data path. */
  rebindManagers(): void {
    const dataPath = this.getDataPath()
    if (!existsSync(dataPath)) {
      mkdirSync(dataPath, { recursive: true })
    }
    this.boundDataPath = dataPath

    resetSessionManagerForTests(new SessionManager(undefined, dataPath))
    resetPreferencesManagerForTests(new PreferencesManager(undefined, dataPath))
    resetTemplateManagerForTests()
    rebindTemplateManager(dataPath)
    resetUntitledNotesManagerForTests()
    rebindUntitledNotesManager(dataPath)

    log.info('[workspace] managers bound to', dataPath)
  }

  /**
   * Open a folder as workspace. Caller should flush session first if needed.
   */
  openRoot(rootPath: string): WorkspaceInfo {
    const resolved = resolve(rootPath)
    if (!existsSync(resolved) || !statSync(resolved).isDirectory()) {
      throw new Error('Pasta inválida ou inexistente')
    }

    this.activeRoot = resolved
    const registry = this.readRegistry()
    this.writeRegistry({
      ...registry,
      activeRoot: resolved,
      recentWorkspaces: pushRecentWorkspace(registry.recentWorkspaces, resolved)
    })
    this.rebindManagers()
    void startWorkspaceWatcher(resolved)
    this.broadcastChanged()
    return this.getInfo()
  }

  /** Return to global (no folder) mode. */
  closeWorkspace(): WorkspaceInfo {
    this.activeRoot = null
    const registry = this.readRegistry()
    this.writeRegistry({ ...registry, activeRoot: null })
    this.rebindManagers()
    void startWorkspaceWatcher(null)
    this.broadcastChanged()
    return this.getInfo()
  }

  async showOpenFolderDialog(): Promise<WorkspaceInfo | null> {
    const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0] ?? undefined
    const result = await dialog.showOpenDialog(win ?? undefined, {
      title: 'Abrir pasta como Workspace',
      properties: ['openDirectory', 'createDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return this.openRoot(result.filePaths[0]!)
  }

  /**
   * List one directory under the active workspace root (lazy tree).
   * When no workspace, listing is disabled (returns empty).
   */
  listDir(dirPath?: string): ListDirResult {
    const root = this.activeRoot
    if (!root) {
      return { path: '', entries: [] }
    }

    const target = dirPath ? resolve(dirPath) : resolve(root)
    if (!isPathInsideRoot(root, target)) {
      throw new Error('Caminho fora do workspace')
    }
    if (!existsSync(target) || !statSync(target).isDirectory()) {
      throw new Error('Diretório inválido')
    }

    const names = readdirSync(target)
    const entries: DirEntryDTO[] = []

    for (const name of names) {
      if (EXPLORER_IGNORE_NAMES.has(name)) continue
      if (name.startsWith('.') && name !== '.env') continue
      const full = join(target, name)
      let isDirectory = false
      try {
        isDirectory = statSync(full).isDirectory()
      } catch {
        continue
      }
      const ext = isDirectory
        ? ''
        : name.includes('.')
          ? name.slice(name.lastIndexOf('.') + 1).toLowerCase()
          : ''
      entries.push({ name, path: full, isDirectory, ext })
    }

    entries.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    })

    return { path: target, entries }
  }

  private broadcastChanged(): void {
    const payload = this.getInfo()
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send('workspace:changed', payload)
    }
  }

  getBoundDataPath(): string {
    return this.boundDataPath
  }
}

export function isPathInsideRoot(root: string, candidate: string): boolean {
  const rootResolved = resolve(root)
  const candResolved = resolve(candidate)
  if (candResolved === rootResolved) return true
  const rootNorm = normalize(rootResolved + sep)
  return normalize(candResolved).startsWith(rootNorm)
}

let workspaceSingleton: WorkspaceManager | null = null

export function getWorkspaceManager(): WorkspaceManager {
  if (!workspaceSingleton) {
    workspaceSingleton = new WorkspaceManager()
  }
  return workspaceSingleton
}

export function resetWorkspaceManagerForTests(): void {
  workspaceSingleton = null
}
