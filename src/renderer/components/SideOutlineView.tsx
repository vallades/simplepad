import { useEffect, useState } from 'react'
import { ListTree } from 'lucide-react'
import { useTabsStore } from '../store/useTabsStore'
import { extractMarkdownOutline, type OutlineHeading } from '../utils/markdownOutline'
import { parseFrontmatter } from '../utils/frontmatter'
import { revealInEditor } from '../services/editorCommands'

const OUTLINE_DEBOUNCE_MS = 150

/**
 * Markdown heading outline for the left Side Panel (Activity Bar → Outline).
 * Complements the optional Outline to the right of Preview.
 */
function SideOutlineView(): React.JSX.Element {
  const content = useTabsStore((state) => {
    const tab = state.tabs.find((item) => item.id === state.activeTabId)
    return tab?.content ?? ''
  })
  const isMarkdown = useTabsStore((state) => {
    const tab = state.tabs.find((item) => item.id === state.activeTabId)
    return tab?.isMarkdown ?? false
  })

  const [headings, setHeadings] = useState<OutlineHeading[]>(() =>
    extractMarkdownOutline(parseFrontmatter(content).body)
  )

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHeadings(extractMarkdownOutline(parseFrontmatter(content).body))
    }, OUTLINE_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [content])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center gap-1.5 border-b border-zinc-100 px-2 py-1.5 dark:border-zinc-800">
        <ListTree size={12} className="text-zinc-400" aria-hidden />
        <span className="text-[11px] font-medium text-zinc-500">Outline</span>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto py-1" aria-label="Outline Markdown">
        {!isMarkdown ? (
          <p className="px-2 py-2 text-[11px] leading-relaxed text-zinc-400">
            Ative o formato Markdown na aba para ver os headings.
          </p>
        ) : headings.length === 0 ? (
          <p className="px-2 py-2 text-[11px] text-zinc-400">Sem headings (# …)</p>
        ) : (
          <ul className="flex flex-col">
            {headings.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  title={`Ir para linha ${h.lineNumber}`}
                  className="w-full truncate px-2 py-1 text-left text-[11px] text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  style={{ paddingLeft: 8 + (h.level - 1) * 10 }}
                  onClick={() => revealInEditor(h.lineNumber, 1)}
                >
                  {h.text}
                </button>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </div>
  )
}

export default SideOutlineView
