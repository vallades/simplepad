import { useCallback, useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Folder,
  FolderOpen,
  PanelLeftClose,
  Search
} from 'lucide-react'
import type { DirEntryDTO } from '../../shared/workspace'
import { useWorkspaceStore } from '../store/useWorkspaceStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { listWorkspaceDir } from '../services/workspaceActions'
import { openRecentFile, isDroppableTextPath } from '../services/fileActions'
import { DEFAULT_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH, MIN_SIDEBAR_WIDTH } from '../../shared/settings'

interface TreeNodeProps {
  entry: DirEntryDTO
  depth: number
  filter: string
}

function TreeNode({ entry, depth, filter }: TreeNodeProps): React.JSX.Element | null {
  const [expanded, setExpanded] = useState(false)
  const [children, setChildren] = useState<DirEntryDTO[] | null>(null)
  const [loading, setLoading] = useState(false)

  const loadChildren = useCallback(async (): Promise<void> => {
    if (!entry.isDirectory) return
    setLoading(true)
    try {
      const result = await listWorkspaceDir(entry.path)
      setChildren(result.entries)
    } finally {
      setLoading(false)
    }
  }, [entry.isDirectory, entry.path])

  const toggle = (): void => {
    if (!entry.isDirectory) {
      if (isDroppableTextPath(entry.path)) {
        void openRecentFile(entry.path)
      }
      return
    }
    const next = !expanded
    setExpanded(next)
    if (next && children === null) void loadChildren()
  }

  const matchesFilter = (name: string, q: string): boolean => {
    if (!q) return true
    return name.toLowerCase().includes(q.toLowerCase())
  }

  if (filter && !entry.isDirectory && !matchesFilter(entry.name, filter)) {
    return null
  }

  // While filtering, force-expand folders that may contain matches (lazy load once)
  const showChildren = entry.isDirectory && (expanded || Boolean(filter))
  if (showChildren && children === null && !loading) {
    void loadChildren()
  }

  const childVisible =
    children?.filter((c) => {
      if (!filter) return true
      if (matchesFilter(c.name, filter)) return true
      return c.isDirectory
    }) ?? []

  const pad = 8 + depth * 12
  const isOpen = expanded || Boolean(filter)

  return (
    <div>
      <button
        type="button"
        className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[12px] text-zinc-700 hover:bg-zinc-200/80 dark:text-zinc-300 dark:hover:bg-zinc-800"
        style={{ paddingLeft: pad }}
        title={entry.path}
        onClick={toggle}
      >
        {entry.isDirectory ? (
          isOpen ? (
            <ChevronDown size={12} className="shrink-0 text-zinc-400" aria-hidden />
          ) : (
            <ChevronRight size={12} className="shrink-0 text-zinc-400" aria-hidden />
          )
        ) : (
          <span className="inline-block w-3 shrink-0" />
        )}
        {entry.isDirectory ? (
          isOpen ? (
            <FolderOpen size={13} className="shrink-0 text-amber-600/80 dark:text-amber-400/80" />
          ) : (
            <Folder size={13} className="shrink-0 text-amber-600/80 dark:text-amber-400/80" />
          )
        ) : (
          <FileText size={13} className="shrink-0 text-zinc-400" />
        )}
        <span className="min-w-0 truncate">{entry.name}</span>
        {loading ? <span className="ml-auto text-[10px] text-zinc-400">…</span> : null}
      </button>
      {entry.isDirectory && showChildren && children ? (
        <div>
          {childVisible.map((child) => (
            <TreeNode key={child.path} entry={child} depth={depth + 1} filter={filter} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

interface FileExplorerSidebarProps {
  onClose?: () => void
}

/**
 * Collapsible left explorer — lazy tree of the active folder workspace.
 */
function FileExplorerSidebar({ onClose }: FileExplorerSidebarProps): React.JSX.Element {
  const rootPath = useWorkspaceStore((s) => s.rootPath)
  const name = useWorkspaceStore((s) => s.name)
  const sidebarWidth = useSettingsStore((s) => s.sidebarWidth)
  const updateSettings = useSettingsStore((s) => s.updateSettings)

  const [filter, setFilter] = useState('')
  const [rootEntries, setRootEntries] = useState<DirEntryDTO[]>([])
  const [rootKey, setRootKey] = useState<string | null>(null)
  const [loadingRoot, setLoadingRoot] = useState(false)
  const [dragWidth, setDragWidth] = useState<number | null>(null)

  const width = dragWidth ?? sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH

  // Load root when workspace path changes (sync derivation + async fetch)
  if (rootPath !== rootKey) {
    setRootKey(rootPath)
    if (!rootPath) {
      setRootEntries([])
      setLoadingRoot(false)
    } else {
      setLoadingRoot(true)
      void listWorkspaceDir().then((result) => {
        setRootEntries(result.entries)
        setLoadingRoot(false)
      })
    }
  }

  const visibleRoot = useMemo(() => {
    if (!filter.trim()) return rootEntries
    const q = filter.trim().toLowerCase()
    return rootEntries.filter((e) => e.isDirectory || e.name.toLowerCase().includes(q))
  }, [rootEntries, filter])

  const onResizePointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    event.preventDefault()
    const startX = event.clientX
    const startW = width
    const onMove = (e: PointerEvent): void => {
      const next = Math.min(
        MAX_SIDEBAR_WIDTH,
        Math.max(MIN_SIDEBAR_WIDTH, startW + (e.clientX - startX))
      )
      setDragWidth(next)
    }
    const onUp = (): void => {
      setDragWidth((current) => {
        if (current != null) {
          void updateSettings({ sidebarWidth: Math.round(current) })
        }
        return null
      })
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <aside
      className="relative flex h-full shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60"
      style={{ width }}
      aria-label="Explorador de arquivos"
    >
      <div className="flex shrink-0 items-center justify-between gap-1 border-b border-zinc-100 px-2 py-1.5 dark:border-zinc-800">
        <span
          className="min-w-0 truncate text-[11px] font-medium text-zinc-500"
          title={rootPath ?? ''}
        >
          {rootPath ? name : 'Sem pasta'}
        </span>
        <button
          type="button"
          className="rounded p-0.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          title="Ocultar explorador (⌘B)"
          aria-label="Ocultar explorador"
          onClick={onClose}
        >
          <PanelLeftClose size={14} />
        </button>
      </div>

      <div className="shrink-0 border-b border-zinc-100 px-2 py-1.5 dark:border-zinc-800">
        <label className="relative flex items-center">
          <Search size={12} className="pointer-events-none absolute left-2 text-zinc-400" />
          <input
            type="search"
            className="w-full rounded-md border border-zinc-200 bg-white py-1 pr-2 pl-7 text-[11px] text-zinc-800 outline-none focus:border-blue-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
            placeholder="Buscar arquivos…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            disabled={!rootPath}
          />
        </label>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        {!rootPath ? (
          <p className="px-3 py-4 text-[11px] leading-relaxed text-zinc-400">
            Abra uma pasta como Workspace
            <br />
            <span className="text-zinc-500">Arquivo → Abrir pasta…</span>
            <br />
            <kbd className="mt-1 inline-block text-[10px]">⌘⌥O</kbd>
          </p>
        ) : loadingRoot ? (
          <p className="px-3 py-2 text-[11px] text-zinc-400">Carregando…</p>
        ) : visibleRoot.length === 0 ? (
          <p className="px-3 py-2 text-[11px] text-zinc-400">Pasta vazia</p>
        ) : (
          visibleRoot.map((entry) => (
            <TreeNode key={entry.path} entry={entry} depth={0} filter={filter.trim()} />
          ))
        )}
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Redimensionar explorador"
        title="Arraste para redimensionar"
        className="absolute top-0 right-0 bottom-0 z-10 w-1 cursor-col-resize hover:bg-blue-400/50"
        onPointerDown={onResizePointerDown}
      />
    </aside>
  )
}

export default FileExplorerSidebar
