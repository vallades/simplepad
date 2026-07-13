import { lazy, Suspense, useCallback, useEffect, useRef } from 'react'
import TabBar from './components/TabBar'
import StatusBar from './components/StatusBar'
import { EditorErrorBoundary } from './components/EditorErrorBoundary'
import { useTabsStore } from './store/useTabsStore'
import {
  isElectronApiAvailable,
  loadSessionFromMain,
  persistSessionToMain
} from './services/sessionBridge'
import {
  confirmCloseTab,
  confirmQuitWithUnsaved,
  openFilesFromDisk,
  saveActiveTab,
  saveActiveTabAs
} from './services/fileActions'
import type { MenuCommand } from '../shared/session'

const Editor = lazy(() => import('./components/Editor'))

const SESSION_SAVE_DEBOUNCE_MS = 400

function App(): React.JSX.Element {
  const createNewTab = useTabsStore((state) => state.createNewTab)
  const closeTab = useTabsStore((state) => state.closeTab)
  const switchTab = useTabsStore((state) => state.switchTab)
  const getActiveTab = useTabsStore((state) => state.getActiveTab)
  const hydrateFromSession = useTabsStore((state) => state.hydrateFromSession)
  const hasUnsavedChanges = useTabsStore((state) => state.hasUnsavedChanges)
  const sessionHydrated = useTabsStore((state) => state.sessionHydrated)
  const tabs = useTabsStore((state) => state.tabs)
  const activeTabId = useTabsStore((state) => state.activeTabId)

  const saveTimerRef = useRef<number | null>(null)

  const flushSession = useCallback(async (): Promise<boolean> => {
    const state = useTabsStore.getState()
    return persistSessionToMain(state.tabs, state.activeTabId)
  }, [])

  const requestCloseActiveTab = useCallback((): void => {
    const active = getActiveTab()
    if (!active) return
    if (active.isDirty && !confirmCloseTab(active.title)) return
    closeTab(active.id)
  }, [closeTab, getActiveTab])

  const handleMenuCommand = useCallback(
    (command: MenuCommand): void => {
      switch (command) {
        case 'new-tab':
          createNewTab()
          break
        case 'open-file':
          void openFilesFromDisk()
          break
        case 'save-file':
          void saveActiveTab()
          break
        case 'save-file-as':
          void saveActiveTabAs()
          break
        case 'close-tab':
          requestCloseActiveTab()
          break
        case 'quit':
          // Main drives quit; renderer only responds to app:request-quit
          break
        default:
          break
      }
    },
    [createNewTab, requestCloseActiveTab]
  )

  // Hydrate session from main process once
  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const session = await loadSessionFromMain()
        if (cancelled) return
        hydrateFromSession(session)
      } catch (error) {
        console.error('[App] session hydrate failed:', error)
        if (!cancelled) hydrateFromSession(null)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [hydrateFromSession])

  // Debounced session persistence whenever tabs change (after hydrate)
  useEffect(() => {
    if (!sessionHydrated) return
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current)
    }
    saveTimerRef.current = window.setTimeout(() => {
      void flushSession()
    }, SESSION_SAVE_DEBOUNCE_MS)

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [tabs, activeTabId, sessionHydrated, flushSession])

  // Menu commands from main process
  useEffect(() => {
    if (!isElectronApiAvailable()) return
    return window.api.onMenuCommand(handleMenuCommand)
  }, [handleMenuCommand])

  // Quit confirmation from main (before-quit / window close)
  useEffect(() => {
    if (!isElectronApiAvailable()) return

    return window.api.onRequestQuit(() => {
      void (async () => {
        if (hasUnsavedChanges()) {
          const ok = confirmQuitWithUnsaved()
          if (!ok) {
            window.api.respondToQuit(false)
            return
          }
        }
        await flushSession()
        window.api.respondToQuit(true)
      })()
    })
  }, [flushSession, hasUnsavedChanges])

  // Keyboard shortcuts (also covered by native menu accelerators when focused)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const mod = event.metaKey || event.ctrlKey
      if (!mod) return

      const key = event.key.toLowerCase()

      if (key === 'n' && !event.shiftKey && !event.altKey) {
        event.preventDefault()
        createNewTab()
        return
      }

      if (key === 'o' && !event.shiftKey && !event.altKey) {
        event.preventDefault()
        void openFilesFromDisk()
        return
      }

      if (key === 's' && event.shiftKey) {
        event.preventDefault()
        void saveActiveTabAs()
        return
      }

      if (key === 's' && !event.shiftKey && !event.altKey) {
        event.preventDefault()
        void saveActiveTab()
        return
      }

      if (key === 'w' && !event.shiftKey && !event.altKey) {
        event.preventDefault()
        requestCloseActiveTab()
        return
      }

      if (event.key === 'Tab' && tabs.length > 1) {
        event.preventDefault()
        const currentIndex = tabs.findIndex((tab) => tab.id === activeTabId)
        if (currentIndex === -1) return
        const delta = event.shiftKey ? -1 : 1
        const nextIndex = (currentIndex + delta + tabs.length) % tabs.length
        const next = tabs[nextIndex]
        if (next) switchTab(next.id)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [activeTabId, createNewTab, requestCloseActiveTab, switchTab, tabs])

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-3 py-1.5 dark:border-zinc-800">
        <h1 className="text-sm font-semibold tracking-tight">SimplePad</h1>
        <span className="text-xs text-zinc-500">
          {sessionHydrated ? 'Sessão sincronizada' : 'Carregando sessão…'}
        </span>
      </header>

      <TabBar />

      <main className="flex min-h-0 flex-1 flex-col">
        <EditorErrorBoundary>
          <Suspense
            fallback={
              <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-zinc-400">
                Carregando editor…
              </div>
            }
          >
            <Editor />
          </Suspense>
        </EditorErrorBoundary>
      </main>

      <StatusBar />
    </div>
  )
}

export default App
