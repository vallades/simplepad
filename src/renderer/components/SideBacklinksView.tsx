import { useMemo } from 'react'
import { Link2 } from 'lucide-react'
import { useTabsStore } from '../store/useTabsStore'
import { findBacklinks, noteKeyFromPathOrTitle } from '../../shared/wikiLinks'
import { openBacklinkSource } from '../services/wikiLinkActions'

/**
 * Dedicated Backlinks panel (Activity Bar → Backlinks).
 * Lists open tabs that contain [[CurrentNote]] links.
 */
function SideBacklinksView(): React.JSX.Element {
  const title = useTabsStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId)
    return tab?.title ?? ''
  })
  const filePath = useTabsStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId)
    return tab?.filePath
  })
  const tabs = useTabsStore((s) => s.tabs)

  const noteLabel = useMemo(() => {
    if (filePath) {
      const base = filePath.split(/[/\\]/).pop() ?? title
      return base.replace(/\.md$/i, '')
    }
    return title.replace(/\.md$/i, '') || 'esta nota'
  }, [filePath, title])

  const backlinks = useMemo(() => {
    const keySource = filePath ? noteKeyFromPathOrTitle(filePath) : noteKeyFromPathOrTitle(title)
    if (!keySource) return []
    return findBacklinks(
      title || keySource,
      tabs.map((t) => ({
        id: t.id,
        title: t.title,
        content: t.content,
        filePath: t.filePath
      }))
    )
  }, [tabs, title, filePath])

  return (
    <div className="side-view flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-col gap-0.5 border-b border-zinc-100 px-2 py-1.5 dark:border-zinc-800">
        <div className="flex items-center gap-1.5">
          <Link2 size={12} className="text-zinc-400" aria-hidden />
          <span className="text-[11px] font-medium text-zinc-500">Backlinks</span>
        </div>
        <p className="truncate text-[10px] text-zinc-400" title={noteLabel}>
          → {noteLabel}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        {backlinks.length === 0 ? (
          <p className="px-2 py-3 text-[11px] leading-relaxed text-zinc-400">
            Nenhuma aba aberta contém <code className="text-[10px]">[[{noteLabel}]]</code>.
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {backlinks.map((b) => (
              <li key={`${b.sourceId}-${b.lineNumber}`}>
                <button
                  type="button"
                  className="flex w-full flex-col gap-0.5 rounded px-2 py-1.5 text-left hover:bg-zinc-200/80 dark:hover:bg-zinc-800"
                  title={b.filePath ?? b.sourceTitle}
                  onClick={() => void openBacklinkSource(b.sourceId, b.filePath, b.lineNumber)}
                >
                  <span className="truncate text-[11px] font-medium text-blue-600 dark:text-blue-400">
                    {b.sourceTitle}
                  </span>
                  <span className="truncate font-mono text-[10px] text-zinc-500">
                    L{b.lineNumber}: {b.lineText}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t border-zinc-100 px-2 py-1 text-[10px] text-zinc-400 dark:border-zinc-800">
        {backlinks.length} backlink{backlinks.length === 1 ? '' : 's'} (abas abertas)
      </div>
    </div>
  )
}

export default SideBacklinksView
