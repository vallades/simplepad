import { useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { useTabsStore } from '../store/useTabsStore'
import { useUiStore } from '../store/useUiStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { applyScrollRatio } from '../utils/debounce'
import MermaidBlock from './MermaidBlock'

const PREVIEW_DEBOUNCE_MS = 150

/**
 * Live Markdown preview (GFM + optional KaTeX / Mermaid). Debounced content.
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

  const mathEnabled = useSettingsStore((s) => s.markdownMathEnabled)
  const mermaidEnabled = useSettingsStore((s) => s.markdownMermaidEnabled)

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

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    syncingRef.current = true
    applyScrollRatio(el, editorScrollRatio)
    requestAnimationFrame(() => {
      syncingRef.current = false
    })
  }, [editorScrollRatio, debouncedContent])

  const remarkPlugins = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const plugins: any[] = [remarkGfm]
    if (mathEnabled) plugins.push(remarkMath)
    return plugins
  }, [mathEnabled])

  const rehypePlugins = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!mathEnabled) return [] as any[]
    return [rehypeKatex]
  }, [mathEnabled])

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
        <ReactMarkdown
          remarkPlugins={remarkPlugins}
          rehypePlugins={rehypePlugins}
          components={
            mermaidEnabled
              ? {
                  code({ className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '')
                    const code = String(children).replace(/\n$/, '')
                    if (match?.[1] === 'mermaid') {
                      return <MermaidBlock chart={code} />
                    }
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  }
                }
              : undefined
          }
        >
          {debouncedContent.length > 0 ? debouncedContent : '*Nada para pré-visualizar*'}
        </ReactMarkdown>
      </div>
    )
  }, [debouncedContent, isMarkdown, remarkPlugins, rehypePlugins, mermaidEnabled])

  const badges: string[] = []
  if (isMarkdown) {
    badges.push('Markdown')
    if (mathEnabled) badges.push('Math')
    if (mermaidEnabled) badges.push('Mermaid')
  } else {
    badges.push('Texto puro')
  }

  return (
    <aside
      className="flex min-h-0 min-w-0 flex-1 flex-col border-l border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
      aria-label="Preview Markdown"
    >
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-3 py-1 text-[11px] text-zinc-400 dark:border-zinc-800">
        <span>Preview</span>
        <span className="truncate pl-2" title={title}>
          {badges.join(' · ')}
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
