import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useTabsStore } from '../store/useTabsStore'
import { useUiStore } from '../store/useUiStore'
import { applyScrollRatio } from '../utils/debounce'

const PREVIEW_DEBOUNCE_MS = 120

/**
 * Live Markdown preview (GFM). Debounced content; optional scroll sync from editor.
 */
function PreviewPanel(): React.JSX.Element {
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

  const editorScrollRatio = useUiStore((state) => state.editorScrollRatio)
  const [debouncedContent, setDebouncedContent] = useState(content)
  const scrollRef = useRef<HTMLDivElement>(null)
  const syncingRef = useRef(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedContent(content)
    }, PREVIEW_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [content])

  // Apply editor scroll ratio to preview (best-effort, one-way)
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    syncingRef.current = true
    applyScrollRatio(el, editorScrollRatio)
    requestAnimationFrame(() => {
      syncingRef.current = false
    })
  }, [editorScrollRatio, debouncedContent])

  const body = useMemo(() => {
    if (!isMarkdown) {
      return (
        <pre className="whitespace-pre-wrap break-words font-mono text-[13px] leading-relaxed text-zinc-700 dark:text-zinc-300">
          {debouncedContent || ' '}
        </pre>
      )
    }

    return (
      <div className="markdown-preview">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {debouncedContent.length > 0 ? debouncedContent : '*Nada para pré-visualizar*'}
        </ReactMarkdown>
      </div>
    )
  }, [debouncedContent, isMarkdown])

  return (
    <aside
      className="flex min-h-0 min-w-0 flex-1 flex-col border-l border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
      aria-label="Preview Markdown"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-3 py-1 text-[11px] text-zinc-400 dark:border-zinc-800">
        <span>Preview</span>
        <span className="truncate pl-2" title={title}>
          {isMarkdown ? 'Markdown' : 'Texto puro'}
        </span>
      </div>
      <div
        ref={scrollRef}
        className="preview-scroll min-h-0 flex-1 overflow-auto px-4 py-3 text-[14px] leading-relaxed text-zinc-800 dark:text-zinc-100"
      >
        {body}
      </div>
    </aside>
  )
}

export default PreviewPanel
