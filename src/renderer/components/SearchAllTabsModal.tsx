import { useEffect, useMemo, useState } from 'react'
import { useTabsStore } from '../store/useTabsStore'
import { searchInTabs } from '../utils/tabSearch'
import { revealInEditor } from '../services/editorCommands'

interface SearchAllTabsModalProps {
  open: boolean
  onClose: () => void
}

/**
 * Minimal multi-tab search. Lists hits; click switches tab and moves cursor.
 */
function SearchAllTabsModal({ open, onClose }: SearchAllTabsModalProps): React.JSX.Element | null {
  const tabs = useTabsStore((state) => state.tabs)
  const switchTab = useTabsStore((state) => state.switchTab)
  const setCursorPosition = useTabsStore((state) => state.setCursorPosition)

  const [query, setQuery] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const hits = useMemo(
    () =>
      searchInTabs(
        tabs.map((t) => ({ id: t.id, title: t.title, content: t.content })),
        query,
        { caseSensitive, maxHits: 100 }
      ),
    [tabs, query, caseSensitive]
  )

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="search-tabs-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[70vh] w-full max-w-lg flex-col rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <h2 id="search-tabs-title" className="mb-2 text-sm font-semibold">
            Buscar em todas as abas
          </h2>
          <input
            type="search"
            autoFocus
            className="w-full rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            placeholder="Texto a buscar…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <label className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={(event) => setCaseSensitive(event.target.checked)}
            />
            Diferenciar maiúsculas
          </label>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-2 py-2 text-sm">
          {query.trim().length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-zinc-400">Digite para buscar.</p>
          ) : hits.length === 0 ? (
            <p className="px-2 py-4 text-center text-xs text-zinc-400">Nenhum resultado.</p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {hits.map((hit) => (
                <li key={`${hit.tabId}-${hit.lineNumber}-${hit.column}-${hit.matchIndex}`}>
                  <button
                    type="button"
                    className="w-full rounded-md px-2 py-1.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    onClick={() => {
                      setCursorPosition(hit.tabId, {
                        lineNumber: hit.lineNumber,
                        column: hit.column
                      })
                      switchTab(hit.tabId)
                      window.setTimeout(() => {
                        revealInEditor(hit.lineNumber, hit.column)
                      }, 40)
                      onClose()
                    }}
                  >
                    <span className="font-medium text-zinc-800 dark:text-zinc-100">
                      {hit.tabTitle}
                    </span>
                    <span className="text-zinc-400">
                      {' '}
                      · Ln {hit.lineNumber}:{hit.column}
                    </span>
                    <div className="truncate font-mono text-[11px] text-zinc-500">
                      {hit.lineText}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex justify-end border-t border-zinc-100 px-3 py-2 dark:border-zinc-800">
          <button
            type="button"
            className="rounded-md px-3 py-1 text-xs text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

export default SearchAllTabsModal
