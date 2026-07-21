import { useMemo } from 'react'
import { ListTree } from 'lucide-react'
import { useTabsStore } from '../store/useTabsStore'
import { extractMarkdownOutline } from '../utils/markdownOutline'
import { parseFrontmatter } from '../utils/frontmatter'
import { revealInEditor } from '../services/editorCommands'
import { useDebouncedValue } from '../utils/useDebouncedValue'

const OUTLINE_DEBOUNCE_MS = 150

/**
 * Hierarchical Markdown TOC for the left Side Panel.
 * Debounced on content changes; click reveals line in the editor.
 */
function SideOutlineView(): React.JSX.Element {
  const title = useTabsStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId)
    return tab?.title ?? ''
  })
  const content = useTabsStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId)
    return tab?.content ?? ''
  })
  const isMarkdown = useTabsStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId)
    return tab?.isMarkdown ?? false
  })

  const debouncedContent = useDebouncedValue(content, OUTLINE_DEBOUNCE_MS)

  const headings = useMemo(() => {
    if (!isMarkdown) return []
    return extractMarkdownOutline(parseFrontmatter(debouncedContent).body)
  }, [debouncedContent, isMarkdown])

  const counts = useMemo(() => {
    const byLevel: Record<number, number> = {}
    for (const h of headings) {
      byLevel[h.level] = (byLevel[h.level] ?? 0) + 1
    }
    return byLevel
  }, [headings])

  return (
    <div className="side-view flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-col gap-0.5 border-b border-zinc-100 px-2 py-1.5 dark:border-zinc-800">
        <div className="flex items-center gap-1.5">
          <ListTree size={12} className="text-zinc-400" aria-hidden />
          <span className="text-[11px] font-medium text-zinc-500">Outline</span>
        </div>
        {title ? (
          <p className="truncate text-[10px] text-zinc-400" title={title}>
            {title}
          </p>
        ) : null}
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto py-1" aria-label="Outline Markdown">
        {!isMarkdown ? (
          <p className="px-2 py-2 text-[11px] leading-relaxed text-zinc-400">
            Ative o formato Markdown na aba para ver os headings hierárquicos.
          </p>
        ) : headings.length === 0 ? (
          <p className="px-2 py-2 text-[11px] text-zinc-400">
            Sem headings. Use <code className="text-[10px]"># Título</code> no documento.
          </p>
        ) : (
          <ul className="flex flex-col">
            {headings.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  title={`Ir para linha ${h.lineNumber} (H${h.level})`}
                  className="group flex w-full items-center gap-1 truncate px-2 py-1 text-left text-[11px] text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  style={{ paddingLeft: 8 + (h.level - 1) * 12 }}
                  onClick={() => revealInEditor(h.lineNumber, 1, { smooth: true })}
                >
                  <span className="min-w-0 flex-1 truncate">{h.text}</span>
                  <span className="shrink-0 text-[9px] tabular-nums text-zinc-300 opacity-0 group-hover:opacity-100 dark:text-zinc-600">
                    L{h.lineNumber}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </nav>
      {isMarkdown && headings.length > 0 ? (
        <div className="shrink-0 border-t border-zinc-100 px-2 py-1 text-[10px] text-zinc-400 dark:border-zinc-800">
          {headings.length} heading{headings.length === 1 ? '' : 's'}
          {counts[1] ? ` · H1: ${counts[1]}` : ''}
          {counts[2] ? ` · H2: ${counts[2]}` : ''}
        </div>
      ) : null}
    </div>
  )
}

export default SideOutlineView
