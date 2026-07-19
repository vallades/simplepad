import { useMemo } from 'react'
import { ListTree } from 'lucide-react'
import { useTabsStore } from '../store/useTabsStore'
import { extractMarkdownOutline } from '../utils/markdownOutline'
import { revealInEditor } from '../services/editorCommands'

/**
 * Compact heading outline for Markdown mode. Click → reveal line in Monaco.
 */
function OutlinePanel(): React.JSX.Element {
  const content = useTabsStore((state) => {
    const tab = state.tabs.find((item) => item.id === state.activeTabId)
    return tab?.content ?? ''
  })

  const headings = useMemo(() => extractMarkdownOutline(content), [content])

  return (
    <aside
      className="flex w-[180px] shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/80"
      aria-label="Outline"
    >
      <div className="flex shrink-0 items-center gap-1.5 border-b border-zinc-100 px-2 py-1.5 text-[11px] font-medium text-zinc-500 dark:border-zinc-800">
        <ListTree size={12} aria-hidden />
        Outline
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto py-1">
        {headings.length === 0 ? (
          <p className="px-2 py-2 text-[11px] text-zinc-400">Sem headings (# …)</p>
        ) : (
          <ul className="flex flex-col">
            {headings.map((h) => (
              <li key={h.id}>
                <button
                  type="button"
                  title={`Linha ${h.lineNumber}`}
                  className="w-full truncate px-2 py-1 text-left text-[11px] text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  style={{ paddingLeft: 8 + (h.level - 1) * 10 }}
                  onClick={() => {
                    revealInEditor(h.lineNumber, 1)
                  }}
                >
                  {h.text}
                </button>
              </li>
            ))}
          </ul>
        )}
      </nav>
    </aside>
  )
}

export default OutlinePanel
