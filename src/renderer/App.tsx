import { useCallback, useEffect, useRef, useState } from 'react'
import { Columns2, Maximize2, Minimize2, Settings } from 'lucide-react'
import TabBar from './components/TabBar'
import StatusBar from './components/StatusBar'
import SettingsModal from './components/SettingsModal'
import SearchAllTabsModal from './components/SearchAllTabsModal'
import ExportPdfModal from './components/ExportPdfModal'
import ToastStack from './components/ToastStack'
import EditorWorkspace from './components/EditorWorkspace'
import ActivityBar from './components/ActivityBar'
import SidePanel from './components/SidePanel'
import type { SidePanelViewId } from '../shared/settings'
import { dispatchEditorCommand } from './services/editorCommands'
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
  openDroppedFilePath,
  openFilesFromDisk,
  openRecentFile,
  saveActiveTab,
  saveActiveTabAs
} from './services/fileActions'
import { createTabFromTemplateId } from './services/templateActions'
import {
  currentExportTheme,
  exportActiveAsHtml,
  exportActiveAsPdfWithOptions
} from './services/exportActions'
import { toggleActiveTabMarkdownMode } from './services/markdownMode'
import { autoSaveTabOnSwitch, intervalMsFromSeconds, runAutoSavePass } from './services/autoSave'
import {
  handleUpdateEvent,
  requestCheckForUpdates,
  syncFocusModeToMain
} from './services/updateBridge'
import {
  closeActiveWorkspace,
  loadWorkspaceInfo,
  openWorkspaceByPath,
  openWorkspaceFromDialog
} from './services/workspaceActions'
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

  const sessionHydrated = useTabsStore((state) => state.sessionHydrated)
  const tabs = useTabsStore((state) => state.tabs)
  const activeTabId = useTabsStore((state) => state.activeTabId)

  const loadSettings = useSettingsStore((state) => state.loadFromMain)
  const settingsHydrated = useSettingsStore((state) => state.hydrated)
  const themePreference = useSettingsStore((state) => state.theme)
  const autoSaveEnabled = useSettingsStore((state) => state.autoSaveEnabled)
  const autoSaveIntervalSeconds = useSettingsStore((state) => state.autoSaveIntervalSeconds)
  const splitOrientation = useSettingsStore((state) => state.splitOrientation)
  const updateSettings = useSettingsStore((state) => state.updateSettings)
  const activeView = useSettingsStore((state) => state.activeView)
  const sidePanelCollapsed = useSettingsStore((state) => state.sidePanelCollapsed)
  const sidebarWidth = useSettingsStore((state) => state.sidebarWidth)

  const splitPreview = useUiStore((state) => state.splitPreview)
  const toggleSplitPreview = useUiStore((state) => state.toggleSplitPreview)
  const focusMode = useUiStore((state) => state.focusMode)
  const setFocusMode = useUiStore((state) => state.setFocusMode)
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [searchTabsOpen, setSearchTabsOpen] = useState(false)
  const [pdfExportOpen, setPdfExportOpen] = useState(false)
  const [appVersion, setAppVersion] = useState<string>('')
  const [fileDropActive, setFileDropActive] = useState(false)
  /** Detect macOS once — traffic-light left padding for hiddenInset */
  const [isMac] = useState(() => {
    if (typeof window !== 'undefined' && typeof window.api?.getPlatform === 'function') {
      return window.api.getPlatform() === 'darwin'
    }
    if (typeof navigator !== 'undefined') {
      return /Mac|iPhone|iPad/.test(navigator.userAgent)
    }
    return false
  })
  const saveTimerRef = useRef<number | null>(null)
  const previousTabIdRef = useRef<string | null>(null)
  const focusModeRef = useRef(focusMode)

  useEffect(() => {
    focusModeRef.current = focusMode
  }, [focusMode])

  const applyFocusMode = useCallback(
    (enabled: boolean): void => {
      setFocusMode(enabled)
      void syncFocusModeToMain(enabled)
      // Persist last focus state when user prefers to remember it
      const remember = useSettingsStore.getState().rememberFocusMode
      if (remember) {
        void useSettingsStore.getState().updateSettings({ focusModeLast: enabled })
      }
    },
    [setFocusMode]
  )

  const requestToggleFocusMode = useCallback((): void => {
    applyFocusMode(!focusModeRef.current)
  }, [applyFocusMode])

  const requestToggleSidebar = useCallback((): void => {
    const collapsed = !useSettingsStore.getState().sidePanelCollapsed
    setSidebarOpen(!collapsed)
    void useSettingsStore.getState().updateSettings({
      sidePanelCollapsed: collapsed,
      sidebarOpen: !collapsed
    })
  }, [setSidebarOpen])

  const selectActivityView = useCallback(
    (view: SidePanelViewId): void => {
      setSidebarOpen(true)
      void updateSettings({
        activeView: view,
        sidePanelCollapsed: false,
        sidebarOpen: true
      })
    },
    [setSidebarOpen, updateSettings]
  )

  const setSidePanelWidth = useCallback(
    (width: number): void => {
      void updateSettings({ sidebarWidth: width })
    },
    [updateSettings]
  )

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
    toggleActiveTabMarkdownMode()
  }, [])

  const handleMenuCommand = useCallback(
    (command: MenuCommand): void => {
      switch (command) {
        case 'new-tab':
          createNewTab()
          break
        case 'open-file':
          void openFilesFromDisk()
          break
        case 'open-workspace':
          void openWorkspaceFromDialog()
          break
        case 'close-workspace':
          void closeActiveWorkspace()
          break
        case 'toggle-sidebar':
          requestToggleSidebar()
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
          setPdfExportOpen(true)
          break
        case 'toggle-focus-mode':
          requestToggleFocusMode()
          break
        case 'exit-focus-mode':
          applyFocusMode(false)
          break
        case 'check-updates':
          void requestCheckForUpdates()
          break
        case 'find':
          dispatchEditorCommand('find')
          break
        case 'replace':
          dispatchEditorCommand('replace')
          break
        case 'go-to-line':
          dispatchEditorCommand('go-to-line')
          break
        case 'find-in-tabs':
          setSearchTabsOpen(true)
          break
        case 'toggle-split-orientation':
          void updateSettings({
            splitOrientation: splitOrientation === 'horizontal' ? 'vertical' : 'horizontal'
          })
          break
        case 'toggle-outline':
          void updateSettings({
            showMarkdownOutline: !useSettingsStore.getState().showMarkdownOutline
          })
          break
        case 'toggle-properties':
          void updateSettings({
            showMarkdownProperties: !useSettingsStore.getState().showMarkdownProperties
          })
          break
        case 'quit':
          break
        default:
          break
      }
    },
    [
      applyFocusMode,
      createNewTab,
      requestCloseActiveTab,
      requestToggleFocusMode,
      requestToggleSidebar,
      splitOrientation,
      toggleActiveMarkdown,
      toggleSplitPreview,
      updateSettings
    ]
  )

  // Hydrate settings + session from main; restore focus mode if remembered
  useEffect(() => {
    let cancelled = false
    void (async () => {
      await loadSettings()
      if (cancelled) return
      if (isElectronApiAvailable()) {
        try {
          const v = await window.api.getVersion()
          if (!cancelled) setAppVersion(v)
        } catch {
          // ignore
        }
      }
      // Prefetch snippets for Tab expansion
      void import('./services/snippetActions').then((m) => m.listSnippets())
      await loadWorkspaceInfo()
      if (cancelled) return
      const settings = useSettingsStore.getState()
      setSidebarOpen(!settings.sidePanelCollapsed)
      if (settings.rememberFocusMode && settings.focusModeLast) {
        applyFocusMode(true)
      }
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
  }, [hydrateFromSession, loadSettings, applyFocusMode, setSidebarOpen])

  // Theme
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

  // Auto-save on blur / hide
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

  // Recent files
  useEffect(() => {
    if (!isElectronApiAvailable()) return
    return window.api.onOpenRecent((filePath) => {
      void openRecentFile(filePath)
    })
  }, [])

  // Recent workspaces (menu)
  useEffect(() => {
    if (!isElectronApiAvailable() || typeof window.api.onOpenRecentWorkspace !== 'function') return
    return window.api.onOpenRecentWorkspace((rootPath) => {
      void openWorkspaceByPath(rootPath)
    })
  }, [])

  // Workspace changed from main (safety net)
  useEffect(() => {
    if (!isElectronApiAvailable() || typeof window.api.onWorkspaceChanged !== 'function') return
    return window.api.onWorkspaceChanged((info) => {
      void import('./store/useWorkspaceStore').then(({ useWorkspaceStore: store }) => {
        store.getState().setFromInfo(info)
      })
    })
  }, [])

  // Nova nota a partir de template (menu Arquivo)
  useEffect(() => {
    if (!isElectronApiAvailable() || typeof window.api.onNewFromTemplate !== 'function') return
    return window.api.onNewFromTemplate((templateId) => {
      void createTabFromTemplateId(templateId)
    })
  }, [])

  // Auto-updater events → toasts
  useEffect(() => {
    if (!isElectronApiAvailable() || typeof window.api.onUpdateEvent !== 'function') return
    return window.api.onUpdateEvent(handleUpdateEvent)
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
      // F11 — distraction-free (also wired via native menu accelerator)
      if (event.key === 'F11') {
        event.preventDefault()
        requestToggleFocusMode()
        return
      }

      // Esc exits focus mode
      if (event.key === 'Escape' && focusModeRef.current) {
        event.preventDefault()
        applyFocusMode(false)
        return
      }

      const mod = event.metaKey || event.ctrlKey
      if (!mod) return

      const key = event.key.toLowerCase()

      // Sidebar toggle: Ctrl/Cmd+B
      if (key === 'b' && !event.shiftKey && !event.altKey) {
        event.preventDefault()
        requestToggleSidebar()
        return
      }

      if (key === ',' && !event.shiftKey && !event.altKey) {
        event.preventDefault()
        setSettingsOpen(true)
        return
      }

      // Global Preview toggle: Ctrl/Cmd+Shift+P
      if (key === 'p' && event.shiftKey) {
        event.preventDefault()
        toggleSplitPreview()
        return
      }

      if (key === 'f' && event.shiftKey) {
        event.preventDefault()
        setSearchTabsOpen(true)
        return
      }

      if (key === 'g' && !event.shiftKey && !event.altKey) {
        event.preventDefault()
        dispatchEditorCommand('go-to-line')
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
    applyFocusMode,
    createNewTab,
    requestCloseActiveTab,
    requestToggleFocusMode,
    requestToggleSidebar,
    switchTab,
    tabs,
    toggleActiveMarkdown,
    toggleSplitPreview
  ])

  const previewTitle = splitPreview
    ? 'Ocultar Preview (Ctrl/Cmd+Shift+P)'
    : 'Mostrar Preview / Split View (Ctrl/Cmd+Shift+P)'

  const onWindowDragOver = (event: React.DragEvent): void => {
    // Only react to file drops from OS (not internal tab reorder)
    if (![...event.dataTransfer.types].includes('Files')) return
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = 'copy'
    if (!fileDropActive) setFileDropActive(true)
  }

  const onWindowDragEnter = (event: React.DragEvent): void => {
    if (![...event.dataTransfer.types].includes('Files')) return
    event.preventDefault()
    setFileDropActive(true)
  }

  const onWindowDragLeave = (event: React.DragEvent): void => {
    // Only clear when leaving the app root (not when entering a child)
    const related = event.relatedTarget as Node | null
    if (related && event.currentTarget.contains(related)) return
    setFileDropActive(false)
  }

  const onWindowDrop = (event: React.DragEvent): void => {
    if (![...event.dataTransfer.types].includes('Files')) return
    event.preventDefault()
    event.stopPropagation()
    setFileDropActive(false)

    const files = Array.from(event.dataTransfer.files)
    if (files.length === 0) return

    let opened = 0
    for (const file of files) {
      let path = ''
      if (isElectronApiAvailable() && typeof window.api.getPathForFile === 'function') {
        path = window.api.getPathForFile(file)
      }
      if (!path) {
        path = (file as File & { path?: string }).path ?? ''
      }
      if (path) {
        void openDroppedFilePath(path)
        opened += 1
      }
    }
    if (opened === 0) {
      // no path resolved (e.g. browser-only)
    }
  }

  return (
    <div
      className={[
        'relative flex h-screen w-screen flex-col overflow-hidden bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100',
        // macOS traffic lights clearance when titleBarStyle is hiddenInset
        focusMode ? '' : 'pt-0'
      ].join(' ')}
      data-focus-mode={focusMode ? 'true' : 'false'}
      data-preview={splitPreview ? 'true' : 'false'}
      onDragEnter={onWindowDragEnter}
      onDragOver={onWindowDragOver}
      onDragLeave={onWindowDragLeave}
      onDrop={onWindowDrop}
    >
      {fileDropActive ? (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center border-4 border-dashed border-blue-500 bg-blue-500/10 ring-4 ring-inset ring-blue-400/30 dark:border-blue-400 dark:bg-blue-500/15">
          <p className="rounded-lg border border-blue-200 bg-white/95 px-5 py-3 text-sm font-medium text-blue-900 shadow-lg dark:border-blue-800 dark:bg-zinc-900/95 dark:text-blue-100">
            Solte arquivos de texto para abrir em novas abas
            <span className="mt-1 block text-[11px] font-normal text-blue-700/80 dark:text-blue-300/80">
              .txt · .md · .json · .ts · .csv · …
            </span>
          </p>
        </div>
      ) : null}
      {!focusMode ? (
        <header
          className={[
            'app-drag flex shrink-0 items-center justify-between border-b border-zinc-200 px-3 py-1.5 dark:border-zinc-800',
            isMac ? 'mac-titlebar-pad' : ''
          ].join(' ')}
        >
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="app-no-drag text-sm font-semibold tracking-tight">SimplePad</h1>
            {splitPreview ? (
              <span
                className="app-no-drag inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                title="Split View ativo — Editor | Preview"
              >
                <Columns2 size={11} strokeWidth={2} aria-hidden />
                Preview ativo
              </span>
            ) : null}
            {appVersion ? (
              <span className="app-no-drag text-[10px] text-zinc-400">v{appVersion}</span>
            ) : null}
          </div>
          <div className="app-no-drag flex items-center gap-1">
            <button
              type="button"
              className={[
                'inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors',
                splitPreview
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'
              ].join(' ')}
              onClick={() => toggleSplitPreview()}
              title={previewTitle}
              aria-pressed={splitPreview}
              aria-label={previewTitle}
            >
              <Columns2 size={14} strokeWidth={2} aria-hidden />
              <span className="hidden sm:inline">Preview</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              onClick={() => requestToggleFocusMode()}
              title="Modo Distração Zero (F11)"
              aria-pressed={focusMode}
            >
              <Maximize2 size={14} strokeWidth={2} aria-hidden />
              <span className="hidden sm:inline">Foco</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              onClick={() => setSettingsOpen(true)}
              title="Configurações (Ctrl/Cmd+,)"
            >
              <Settings size={14} strokeWidth={2} aria-hidden />
              <span className="hidden sm:inline">Config</span>
            </button>
            <span className="pl-1 text-[11px] text-zinc-400">
              {sessionHydrated && settingsHydrated ? 'Pronto' : '…'}
            </span>
          </div>
        </header>
      ) : (
        <div className="pointer-events-none absolute top-2 right-2 z-40">
          <button
            type="button"
            className="pointer-events-auto inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white/90 px-2 py-1 text-[11px] text-zinc-600 shadow-sm backdrop-blur hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/90 dark:text-zinc-300"
            onClick={() => applyFocusMode(false)}
            title="Sair do Modo Distração Zero (Esc ou F11)"
          >
            <Minimize2 size={12} aria-hidden />
            Sair do foco
          </button>
        </div>
      )}

      {!focusMode ? <TabBar /> : null}

      <main className="flex min-h-0 flex-1 flex-row">
        {!focusMode ? (
          <>
            <ActivityBar
              activeView={activeView}
              collapsed={sidePanelCollapsed}
              onSelect={selectActivityView}
              onToggleCollapse={requestToggleSidebar}
            />
            <SidePanel
              activeView={activeView}
              collapsed={sidePanelCollapsed}
              width={sidebarWidth}
              onWidthChange={setSidePanelWidth}
              onCollapse={requestToggleSidebar}
            />
          </>
        ) : null}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <EditorWorkspace />
        </div>
      </main>

      {!focusMode ? (
        <StatusBar
          onOpenSearchTabs={() => setSearchTabsOpen(true)}
          onExportPdf={() => setPdfExportOpen(true)}
        />
      ) : null}
      {settingsOpen ? <SettingsModal open onClose={() => setSettingsOpen(false)} /> : null}
      <SearchAllTabsModal open={searchTabsOpen} onClose={() => setSearchTabsOpen(false)} />
      <ExportPdfModal
        open={pdfExportOpen}
        defaultTheme={currentExportTheme()}
        onCancel={() => setPdfExportOpen(false)}
        onConfirm={(values) => {
          setPdfExportOpen(false)
          void exportActiveAsPdfWithOptions(values)
        }}
      />
      <ToastStack />
    </div>
  )
}

export default App
