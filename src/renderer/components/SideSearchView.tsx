import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FileText, Loader2, Search } from 'lucide-react'
import { useTabsStore } from '../store/useTabsStore'
import { searchInTabs, type TabSearchHit } from '../utils/tabSearch'
import type { WorkspaceSearchHit } from '../../shared/workspaceSearch'
import { revealInEditor } from '../services/editorCommands'
import { openRecentFile } from '../services/fileActions'
import { isElectronApiAvailable } from '../services/sessionBridge'
import { useWorkspaceStore } from '../store/useWorkspaceStore'
import { useDebouncedValue } from '../utils/useDebouncedValue'

type UnifiedHit = { kind: 'tab'; hit: TabSearchHit } | { kind: 'file'; hit: WorkspaceSearchHit }

const DEBOUNCE_MS = 280
const MAX_TAB_HITS = 60
const MAX_FILE_HITS = 40

/**
 * Global search: open tabs + workspace files (when a folder workspace is active).
 */
function SideSearchView(): React.JSX.Element {
  const tabs = useTabsStore((s) => s.tabs)
  const switchTab = useTabsStore((s) => s.switchTab)
  const setCursorPosition = useTabsStore((s) => s.setCursorPosition)
  const workspaceRoot = useWorkspaceStore((s) => s.rootPath)
  const workspaceName = useWorkspaceStore((s) => s.name)

  const [query, setQuery] = useState('')
  const debounced = useDebouncedValue(query.trim(), DEBOUNCE_MS)
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [fileHits, setFileHits] = useState<WorkspaceSearchHit[]>([])
  const [searchingFiles, setSearchingFiles] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const searchGen = useRef(0)

  useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 50)
    return () => window.clearTimeout(id)
  }, [])

  const tabHits = useMemo(
    () =>
      searchInTabs(
        tabs.map((t) => ({ id: t.id, title: t.title, content: t.content })),
        debounced,
        { caseSensitive, maxHits: MAX_TAB_HITS }
      ),
    [tabs, debounced, caseSensitive]
  )

  // Async workspace scan — only when debounced query + workspace exist
  useEffect(() => {
    let cancelled = false
    const gen = ++searchGen.current

    if (!debounced || !workspaceRoot) {
      // Defer clear to avoid sync setState lint; schedule microtask
      queueMicrotask(() => {
        if (!cancelled && gen === searchGen.current) {
          setFileHits([])
          setSearchingFiles(false)
        }
      })
      return () => {
        cancelled = true
      }
    }

    if (!isElectronApiAvailable() || typeof window.api.searchWorkspace !== 'function') {
      queueMicrotask(() => {
        if (!cancelled && gen === searchGen.current) {
          setFileHits([])
          setSearchingFiles(false)
        }
      })
      return () => {
        cancelled = true
      }
    }

    queueMicrotask(() => {
      if (!cancelled) setSearchingFiles(true)
    })

    void window.api
      .searchWorkspace({
        query: debounced,
        caseSensitive,
        maxHits: MAX_FILE_HITS
      })
      .then((result) => {
        if (cancelled || gen !== searchGen.current) return
        setFileHits(result.data ?? [])
      })
      .finally(() => {
        if (!cancelled && gen === searchGen.current) setSearchingFiles(false)
      })

    return () => {
      cancelled = true
    }
  }, [debounced, caseSensitive, workspaceRoot])

  const openPaths = useMemo(() => {
    const set = new Set<string>()
    for (const t of tabs) {
      if (t.filePath) set.add(t.filePath.replace(/\\/g, '/'))
    }
    return set
  }, [tabs])

  const fileHitsFiltered = useMemo(
    () => fileHits.filter((h) => !openPaths.has(h.filePath.replace(/\\/g, '/'))),
    [fileHits, openPaths]
  )

  const results: UnifiedHit[] = useMemo(() => {
    return [
      ...tabHits.map((hit) => ({ kind: 'tab' as const, hit })),
      ...fileHitsFiltered.map((hit) => ({ kind: 'file' as const, hit }))
    ]
  }, [tabHits, fileHitsFiltered])

  const openTabHit = useCallback(
    (hit: TabSearchHit): void => {
      switchTab(hit.tabId)
      setCursorPosition(hit.tabId, { lineNumber: hit.lineNumber, column: hit.column })
      window.requestAnimationFrame(() => {
        window.setTimeout(() => {
          revealInEditor(hit.lineNumber, hit.column, { smooth: true })
        }, 40)
      })
    },
    [switchTab, setCursorPosition]
  )

  const openFileHit = useCallback(async (hit: WorkspaceSearchHit): Promise<void> => {
    await openRecentFile(hit.filePath)
    window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        revealInEditor(hit.lineNumber, hit.column, { smooth: true })
      }, 80)
    })
  }, [])

  return (
    <div className="side-view flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 flex-col gap-1.5 border-b border-zinc-100 px-2 py-1.5 dark:border-zinc-800">
        <div className="flex items-center gap-1.5">
          <Search size={12} className="text-zinc-400" aria-hidden />
          <span className="text-[11px] font-medium text-zinc-500">Busca</span>
        </div>
        <label className="relative flex items-center">
          <Search size={11} className="pointer-events-none absolute left-2 text-zinc-400" />
          <input
            ref={inputRef}
            type="search"
            className="w-full rounded-md border border-zinc-200 bg-white py-1 pr-2 pl-7 text-[11px] text-zinc-800 outline-none focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
            placeholder="Buscar em abas e workspace…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label className="flex items-center gap-1.5 text-[10px] text-zinc-400">
          <input
            type="checkbox"
            className="h-3 w-3 accent-zinc-700"
            checked={caseSensitive}
            onChange={(e) => setCaseSensitive(e.target.checked)}
          />
          Diferenciar maiúsculas
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        {!debounced ? (
          <p className="px-2 py-3 text-[11px] leading-relaxed text-zinc-400">
            Busca em <strong className="font-medium text-zinc-500">abas abertas</strong>
            {workspaceRoot ? (
              <>
                {' '}
                e arquivos de <strong className="font-medium text-zinc-500">{workspaceName}</strong>
              </>
            ) : (
              <>. Abra uma pasta como Workspace para incluir arquivos do disco.</>
            )}
          </p>
        ) : searchingFiles && results.length === 0 ? (
          <p className="flex items-center gap-2 px-2 py-3 text-[11px] text-zinc-400">
            <Loader2 size={12} className="animate-spin" /> Buscando…
          </p>
        ) : results.length === 0 ? (
          <p className="px-2 py-3 text-[11px] text-zinc-400">Nenhum resultado.</p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {results.map((item, i) => {
              if (item.kind === 'tab') {
                const h = item.hit
                return (
                  <li key={`tab-${h.tabId}-${h.lineNumber}-${h.column}-${i}`}>
                    <button
                      type="button"
                      className="flex w-full flex-col gap-0.5 rounded px-2 py-1.5 text-left hover:bg-zinc-200/80 dark:hover:bg-zinc-800"
                      onClick={() => openTabHit(h)}
                    >
                      <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
                        <FileText size={11} className="shrink-0 text-blue-500" />
                        <span className="min-w-0 truncate">{h.tabTitle}</span>
                        <span className="shrink-0 text-[10px] font-normal text-zinc-400">
                          aba · L{h.lineNumber}
                        </span>
                      </span>
                      <span className="truncate font-mono text-[10px] text-zinc-500">
                        {h.lineText.trim() || '—'}
                      </span>
                    </button>
                  </li>
                )
              }
              const h = item.hit
              return (
                <li key={`file-${h.filePath}-${h.lineNumber}-${h.column}-${i}`}>
                  <button
                    type="button"
                    className="flex w-full flex-col gap-0.5 rounded px-2 py-1.5 text-left hover:bg-zinc-200/80 dark:hover:bg-zinc-800"
                    onClick={() => void openFileHit(h)}
                  >
                    <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
                      <FileText size={11} className="shrink-0 text-emerald-600" />
                      <span className="min-w-0 truncate" title={h.filePath}>
                        {h.fileName}
                      </span>
                      <span className="shrink-0 text-[10px] font-normal text-zinc-400">
                        disco · L{h.lineNumber}
                      </span>
                    </span>
                    <span className="truncate font-mono text-[10px] text-zinc-500">
                      {h.lineText.trim() || '—'}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {debounced ? (
        <div className="shrink-0 border-t border-zinc-100 px-2 py-1 text-[10px] text-zinc-400 dark:border-zinc-800">
          {tabHits.length} em abas
          {workspaceRoot ? ` · ${fileHitsFiltered.length} em arquivos` : ''}
          {searchingFiles ? ' · …' : ''}
        </div>
      ) : null}
    </div>
  )
}

export default SideSearchView
