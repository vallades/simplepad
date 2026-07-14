import { useCallback, useEffect, useRef, useState } from 'react'
import TabBar from './components/TabBar'
import StatusBar from './components/StatusBar'
import SettingsModal from './components/SettingsModal'
import ToastStack from './components/ToastStack'
import EditorWorkspace from './components/EditorWorkspace'
import { useTabsStore } from './store/useTabsStore'
import { useSettingsStore } from './store/useSettingsStore'
import { useUiStore } from './store/useUiStore'
import {
  isElectronApiAvailable,
  loadSessionFromMain,
  persistSessionToMain
} from './services/sessionBridge'
import {
  clearRecentFilesList,
  confirmCloseTab,
  confirmQuitWithUnsaved,
  openFilesFromDisk,
  openRecentFile,
  saveActiveTab,
  saveActiveTabAs
} from './services/fileActions'
import { exportActiveAsHtml, exportActiveAsPdf } from './services/exportActions'
import { autoSaveTabOnSwitch, intervalMsFromSeconds, runAutoSavePass } from './services/autoSave'
import { applyThemeToDocument } from './utils/theme'
import type { MenuCommand } from '../shared/session'

const SESSION_SAVE_DEBOUNCE_MS = 400

function App(): React.JSX.Element {
  const createNewTab = useTabsStore((state) => state.createNewTab)
  const closeTab = useTabsStore((state) => state.closeTab)
  const switchTab = useTabsStore((state) => state.switchTab)
  const getActiveTab = useTabsStore((state) => state.getActiveTab)
  const hydrateFromSession = useTabsStore((state) => state.hydrateFromSession)
  const hasUnsavedChanges = useTabsStore((state) => state.hasUnsavedChanges)
  const toggleMarkdownMode = useTabsStore((state) => state.toggleMarkdownMode)
  const sessionHydrated = useTabsStore((state) => state.sessionHydrated)
  const tabs = useTabsStore((state) => state.tabs)
  const activeTabId = useTabsStore((state) => state.activeTabId)

  const loadSettings = useSettingsStore((state) => state.loadFromMain)
  const settingsHydrated = useSettingsStore((state) => state.hydrated)
  const themePreference = useSettingsStore((state) => state.theme)
  const autoSaveEnabled = useSettingsStore((state) => state.autoSaveEnabled)
  const autoSaveIntervalSeconds = useSettingsStore((state) => state.autoSaveIntervalSeconds)

  const splitPreview = useUiStore((state) => state.splitPreview)
  const toggleSplitPreview = useUiStore((state) => state.toggleSplitPreview)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const saveTimerRef = useRef<number | null>(null)
  const previousTabIdRef = useRef<string | null>(null)

  const flushSession = useCallback(async (): Promise<boolean> => {
    const state = useTabsStore.getState()
    return persistSessionToMain(state.tabs, state.activeTabId)
  }, [])

  const requestCloseActiveTab = useCallback((): void => {
    void (async () => {
      const active = getActiveTab()
      if (!active) return
      if (active.isDirty) {
        const ok = await confirmCloseTab(active.title)
        if (!ok) return
      }
      closeTab(active.id)
    })()
  }, [closeTab, getActiveTab])

  const toggleActiveMarkdown = useCallback((): void => {
    const active = getActiveTab()
    if (!active) return
    toggleMarkdownMode(active.id)
  }, [getActiveTab, toggleMarkdownMode])

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
        case 'open-settings':
          setSettingsOpen(true)
          break
        case 'clear-recent':
          void clearRecentFilesList()
          break
        case 'toggle-preview':
          toggleSplitPreview()
          break
        case 'toggle-markdown':
          toggleActiveMarkdown()
          break
        case 'export-html':
          void exportActiveAsHtml()
          break
        case 'export-pdf':
          void exportActiveAsPdf()
          break
        case 'quit':
          break
        default:
          break
      }
    },
    [createNewTab, requestCloseActiveTab, toggleActiveMarkdown, toggleSplitPreview]
  )

  // Hydrate settings + session from main
  useEffect(() => {
    let cancelled = false
    void (async () => {
      await loadSettings()
      if (cancelled) return
      try {
        const { session } = await loadSessionFromMain()
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
  }, [hydrateFromSession, loadSettings])

  // Keep document theme in sync with OS when preference is "system"
  useEffect(() => {
    applyThemeToDocument(themePreference)
    if (themePreference !== 'system') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (): void => applyThemeToDocument('system')
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [themePreference])

  // Debounced session persistence
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

  // Interval auto-save
  useEffect(() => {
    if (!sessionHydrated || !autoSaveEnabled) return

    const ms = intervalMsFromSeconds(autoSaveIntervalSeconds)
    const timer = window.setInterval(() => {
      void runAutoSavePass()
    }, ms)

    return () => window.clearInterval(timer)
  }, [sessionHydrated, autoSaveEnabled, autoSaveIntervalSeconds])

  // Auto-save previous tab when switching
  useEffect(() => {
    const prev = previousTabIdRef.current
    if (prev && prev !== activeTabId) {
      void autoSaveTabOnSwitch(prev)
    }
    previousTabIdRef.current = activeTabId
  }, [activeTabId])

  // Auto-save on window blur / hide
  useEffect(() => {
    if (!autoSaveEnabled) return

    const onBlur = (): void => {
      void runAutoSavePass()
    }
    const onVisibility = (): void => {
      if (document.visibilityState === 'hidden') {
        void runAutoSavePass()
      }
    }

    window.addEventListener('blur', onBlur)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [autoSaveEnabled])

  // Menu commands
  useEffect(() => {
    if (!isElectronApiAvailable()) return
    return window.api.onMenuCommand(handleMenuCommand)
  }, [handleMenuCommand])

  // Recent files from menu
  useEffect(() => {
    if (!isElectronApiAvailable()) return
    return window.api.onOpenRecent((filePath) => {
      void openRecentFile(filePath)
    })
  }, [])

  // Quit confirmation
  useEffect(() => {
    if (!isElectronApiAvailable()) return

    return window.api.onRequestQuit(() => {
      void (async () => {
        if (hasUnsavedChanges()) {
          const ok = await confirmQuitWithUnsaved()
          if (!ok) {
            window.api.respondToQuit(false)
            return
          }
        }
        await runAutoSavePass()
        await flushSession()
        window.api.respondToQuit(true)
      })()
    })
  }, [flushSession, hasUnsavedChanges])

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      const mod = event.metaKey || event.ctrlKey
      if (!mod) return

      const key = event.key.toLowerCase()

      if (key === ',' && !event.shiftKey && !event.altKey) {
        event.preventDefault()
        setSettingsOpen(true)
        return
      }

      if (key === 'p' && event.shiftKey) {
        event.preventDefault()
        toggleSplitPreview()
        return
      }

      if (key === 'm' && event.shiftKey) {
        event.preventDefault()
        toggleActiveMarkdown()
        return
      }

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
  }, [
    activeTabId,
    createNewTab,
    requestCloseActiveTab,
    switchTab,
    tabs,
    toggleActiveMarkdown,
    toggleSplitPreview
  ])

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-3 py-1.5 dark:border-zinc-800">
        <h1 className="text-sm font-semibold tracking-tight">SimplePad</h1>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className={[
              'rounded px-2 py-0.5 text-xs',
              splitPreview
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
            ].join(' ')}
            onClick={() => toggleSplitPreview()}
            title="Split View — Preview (⌘⇧P)"
            aria-pressed={splitPreview}
          >
            Preview
          </button>
          <button
            type="button"
            className="rounded px-2 py-0.5 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            onClick={() => setSettingsOpen(true)}
            title="Configurações (⌘,)"
          >
            Configurações
          </button>
          <span className="pl-1 text-xs text-zinc-500">
            {sessionHydrated && settingsHydrated ? 'Pronto' : 'Carregando…'}
          </span>
        </div>
      </header>

      <TabBar />

      <main className="flex min-h-0 flex-1 flex-col">
        <EditorWorkspace />
      </main>

      <StatusBar />
      {settingsOpen ? <SettingsModal open onClose={() => setSettingsOpen(false)} /> : null}
      <ToastStack />
    </div>
  )
}

export default App
