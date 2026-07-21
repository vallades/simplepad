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
  saveViewState,
  syncModelContentFromTab
} from '../monaco/modelRegistry'
import { mergeEditorBodyIntoContent } from '../utils/frontmatter'
import { getSnippetsSync, listSnippets } from '../services/snippetActions'
import { tryExpandSnippetAtCursor } from '../services/snippetExpand'
import { getDefaultEditorOptions, type MonacoThemeId } from '../utils/monacoUtils'
import { isResolvedDark } from '../utils/theme'
import { registerEditorCommandHandler } from '../services/editorCommands'
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
  /** Disk reloads bump this without changing activeTabId — force model re-sync */
  const contentRevision = useTabsStore((state) => {
    const tab = state.tabs.find((item) => item.id === state.activeTabId)
    return tab?.contentRevision ?? 0
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
      registerEditorCommandHandler(null)
    }
  }, [])

  // Wire Find / Replace / Go to line / reveal from menu, status bar, search
  useEffect(() => {
    if (boot !== 'ready') return
    registerEditorCommandHandler((command) => {
      const editor = editorRef.current
      if (!editor) return
      if (typeof command === 'object' && command.type === 'reveal') {
        const pos = { lineNumber: command.lineNumber, column: command.column }
        editor.setPosition(pos)
        // Smooth scroll when supported (Monaco ScrollType.Smooth = 1)
        const scrollType = (command.smooth ?? true) ? 1 : 0
        editor.revealPositionInCenter(pos, scrollType)
        editor.focus()
        return
      }
      const actionId =
        command === 'find'
          ? 'actions.find'
          : command === 'replace'
            ? 'editor.action.startFindReplaceAction'
            : 'editor.action.gotoLine'
      const action = editor.getAction(actionId)
      if (action) {
        void action.run()
        editor.focus()
      }
    })
    return () => registerEditorCommandHandler(null)
  }, [boot])

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

  // Update language + body-only text when Markdown mode is toggled on the *current* tab.
  // Do NOT depend on activeTabId — that race used to write the new tab's content into the old model.
  useEffect(() => {
    if (boot !== 'ready') return
    const monacoApi = monacoRef.current
    const editor = editorRef.current
    if (!monacoApi || !editor) return
    const tabId = activeTabIdRef.current
    if (!tabId) return
    const tab = useTabsStore.getState().tabs.find((item) => item.id === tabId)
    if (!tab) return
    beginApplying()
    try {
      const model = getOrCreateTabModel(monacoApi, tab)
      if (editor.getModel() !== model) {
        editor.setModel(model)
      }
      const language = getLanguageForTab(tab)
      if (model.getLanguageId() !== language) {
        monacoApi.editor.setModelLanguage(model, language)
      }
      syncModelContentFromTab(monacoApi, model, tab)
    } catch (error) {
      console.error('[SimplePad] failed to apply markdown mode:', error)
    }
  }, [isMarkdown, boot])

  useEffect(() => {
    if (boot !== 'ready') return
    const openIds = new Set(openTabKey.length > 0 ? openTabKey.split('|').filter(Boolean) : [])
    disposeModelsExcept(openIds)
  }, [openTabKey, boot])

  // Bind the Monaco model for the active tab (source of truth = tab store content).
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

    const tab = useTabsStore.getState().tabs.find((item) => item.id === nextId)
    if (!tab) return

    beginApplying()
    try {
      const model = getOrCreateTabModel(monacoApi, tab)
      // Always sync from store so explorer/tab switches show the correct document
      // (existing models may be stale after a previous race or external reload).
      syncModelContentFromTab(monacoApi, model, tab)
      if (editor.getModel() !== model) {
        editor.setModel(model)
      }

      const sameTab = prevId === nextId
      if (!sameTab) {
        const restored = restoreViewState(nextId, editor)
        if (!restored) {
          editor.setPosition({
            lineNumber: tab.cursorPosition.lineNumber,
            column: tab.cursorPosition.column
          })
          editor.setScrollTop(tab.scrollPosition)
        }
        editor.focus()
      }
    } catch (error) {
      console.error('[SimplePad] failed to bind tab model:', error)
    }

    previousTabIdRef.current = nextId
  }, [activeTabId, contentRevision, boot])

  const handleMount: OnMount = (editor, monacoApi) => {
    for (const d of disposablesRef.current) {
      d.dispose()
    }
    disposablesRef.current = []

    editorRef.current = editor
    monacoRef.current = monacoApi

    editor.updateOptions({ fontSize, fontFamily })

    const applySnippetResult = (
      result: { nextText: string; cursorOffset: number },
      model: import('monaco-editor').editor.ITextModel
    ): void => {
      beginApplying()
      model.setValue(result.nextText)
      const nextPos = model.getPositionAt(result.cursorOffset)
      editor.setPosition(nextPos)
      editor.revealPositionInCenter(nextPos)
      const tabId = activeTabIdRef.current
      if (!tabId) return
      const tab = useTabsStore.getState().tabs.find((t) => t.id === tabId)
      if (!tab) return
      const full = mergeEditorBodyIntoContent(tab.content, result.nextText, tab.isMarkdown)
      useTabsStore.getState().updateTabContent(tabId, full)
      useTabsStore.getState().setCursorPosition(tabId, {
        lineNumber: nextPos.lineNumber,
        column: nextPos.column
      })
    }

    // Prefetch snippets for Tab expansion
    void listSnippets()

    disposablesRef.current.push(
      // Tab expands snippet when cursor follows a trigger (e.g. ;hoje); else default Tab
      editor.onKeyDown((e) => {
        if (
          e.keyCode !== monacoApi.KeyCode.Tab ||
          e.shiftKey ||
          e.altKey ||
          e.metaKey ||
          e.ctrlKey
        ) {
          return
        }
        const model = editor.getModel()
        const pos = editor.getPosition()
        if (!model || !pos) return
        const offset = model.getOffsetAt(pos)
        const text = model.getValue()
        const result = tryExpandSnippetAtCursor(text, offset, getSnippetsSync())
        if (!result) return
        e.preventDefault()
        e.stopPropagation()
        applySnippetResult(result, model)
      }),
      editor.addAction({
        id: 'simplepad.insertSnippet',
        label: 'Inserir snippet…',
        keybindings: [monacoApi.KeyMod.CtrlCmd | monacoApi.KeyCode.Space],
        run: () => {
          void (async () => {
            const model = editor.getModel()
            const pos = editor.getPosition()
            if (!model || !pos) return
            const snippets = await listSnippets()
            if (snippets.length === 0) return
            const labels = snippets.map((s, i) => `${i + 1}. ${s.trigger} — ${s.name}`).join('\n')
            const pick = window.prompt(`Snippets (número ou trigger):\n${labels}`, '')
            if (!pick) return
            const trimmed = pick.trim()
            const byIndex = Number(trimmed)
            const snippet =
              Number.isFinite(byIndex) && byIndex >= 1 && byIndex <= snippets.length
                ? snippets[byIndex - 1]
                : snippets.find((s) => s.trigger === trimmed || s.trigger === `;${trimmed}`)
            if (!snippet) return
            const offset = model.getOffsetAt(pos)
            const text = model.getValue()
            const withTrigger = text.slice(0, offset) + snippet.trigger + text.slice(offset)
            const result = tryExpandSnippetAtCursor(withTrigger, offset + snippet.trigger.length, [
              snippet
            ])
            if (!result) return
            applySnippetResult(result, model)
          })()
        }
      }),
      editor.onDidChangeModelContent(() => {
        if (isApplyingRef.current) return
        const tabId = activeTabIdRef.current
        const model = editor.getModel()
        if (!tabId || !model) return
        const tab = useTabsStore.getState().tabs.find((t) => t.id === tabId)
        if (!tab) return
        // Monaco holds body-only for Markdown; recombine YAML frontmatter for save/session
        const full = mergeEditorBodyIntoContent(tab.content, model.getValue(), tab.isMarkdown)
        useTabsStore.getState().updateTabContent(tabId, full)
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
