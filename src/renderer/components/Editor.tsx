import { useEffect, useMemo, useRef, useState } from 'react'
import MonacoEditor, { type OnMount } from '@monaco-editor/react'
import type { editor as MonacoEditorApi, IDisposable } from 'monaco-editor'
import type * as Monaco from 'monaco-editor'
import { useTabsStore } from '../store/useTabsStore'
import { setupMonaco } from '../monaco/setup'
import {
  disposeModelsExcept,
  getOrCreateTabModel,
  restoreViewState,
  saveViewState
} from '../monaco/modelRegistry'
import {
  DEFAULT_FONT_SIZE,
  getDefaultEditorOptions,
  themeFromColorScheme,
  type MonacoThemeId
} from '../utils/monacoUtils'
import PlainEditor from './PlainEditor'

type BootState = 'loading' | 'ready' | 'fallback'

/**
 * Single Monaco instance for the whole app, with textarea fallback if Monaco fails.
 *
 * Critical: this component must NOT re-render on every keystroke/cursor move.
 * Content lives in Monaco models; the Zustand store is updated imperatively.
 * Re-rendering here + automaticLayout was causing "Maximum update depth exceeded".
 */
function Editor(): React.JSX.Element {
  // Primitives only — stable across content/cursor/scroll updates
  const activeTabId = useTabsStore((state) => state.activeTabId)
  const openTabKey = useTabsStore((state) => state.tabs.map((tab) => tab.id).join('|'))
  const activeTitle = useTabsStore((state) => {
    const tab = state.tabs.find((item) => item.id === state.activeTabId)
    return tab?.title ?? ''
  })
  const isDirty = useTabsStore((state) => {
    const tab = state.tabs.find((item) => item.id === state.activeTabId)
    return tab?.isDirty ?? false
  })

  const editorRef = useRef<MonacoEditorApi.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<typeof Monaco | null>(null)
  /** Suppress store writes while we programmatically switch models / restore state */
  const isApplyingRef = useRef(false)
  const applyingTimerRef = useRef<number | null>(null)
  const activeTabIdRef = useRef<string | null>(activeTabId)
  const previousTabIdRef = useRef<string | null>(null)
  const disposablesRef = useRef<IDisposable[]>([])

  const [boot, setBoot] = useState<BootState>('loading')
  const [theme, setTheme] = useState<MonacoThemeId>(() =>
    themeFromColorScheme(
      typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    )
  )

  const editorOptions = useMemo(() => getDefaultEditorOptions(DEFAULT_FONT_SIZE), [])

  const beginApplying = (): void => {
    isApplyingRef.current = true
    if (applyingTimerRef.current !== null) {
      window.clearTimeout(applyingTimerRef.current)
    }
    // Hold the gate long enough to swallow Monaco's layout/cursor echo events
    applyingTimerRef.current = window.setTimeout(() => {
      isApplyingRef.current = false
      applyingTimerRef.current = null
    }, 50)
  }

  useEffect(() => {
    activeTabIdRef.current = activeTabId
  }, [activeTabId])

  useEffect(() => {
    return () => {
      if (applyingTimerRef.current !== null) {
        window.clearTimeout(applyingTimerRef.current)
      }
      for (const d of disposablesRef.current) {
        d.dispose()
      }
      disposablesRef.current = []
    }
  }, [])

  // Boot Monaco off the critical path; fall back to textarea on failure/timeout
  useEffect(() => {
    let cancelled = false
    const timeout = window.setTimeout(() => {
      if (!cancelled) {
        console.warn('[SimplePad] Monaco setup timed out — using plain editor')
        setBoot((prev) => (prev === 'loading' ? 'fallback' : prev))
      }
    }, 8000)

    void setupMonaco()
      .then((monaco) => {
        if (cancelled) return
        if (!monaco) {
          setBoot('fallback')
          return
        }
        setBoot('ready')
      })
      .catch((error) => {
        console.error('[SimplePad] Monaco setup error:', error)
        if (!cancelled) setBoot('fallback')
      })
      .finally(() => {
        window.clearTimeout(timeout)
      })

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = (): void => setTheme(themeFromColorScheme(media.matches))
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [])

  // Dispose models for closed tabs (ids only — not on content edits)
  useEffect(() => {
    if (boot !== 'ready') return
    const openIds = new Set(openTabKey.length > 0 ? openTabKey.split('|').filter(Boolean) : [])
    disposeModelsExcept(openIds)
  }, [openTabKey, boot])

  // Switch model only when the active tab changes (not on every store write)
  useEffect(() => {
    if (boot !== 'ready') return
    const editor = editorRef.current
    const monacoApi = monacoRef.current
    if (!editor || !monacoApi) return

    const nextId = activeTabId
    const prevId = previousTabIdRef.current

    if (prevId && prevId !== nextId) {
      saveViewState(prevId, editor)
      const position = editor.getPosition()
      if (position) {
        useTabsStore.getState().setCursorPosition(prevId, {
          lineNumber: position.lineNumber,
          column: position.column
        })
      }
      useTabsStore.getState().setScrollPosition(prevId, editor.getScrollTop())
    }

    if (!nextId) {
      beginApplying()
      editor.setModel(null)
      previousTabIdRef.current = null
      return
    }

    // Same tab already bound — do nothing (avoids restore loops)
    if (prevId === nextId && editor.getModel()) {
      return
    }

    const tab = useTabsStore.getState().tabs.find((item) => item.id === nextId)
    if (!tab) return

    beginApplying()
    try {
      const model = getOrCreateTabModel(monacoApi, tab)
      if (editor.getModel() !== model) {
        editor.setModel(model)
      }

      const restored = restoreViewState(nextId, editor)
      if (!restored) {
        editor.setPosition({
          lineNumber: tab.cursorPosition.lineNumber,
          column: tab.cursorPosition.column
        })
        editor.setScrollTop(tab.scrollPosition)
      }
      editor.focus()
    } catch (error) {
      console.error('[SimplePad] failed to bind tab model:', error)
    }

    previousTabIdRef.current = nextId
  }, [activeTabId, boot])

  const handleMount: OnMount = (editor, monacoApi) => {
    // Drop listeners from a previous mount (React StrictMode remounts)
    for (const d of disposablesRef.current) {
      d.dispose()
    }
    disposablesRef.current = []

    editorRef.current = editor
    monacoRef.current = monacoApi

    disposablesRef.current.push(
      editor.onDidChangeModelContent(() => {
        if (isApplyingRef.current) return
        const tabId = activeTabIdRef.current
        const model = editor.getModel()
        if (!tabId || !model) return
        // Imperative store write — no React setState in this component
        useTabsStore.getState().updateTabContent(tabId, model.getValue())
      }),
      editor.onDidChangeCursorPosition((event) => {
        if (isApplyingRef.current) return
        const tabId = activeTabIdRef.current
        if (!tabId) return
        useTabsStore.getState().setCursorPosition(tabId, {
          lineNumber: event.position.lineNumber,
          column: event.position.column
        })
      }),
      editor.onDidScrollChange((event) => {
        if (isApplyingRef.current) return
        if (!event.scrollTopChanged) return
        const tabId = activeTabIdRef.current
        if (!tabId) return
        useTabsStore.getState().setScrollPosition(tabId, event.scrollTop)
      })
    )

    const tabId = activeTabIdRef.current
    if (tabId) {
      const tab = useTabsStore.getState().tabs.find((item) => item.id === tabId)
      if (tab) {
        beginApplying()
        try {
          const model = getOrCreateTabModel(monacoApi, tab)
          editor.setModel(model)
          editor.setPosition({
            lineNumber: tab.cursorPosition.lineNumber,
            column: tab.cursorPosition.column
          })
          editor.setScrollTop(tab.scrollPosition)
          previousTabIdRef.current = tabId
          editor.focus()
        } catch (error) {
          console.error('[SimplePad] initial model bind failed:', error)
        }
      }
    }
  }

  if (!activeTabId) {
    return (
      <div className="editor-surface flex min-h-0 flex-1 items-center justify-center text-sm text-zinc-400">
        Nenhuma aba aberta. Crie uma nova aba para começar.
      </div>
    )
  }

  if (boot === 'loading') {
    return (
      <div className="editor-surface flex min-h-0 flex-1 items-center justify-center text-sm text-zinc-400">
        Carregando editor…
      </div>
    )
  }

  if (boot === 'fallback') {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-amber-200 bg-amber-50 px-3 py-1 text-[11px] text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          Monaco indisponível — usando editor simples (texto puro).
        </div>
        <PlainEditor />
      </div>
    )
  }

  return (
    <div
      className="editor-surface relative min-h-0 flex-1 overflow-hidden"
      aria-label={activeTitle ? `Editor — ${activeTitle}` : 'Editor'}
      data-tab-id={activeTabId}
      data-dirty={isDirty ? 'true' : 'false'}
    >
      <MonacoEditor
        height="100%"
        theme={theme}
        options={editorOptions}
        loading={
          <div className="flex h-full items-center justify-center text-sm text-zinc-400">
            Carregando Monaco…
          </div>
        }
        onMount={handleMount}
      />
    </div>
  )
}

export default Editor
