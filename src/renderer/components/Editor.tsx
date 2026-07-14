import { useEffect, useMemo, useRef, useState } from 'react'
import MonacoEditor, { type OnMount } from '@monaco-editor/react'
import type { editor as MonacoEditorApi, IDisposable } from 'monaco-editor'
import type * as Monaco from 'monaco-editor'
import { useTabsStore } from '../store/useTabsStore'
import { useSettingsStore, getEditorThemeId } from '../store/useSettingsStore'
import { useUiStore } from '../store/useUiStore'
import { setupMonaco } from '../monaco/setup'
import {
  disposeModelsExcept,
  getLanguageForTab,
  getOrCreateTabModel,
  restoreViewState,
  saveViewState
} from '../monaco/modelRegistry'
import { getDefaultEditorOptions, type MonacoThemeId } from '../utils/monacoUtils'
import { isResolvedDark } from '../utils/theme'
import PlainEditor from './PlainEditor'

type BootState = 'loading' | 'ready' | 'fallback'

/**
 * Single Monaco instance for the whole app, with textarea fallback if Monaco fails.
 *
 * Critical: this component must NOT re-render on every keystroke/cursor move.
 * Content lives in Monaco models; the Zustand store is updated imperatively.
 */
function Editor(): React.JSX.Element {
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
  const isMarkdown = useTabsStore((state) => {
    const tab = state.tabs.find((item) => item.id === state.activeTabId)
    return tab?.isMarkdown ?? false
  })

  const fontSize = useSettingsStore((state) => state.fontSize)
  const fontFamily = useSettingsStore((state) => state.fontFamily)
  const themePreference = useSettingsStore((state) => state.theme)

  const editorRef = useRef<MonacoEditorApi.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<typeof Monaco | null>(null)
  const isApplyingRef = useRef(false)
  const applyingTimerRef = useRef<number | null>(null)
  const activeTabIdRef = useRef<string | null>(activeTabId)
  const previousTabIdRef = useRef<string | null>(null)
  const disposablesRef = useRef<IDisposable[]>([])

  const [boot, setBoot] = useState<BootState>('loading')
  const [theme, setTheme] = useState<MonacoThemeId>(() =>
    getEditorThemeId(
      themePreference,
      typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    )
  )

  const editorOptions = useMemo(
    () => getDefaultEditorOptions(fontSize, fontFamily),
    [fontSize, fontFamily]
  )

  const beginApplying = (): void => {
    isApplyingRef.current = true
    if (applyingTimerRef.current !== null) {
      window.clearTimeout(applyingTimerRef.current)
    }
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

  // Resolve Monaco theme from settings + (optional) system preference
  useEffect(() => {
    const apply = (): void => {
      setTheme(getEditorThemeId(themePreference, isResolvedDark('system')))
    }
    apply()

    if (themePreference !== 'system') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [themePreference])

  // Live-update font when settings change (without remounting)
  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return
    editor.updateOptions({ fontSize, fontFamily })
  }, [fontSize, fontFamily])

  // Update Monaco language when Markdown mode is toggled
  useEffect(() => {
    if (boot !== 'ready') return
    const monacoApi = monacoRef.current
    const editor = editorRef.current
    if (!monacoApi || !editor || !activeTabId) return
    const tab = useTabsStore.getState().tabs.find((item) => item.id === activeTabId)
    if (!tab) return
    const model = editor.getModel()
    if (!model) return
    const language = getLanguageForTab(tab)
    if (model.getLanguageId() !== language) {
      monacoApi.editor.setModelLanguage(model, language)
    }
  }, [isMarkdown, activeTabId, boot])

  useEffect(() => {
    if (boot !== 'ready') return
    const openIds = new Set(openTabKey.length > 0 ? openTabKey.split('|').filter(Boolean) : [])
    disposeModelsExcept(openIds)
  }, [openTabKey, boot])

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
    for (const d of disposablesRef.current) {
      d.dispose()
    }
    disposablesRef.current = []

    editorRef.current = editor
    monacoRef.current = monacoApi

    editor.updateOptions({ fontSize, fontFamily })

    disposablesRef.current.push(
      editor.onDidChangeModelContent(() => {
        if (isApplyingRef.current) return
        const tabId = activeTabIdRef.current
        const model = editor.getModel()
        if (!tabId || !model) return
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

        // Publish scroll ratio for preview sync (no React re-render of Editor)
        const scrollTop = editor.getScrollTop()
        const scrollHeight = editor.getScrollHeight()
        const height = editor.getLayoutInfo().height
        const max = scrollHeight - height
        const ratio = max > 0 ? Math.min(1, Math.max(0, scrollTop / max)) : 0
        useUiStore.getState().setEditorScrollRatio(ratio)
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
