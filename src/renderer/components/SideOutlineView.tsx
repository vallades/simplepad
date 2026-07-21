import { useMemo } from 'react'
import { Link2, ListTree } from 'lucide-react'
import { useTabsStore } from '../store/useTabsStore'
import { extractMarkdownOutline } from '../utils/markdownOutline'
import { parseFrontmatter } from '../utils/frontmatter'
import { revealInEditor } from '../services/editorCommands'
import { useDebouncedValue } from '../utils/useDebouncedValue'
import { findBacklinks, noteKeyFromPathOrTitle } from '../../shared/wikiLinks'
import { openBacklinkSource } from '../services/wikiLinkActions'
import { useSettingsStore } from '../store/useSettingsStore'

const OUTLINE_DEBOUNCE_MS = 150

/**
 * Hierarchical Markdown TOC + backlinks for the left Side Panel.
 */
function SideOutlineView(): React.JSX.Element {
  const title = useTabsStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId)
    return tab?.title ?? ''
  })
  const filePath = useTabsStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId)
    return tab?.filePath
  })
  const content = useTabsStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId)
    return tab?.content ?? ''
  })
  const isMarkdown = useTabsStore((s) => {
    const tab = s.tabs.find((t) => t.id === s.activeTabId)
    return tab?.isMarkdown ?? false
  })
  const tabs = useTabsStore((s) => s.tabs)
  const backlinksPlacement = useSettingsStore((s) => s.backlinksPlacement)
  const showBacklinksHere = backlinksPlacement === 'outline'

  const debouncedContent = useDebouncedValue(content, OUTLINE_DEBOUNCE_MS)

  const headings = useMemo(() => {
    if (!isMarkdown) return []
    return extractMarkdownOutline(parseFrontmatter(debouncedContent).body)
  }, [debouncedContent, isMarkdown])

  const noteKey = useMemo(() => {
    if (filePath) return noteKeyFromPathOrTitle(filePath)
    return noteKeyFromPathOrTitle(title)
  }, [filePath, title])

  const backlinks = useMemo(() => {
    if (!noteKey) return []
    return findBacklinks(
      title || noteKey,
      tabs.map((t) => ({
        id: t.id,
        title: t.title,
        content: t.content,
        filePath: t.filePath
      }))
    )
  }, [tabs, title, noteKey])

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

      <div className="min-h-0 flex-1 overflow-y-auto">
        <nav className="py-1" aria-label="Outline Markdown">
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

        {showBacklinksHere ? (
          <div className="mt-2 border-t border-zinc-100 pt-2 dark:border-zinc-800">
            <div className="mb-1 flex items-center gap-1.5 px-2">
              <Link2 size={11} className="text-zinc-400" aria-hidden />
              <span className="text-[10px] font-medium tracking-wide text-zinc-500 uppercase">
                Links para esta nota
              </span>
            </div>
            {backlinks.length === 0 ? (
              <p className="px-2 py-1 text-[11px] text-zinc-400">
                Nenhum <code className="text-[10px]">[[link]]</code> aponta para cá (nas abas
                abertas).
              </p>
            ) : (
              <ul className="flex flex-col pb-2">
                {backlinks.map((b) => (
                  <li key={b.sourceId}>
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
        ) : (
          <p className="mt-2 border-t border-zinc-100 px-2 py-2 text-[10px] text-zinc-400 dark:border-zinc-800">
            Backlinks no ícone da Activity Bar. Altere em Configurações.
          </p>
        )}
      </div>

      {isMarkdown && headings.length > 0 ? (
        <div className="shrink-0 border-t border-zinc-100 px-2 py-1 text-[10px] text-zinc-400 dark:border-zinc-800">
          {headings.length} heading{headings.length === 1 ? '' : 's'}
          {counts[1] ? ` · H1: ${counts[1]}` : ''}
          {counts[2] ? ` · H2: ${counts[2]}` : ''}
          {showBacklinksHere && backlinks.length > 0 ? ` · ${backlinks.length} backlink(s)` : ''}
        </div>
      ) : null}
    </div>
  )
}

export default SideOutlineView
