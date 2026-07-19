import { useEffect, useRef } from 'react'
import { useTabsStore } from '../store/useTabsStore'
import { cursorPositionToOffset, offsetToCursorPosition } from '../utils/editorPosition'
import { getEditorDocumentText, mergeEditorBodyIntoContent } from '../utils/frontmatter'

/**
 * Lightweight textarea editor used as fallback when Monaco fails to load.
 * Markdown: body only (YAML frontmatter hidden, preserved on save).
 */
function PlainEditor(): React.JSX.Element {
  const activeTabId = useTabsStore((state) => state.activeTabId)
  const content = useTabsStore((state) => {
    const tab = state.tabs.find((item) => item.id === state.activeTabId)
    return tab?.content ?? ''
  })
  const isMarkdown = useTabsStore((state) => {
    const tab = state.tabs.find((item) => item.id === state.activeTabId)
    return tab?.isMarkdown ?? false
  })
  const title = useTabsStore((state) => {
    const tab = state.tabs.find((item) => item.id === state.activeTabId)
    return tab?.title ?? ''
  })

  const editorText = getEditorDocumentText(content, isMarkdown)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el || !activeTabId) return
    const tab = useTabsStore.getState().tabs.find((item) => item.id === activeTabId)
    if (!tab) return
    const body = getEditorDocumentText(tab.content, tab.isMarkdown)
    const offset = cursorPositionToOffset(body, tab.cursorPosition)
    const frame = requestAnimationFrame(() => {
      try {
        el.focus({ preventScroll: true })
        el.setSelectionRange(offset, offset)
        el.scrollTop = tab.scrollPosition
      } catch {
        // ignore selection errors on detached nodes
      }
    })
    return () => cancelAnimationFrame(frame)
  }, [activeTabId])

  if (!activeTabId) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-zinc-400">
        Nenhuma aba aberta.
      </div>
    )
  }

  return (
    <textarea
      ref={textareaRef}
      key={activeTabId}
      className="editor-surface h-full min-h-0 w-full flex-1 resize-none border-0 bg-transparent p-4 font-mono text-sm leading-relaxed text-zinc-900 outline-none dark:text-zinc-100"
      value={editorText}
      spellCheck={false}
      aria-label={title ? `Editor — ${title}` : 'Editor'}
      placeholder="Comece a digitar..."
      onChange={(event) => {
        const tab = useTabsStore.getState().tabs.find((item) => item.id === activeTabId)
        if (!tab) return
        const { updateTabContent, setCursorPosition } = useTabsStore.getState()
        const full = mergeEditorBodyIntoContent(tab.content, event.target.value, tab.isMarkdown)
        updateTabContent(activeTabId, full)
        setCursorPosition(
          activeTabId,
          offsetToCursorPosition(event.target.value, event.target.selectionStart)
        )
      }}
      onSelect={(event) => {
        const el = event.currentTarget
        useTabsStore
          .getState()
          .setCursorPosition(activeTabId, offsetToCursorPosition(el.value, el.selectionStart))
      }}
      onScroll={(event) => {
        useTabsStore.getState().setScrollPosition(activeTabId, event.currentTarget.scrollTop)
      }}
    />
  )
}

export default PlainEditor
