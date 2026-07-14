import { app } from 'electron'
import ElectronStore from 'electron-store'
import log from 'electron-log/main'
import { DEFAULT_SETTINGS, type AppSettings } from '../shared/settings'
import { pushRecentFile, sanitizeRecentFiles, sanitizeSettings } from '../shared/settingsSanitize'

interface PreferencesStoreSchema {
  settings: AppSettings
  recentFiles: string[]
}

interface PreferencesStore {
  path: string
  get: {
    (key: 'settings', defaultValue?: AppSettings): AppSettings
    (key: 'recentFiles', defaultValue?: string[]): string[]
  }
  set: {
    (key: 'settings', value: AppSettings): void
    (key: 'recentFiles', value: string[]): void
  }
}

type StoreConstructor = new (options?: {
  name?: string
  cwd?: string
  defaults?: PreferencesStoreSchema
  clearInvalidConfig?: boolean
}) => PreferencesStore

function resolveStoreConstructor(): StoreConstructor {
  const mod: unknown = ElectronStore
  if (typeof mod === 'function') {
    return mod as StoreConstructor
  }
  if (mod && typeof mod === 'object' && 'default' in mod) {
    const nested = (mod as { default: unknown }).default
    if (typeof nested === 'function') {
      return nested as StoreConstructor
    }
  }
  throw new TypeError('electron-store Store is not a constructor (ESM/CJS interop failed)')
}

const Store = resolveStoreConstructor()

/**
 * Persists settings + recent files under userData via electron-store.
 * Separate file from session.json (`preferences.json`).
 */
export class PreferencesManager {
  private readonly store: PreferencesStore

  constructor(store?: PreferencesStore) {
    this.store =
      store ??
      new Store({
        name: 'preferences',
        cwd: app.getPath('userData'),
        defaults: {
          settings: { ...DEFAULT_SETTINGS },
          recentFiles: []
        },
        clearInvalidConfig: true
      })

    log.info('[PreferencesManager] store path:', this.store.path)
  }

  getSettings(): AppSettings {
    try {
      return sanitizeSettings(this.store.get('settings', DEFAULT_SETTINGS))
    } catch (error) {
      log.error('[PreferencesManager] getSettings failed:', error)
      return { ...DEFAULT_SETTINGS }
    }
  }

  setSettings(partial: Partial<AppSettings>): AppSettings {
    const next = sanitizeSettings({ ...this.getSettings(), ...partial })
    this.store.set('settings', next)
    log.info('[PreferencesManager] settings saved')
    return next
  }

  getRecentFiles(): string[] {
    try {
      return sanitizeRecentFiles(this.store.get('recentFiles', []))
    } catch (error) {
      log.error('[PreferencesManager] getRecentFiles failed:', error)
      return []
    }
  }

  addRecentFile(filePath: string): string[] {
    const next = pushRecentFile(this.getRecentFiles(), filePath)
    this.store.set('recentFiles', next)
    return next
  }

  clearRecentFiles(): void {
    this.store.set('recentFiles', [])
    log.info('[PreferencesManager] recent files cleared')
  }

  getStorePath(): string {
    return this.store.path
  }
}

let singleton: PreferencesManager | null = null

export function getPreferencesManager(): PreferencesManager {
  if (!singleton) {
    singleton = new PreferencesManager()
  }
  return singleton
}

/** Test helper */
export function resetPreferencesManagerForTests(manager?: PreferencesManager): void {
  singleton = manager ?? null
}
