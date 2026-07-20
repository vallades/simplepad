import { app } from 'electron'
import ElectronStore from 'electron-store'
import log from 'electron-log/main'
import {
  SESSION_VERSION,
  type AppSession,
  type SessionLoadResult,
  type TabDTO
} from '../shared/session'
import { sanitizeSession } from '../shared/sessionSanitize'

export { createEmptySession, sanitizeSession } from '../shared/sessionSanitize'

interface SessionStoreSchema {
  session: AppSession | null
}

/** Minimal surface we use from electron-store */
interface SessionStore {
  path: string
  get: (key: 'session', defaultValue?: AppSession | null) => AppSession | null
  set: (key: 'session', value: AppSession | null) => void
}

type StoreConstructor = new (options?: {
  name?: string
  cwd?: string
  defaults?: SessionStoreSchema
  clearInvalidConfig?: boolean
}) => SessionStore

/**
 * electron-store v10 is ESM-only. electron-vite main is emitted as CJS
 * (`require('electron-store')`), which yields `{ default: Store }` instead of
 * the constructor. Resolve both shapes.
 */
function resolveStoreConstructor(): StoreConstructor {
  // Runtime interop: CJS require may wrap the ESM default export
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
 * Persists the full tab session under userData via electron-store.
 *
 * File location (example):
 *   macOS: ~/Library/Application Support/simplepad/session.json
 */
export class SessionManager {
  private readonly store: SessionStore

  constructor(store?: SessionStore, dataPath?: string) {
    this.store =
      store ??
      new Store({
        name: 'session',
        cwd: dataPath ?? app.getPath('userData'),
        defaults: {
          session: null
        },
        clearInvalidConfig: true
      })

    log.info('[SessionManager] store path:', this.store.path)
  }

  /**
   * Saves the complete session (tabs + active tab).
   * Accepts AppSession or a bare TabDTO[] (active tab becomes first / previous).
   */
  saveSession(input: AppSession | TabDTO[]): void {
    try {
      const session = Array.isArray(input)
        ? sanitizeSession({
            version: SESSION_VERSION,
            tabs: input,
            activeTabId: input[0]?.id ?? null
          })
        : sanitizeSession(input)

      if (!session) {
        log.warn('[SessionManager] refused to save invalid session payload')
        return
      }

      this.store.set('session', session)
      log.info(
        `[SessionManager] saved ${session.tabs.length} tab(s), active=${session.activeTabId}`
      )
    } catch (error) {
      log.error('[SessionManager] saveSession failed:', error)
      throw error
    }
  }

  /**
   * Loads the last session. Returns null session when missing or corrupted
   * (caller should open a fresh empty tab).
   */
  loadSessionDetailed(): SessionLoadResult {
    try {
      const raw = this.store.get('session', null)
      const session = sanitizeSession(raw)
      if (!session) {
        if (raw != null) {
          log.warn('[SessionManager] corrupted session — clearing and returning null')
          this.clearSession()
          return { session: null, recoveredFromCorruption: true }
        }
        return { session: null, recoveredFromCorruption: false }
      }
      log.info(`[SessionManager] loaded ${session.tabs.length} tab(s)`)
      return { session, recoveredFromCorruption: false }
    } catch (error) {
      log.error('[SessionManager] loadSession failed — treating as empty:', error)
      try {
        this.clearSession()
      } catch {
        // ignore secondary failure
      }
      return {
        session: null,
        recoveredFromCorruption: true,
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /** Convenience: session only (or null). */
  loadSession(): AppSession | null {
    return this.loadSessionDetailed().session
  }

  /** Convenience: returns only tabs or null */
  loadTabs(): TabDTO[] | null {
    return this.loadSession()?.tabs ?? null
  }

  clearSession(): void {
    try {
      this.store.set('session', null)
      log.info('[SessionManager] session cleared')
    } catch (error) {
      log.error('[SessionManager] clearSession failed:', error)
      throw error
    }
  }

  getStorePath(): string {
    return this.store.path
  }
}

let singleton: SessionManager | null = null

export function getSessionManager(): SessionManager {
  if (!singleton) {
    singleton = new SessionManager()
  }
  return singleton
}

/** Test helper */
export function resetSessionManagerForTests(manager?: SessionManager): void {
  singleton = manager ?? null
}
