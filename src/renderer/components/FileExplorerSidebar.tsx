import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  FilePlus,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Loader2,
  PanelLeftClose,
  RefreshCw,
  Search,
  ChevronsDownUp,
  ChevronsUpDown
} from 'lucide-react'
import type { DirEntryDTO } from '../../shared/workspace'
import { useWorkspaceStore } from '../store/useWorkspaceStore'
import { useSettingsStore } from '../store/useSettingsStore'
import {
  createWorkspaceFolder,
  createWorkspaceNote,
  deleteWorkspaceEntry,
  importFileIntoWorkspace,
  listWorkspaceDir,
  renameWorkspaceEntry
} from '../services/workspaceActions'
import { openRecentFile, isDroppableTextPath } from '../services/fileActions'
import { isElectronApiAvailable } from '../services/sessionBridge'
import { requestExplorerRefresh, subscribeExplorerRefresh } from '../services/explorerEvents'
import { showToast } from '../store/useToastStore'
import { DEFAULT_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH, MIN_SIDEBAR_WIDTH } from '../../shared/settings'

interface ContextMenuState {
  x: number
  y: number
  entry: DirEntryDTO | null
  /** true when opened on empty area → target = workspace root */
  onRoot: boolean
}

function isDirPath(
  path: string,
  rootEntries: DirEntryDTO[],
  childrenMap: Record<string, DirEntryDTO[]>
): boolean {
  if (rootEntries.some((e) => e.path === path && e.isDirectory)) return true
  return Object.values(childrenMap).some((list) =>
    list.some((e) => e.path === path && e.isDirectory)
  )
}

function resolveParentDir(
  selectedPath: string | null,
  rootPath: string | null,
  rootEntries: DirEntryDTO[],
  childrenMap: Record<string, DirEntryDTO[]>
): string | undefined {
  if (!rootPath) return undefined
  if (!selectedPath) return rootPath
  if (isDirPath(selectedPath, rootEntries, childrenMap)) return selectedPath
  const parent = selectedPath.replace(/[/\\][^/\\]+$/, '')
  return parent || rootPath
}

function FileExplorerSidebar({ onClose }: { onClose?: () => void }): React.JSX.Element {
  const rootPath = useWorkspaceStore((s) => s.rootPath)
  const name = useWorkspaceStore((s) => s.name)
  const sidebarWidth = useSettingsStore((s) => s.sidebarWidth)
  const updateSettings = useSettingsStore((s) => s.updateSettings)

  const [filter, setFilter] = useState('')
  const [rootEntries, setRootEntries] = useState<DirEntryDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())
  const [childrenMap, setChildrenMap] = useState<Record<string, DirEntryDTO[]>>({})
  const [dragWidth, setDragWidth] = useState<number | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [boundRoot, setBoundRoot] = useState<string | null | undefined>(undefined)
  const refreshGen = useRef(0)
  const childrenKeysRef = useRef<string[]>([])

  const width = dragWidth ?? sidebarWidth ?? DEFAULT_SIDEBAR_WIDTH

  const reloadRoot = useCallback(async (): Promise<void> => {
    const root = useWorkspaceStore.getState().rootPath
    if (!root) {
      setRootEntries([])
      setChildrenMap({})
      childrenKeysRef.current = []
      return
    }
    const gen = ++refreshGen.current
    setLoading(true)
    try {
      const result = await listWorkspaceDir()
      if (gen !== refreshGen.current) return
      setRootEntries(result.entries)
      const expandedPaths = childrenKeysRef.current
      if (expandedPaths.length > 0) {
        const pairs = await Promise.all(
          expandedPaths.map(async (p) => {
            try {
              const r = await listWorkspaceDir(p)
              return [p, r.entries] as const
            } catch {
              return [p, [] as DirEntryDTO[]] as const
            }
          })
        )
        if (gen !== refreshGen.current) return
        const map: Record<string, DirEntryDTO[]> = {}
        for (const [p, entries] of pairs) map[p] = entries
        setChildrenMap(map)
        childrenKeysRef.current = Object.keys(map)
      }
    } finally {
      if (gen === refreshGen.current) setLoading(false)
    }
  }, [])

  // Reset tree when workspace root changes (render-phase sync, then async load)
  if (boundRoot !== rootPath) {
    setBoundRoot(rootPath)
    setExpanded(new Set())
    setChildrenMap({})
    setFilter('')
    setSelectedPath(null)
    setRootEntries([])
    if (rootPath) {
      void listWorkspaceDir().then((result) => {
        setRootEntries(result.entries)
      })
    }
  }

  // Soft refresh from saves / watcher
  useEffect(() => {
    return subscribeExplorerRefresh(() => {
      void reloadRoot()
    })
  }, [reloadRoot])

  // chokidar → main → renderer
  useEffect(() => {
    if (!isElectronApiAvailable() || typeof window.api.onWorkspaceFsChanged !== 'function') {
      return
    }
    return window.api.onWorkspaceFsChanged(() => {
      requestExplorerRefresh('fs-watch')
    })
  }, [])

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return
    const close = (): void => setContextMenu(null)
    window.addEventListener('click', close)
    window.addEventListener('blur', close)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('blur', close)
    }
  }, [contextMenu])

  const loadChildren = async (dirPath: string): Promise<void> => {
    const result = await listWorkspaceDir(dirPath)
    setChildrenMap((prev) => {
      const next = { ...prev, [dirPath]: result.entries }
      childrenKeysRef.current = Object.keys(next)
      return next
    })
  }

  const toggleDir = (path: string): void => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
        if (!childrenMap[path]) void loadChildren(path)
        else if (!childrenKeysRef.current.includes(path)) {
          childrenKeysRef.current = [...childrenKeysRef.current, path]
        }
      }
      return next
    })
  }

  const expandAllVisible = (): void => {
    const dirs: string[] = []
    const walk = (entries: DirEntryDTO[]): void => {
      for (const e of entries) {
        if (e.isDirectory) {
          dirs.push(e.path)
          const kids = childrenMap[e.path]
          if (kids) walk(kids)
        }
      }
    }
    walk(rootEntries)
    setExpanded(new Set(dirs))
    void (async () => {
      for (const d of dirs) {
        if (!childrenMap[d]) await loadChildren(d)
      }
    })()
  }

  const collapseAll = (): void => {
    setExpanded(new Set())
  }

  const openFile = (path: string): void => {
    if (isDroppableTextPath(path)) void openRecentFile(path)
    else showToast('Formato não suportado no editor.', 'info')
  }

  const handleNewNote = async (parentDir?: string): Promise<void> => {
    const suggested = window.prompt('Nome da nota', 'Nova nota.md')
    if (suggested === null) return
    const path = await createWorkspaceNote(
      parentDir ?? rootPath ?? undefined,
      suggested || 'Nova nota.md'
    )
    if (path) {
      if (parentDir) {
        setExpanded((prev) => new Set(prev).add(parentDir))
      }
      await reloadRoot()
      void openRecentFile(path)
    }
  }

  const handleNewFolder = async (parentDir?: string): Promise<void> => {
    const suggested = window.prompt('Nome da pasta', 'Nova pasta')
    if (suggested === null) return
    const path = await createWorkspaceFolder(
      parentDir ?? rootPath ?? undefined,
      suggested || 'Nova pasta'
    )
    if (path) {
      if (parentDir) setExpanded((prev) => new Set(prev).add(parentDir))
      await reloadRoot()
    }
  }

  const handleRename = async (entry: DirEntryDTO): Promise<void> => {
    const next = window.prompt('Renomear', entry.name)
    if (next === null || !next.trim() || next.trim() === entry.name) return
    const newPath = await renameWorkspaceEntry(entry.path, next.trim())
    if (newPath) await reloadRoot()
  }

  const handleDelete = async (entry: DirEntryDTO): Promise<void> => {
    const ok = window.confirm(
      entry.isDirectory
        ? `Apagar a pasta "${entry.name}" e todo o conteúdo?`
        : `Apagar "${entry.name}"?`
    )
    if (!ok) return
    const success = await deleteWorkspaceEntry(entry.path)
    if (success) {
      setExpanded((prev) => {
        const n = new Set(prev)
        n.delete(entry.path)
        return n
      })
      await reloadRoot()
    }
  }

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
        if (current != null) void updateSettings({ sidebarWidth: Math.round(current) })
        return null
      })
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const handleDropOnDir = async (destDir: string, event: React.DragEvent): Promise<void> => {
    event.preventDefault()
    event.stopPropagation()
    setDropTarget(null)
    if (![...event.dataTransfer.types].includes('Files')) return
    const files = Array.from(event.dataTransfer.files)
    for (const file of files) {
      let path = ''
      if (isElectronApiAvailable() && typeof window.api.getPathForFile === 'function') {
        path = window.api.getPathForFile(file)
      }
      if (!path) path = (file as File & { path?: string }).path ?? ''
      if (!path) continue
      if (!isDroppableTextPath(path)) {
        showToast(`Ignorado: ${file.name}`, 'info')
        continue
      }
      const imported = await importFileIntoWorkspace(path, destDir)
      if (imported) void openRecentFile(imported)
    }
    await reloadRoot()
  }

  const filterLower = filter.trim().toLowerCase()

  const filterEntries = (entries: DirEntryDTO[]): DirEntryDTO[] => {
    if (!filterLower) return entries
    return entries.filter((e) => e.isDirectory || e.name.toLowerCase().includes(filterLower))
  }

  const renderEntries = (entries: DirEntryDTO[], depth: number): React.ReactNode => {
    const list = filterEntries(entries)
    return list.map((entry) => {
      const isOpen = expanded.has(entry.path)
      const pad = 8 + depth * 12
      const kids = childrenMap[entry.path]
      const selected = selectedPath === entry.path

      return (
        <div key={entry.path}>
          <button
            type="button"
            className={[
              'flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-[12px]',
              selected
                ? 'bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-100'
                : 'text-zinc-700 hover:bg-zinc-200/80 dark:text-zinc-300 dark:hover:bg-zinc-800',
              dropTarget === entry.path ? 'ring-1 ring-blue-400' : ''
            ].join(' ')}
            style={{ paddingLeft: pad }}
            title={entry.path}
            onClick={() => {
              setSelectedPath(entry.path)
              if (entry.isDirectory) toggleDir(entry.path)
              else openFile(entry.path)
            }}
            onContextMenu={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setSelectedPath(entry.path)
              setContextMenu({ x: e.clientX, y: e.clientY, entry, onRoot: false })
            }}
            onDragOver={
              entry.isDirectory
                ? (e) => {
                    if (![...e.dataTransfer.types].includes('Files')) return
                    e.preventDefault()
                    e.stopPropagation()
                    e.dataTransfer.dropEffect = 'copy'
                    setDropTarget(entry.path)
                  }
                : undefined
            }
            onDragLeave={
              entry.isDirectory
                ? () => {
                    setDropTarget((t) => (t === entry.path ? null : t))
                  }
                : undefined
            }
            onDrop={
              entry.isDirectory
                ? (e) => {
                    void handleDropOnDir(entry.path, e)
                  }
                : undefined
            }
          >
            {entry.isDirectory ? (
              isOpen ? (
                <ChevronDown size={12} className="shrink-0 text-zinc-400" />
              ) : (
                <ChevronRight size={12} className="shrink-0 text-zinc-400" />
              )
            ) : (
              <span className="inline-block w-3 shrink-0" />
            )}
            {entry.isDirectory ? (
              isOpen ? (
                <FolderOpen
                  size={13}
                  className="shrink-0 text-amber-600/80 dark:text-amber-400/80"
                />
              ) : (
                <Folder size={13} className="shrink-0 text-amber-600/80 dark:text-amber-400/80" />
              )
            ) : (
              <FileText size={13} className="shrink-0 text-zinc-400" />
            )}
            <span className="min-w-0 truncate">{entry.name}</span>
          </button>
          {entry.isDirectory && isOpen && kids ? <div>{renderEntries(kids, depth + 1)}</div> : null}
        </div>
      )
    })
  }

  const toolBtn =
    'rounded p-1 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800 disabled:opacity-40 dark:hover:bg-zinc-800 dark:hover:text-zinc-200'

  return (
    <aside
      className="relative flex h-full shrink-0 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60"
      style={{ width }}
      aria-label="Explorador de arquivos"
      onContextMenu={(e) => {
        if (!rootPath) return
        // only empty area
        if ((e.target as HTMLElement).closest('button')) return
        e.preventDefault()
        setContextMenu({ x: e.clientX, y: e.clientY, entry: null, onRoot: true })
      }}
      onDragOver={(e) => {
        if (!rootPath || ![...e.dataTransfer.types].includes('Files')) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'copy'
        setDropTarget(rootPath)
      }}
      onDragLeave={() => setDropTarget((t) => (t === rootPath ? null : t))}
      onDrop={(e) => {
        if (!rootPath) return
        void handleDropOnDir(rootPath, e)
      }}
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
          className={toolBtn}
          title="Ocultar explorador (⌘B)"
          aria-label="Ocultar explorador"
          onClick={onClose}
        >
          <PanelLeftClose size={14} />
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex shrink-0 items-center gap-0.5 border-b border-zinc-100 px-1.5 py-1 dark:border-zinc-800">
        <button
          type="button"
          className={toolBtn}
          title="Nova nota"
          disabled={!rootPath}
          onClick={() => {
            const parent = resolveParentDir(selectedPath, rootPath, rootEntries, childrenMap)
            void handleNewNote(parent)
          }}
        >
          <FilePlus size={14} />
        </button>
        <button
          type="button"
          className={toolBtn}
          title="Nova pasta"
          disabled={!rootPath}
          onClick={() => {
            const parent = resolveParentDir(selectedPath, rootPath, rootEntries, childrenMap)
            void handleNewFolder(parent)
          }}
        >
          <FolderPlus size={14} />
        </button>
        <button
          type="button"
          className={toolBtn}
          title="Atualizar"
          disabled={!rootPath || loading}
          onClick={() => void reloadRoot()}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
        </button>
        <button
          type="button"
          className={toolBtn}
          title="Expandir pastas carregadas"
          disabled={!rootPath}
          onClick={expandAllVisible}
        >
          <ChevronsUpDown size={14} />
        </button>
        <button
          type="button"
          className={toolBtn}
          title="Recolher tudo"
          disabled={!rootPath}
          onClick={collapseAll}
        >
          <ChevronsDownUp size={14} />
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

      <div
        className={[
          'min-h-0 flex-1 overflow-y-auto py-1',
          dropTarget === rootPath ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''
        ].join(' ')}
      >
        {!rootPath ? (
          <p className="px-3 py-4 text-[11px] leading-relaxed text-zinc-400">
            Abra uma pasta como Workspace
            <br />
            <span className="text-zinc-500">Arquivo → Abrir pasta…</span>
            <br />
            <kbd className="mt-1 inline-block text-[10px]">⌘⌥O</kbd>
          </p>
        ) : loading && rootEntries.length === 0 ? (
          <p className="flex items-center gap-2 px-3 py-2 text-[11px] text-zinc-400">
            <Loader2 size={12} className="animate-spin" /> Carregando…
          </p>
        ) : rootEntries.length === 0 ? (
          <p className="px-3 py-2 text-[11px] text-zinc-400">Pasta vazia — use + para criar</p>
        ) : (
          renderEntries(rootEntries, 0)
        )}
      </div>

      {loading && rootEntries.length > 0 ? (
        <div className="pointer-events-none absolute right-2 bottom-2 rounded-full bg-white/90 p-1 shadow dark:bg-zinc-900/90">
          <Loader2 size={12} className="animate-spin text-zinc-400" />
        </div>
      ) : null}

      {contextMenu ? (
        <div
          className="fixed z-[100] min-w-[160px] rounded-md border border-zinc-200 bg-white py-1 text-[12px] shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="block w-full px-3 py-1.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
            onClick={() => {
              setContextMenu(null)
              const parent = contextMenu.entry?.isDirectory
                ? contextMenu.entry.path
                : contextMenu.entry
                  ? contextMenu.entry.path.replace(/[/\\][^/\\]+$/, '')
                  : (rootPath ?? undefined)
              void handleNewNote(parent)
            }}
          >
            Nova nota
          </button>
          <button
            type="button"
            className="block w-full px-3 py-1.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
            onClick={() => {
              setContextMenu(null)
              const parent = contextMenu.entry?.isDirectory
                ? contextMenu.entry.path
                : (rootPath ?? undefined)
              void handleNewFolder(parent)
            }}
          >
            Nova pasta
          </button>
          {contextMenu.entry ? (
            <>
              <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />
              <button
                type="button"
                className="block w-full px-3 py-1.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => {
                  setContextMenu(null)
                  if (contextMenu.entry) void handleRename(contextMenu.entry)
                }}
              >
                Renomear
              </button>
              <button
                type="button"
                className="block w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                onClick={() => {
                  setContextMenu(null)
                  if (contextMenu.entry) void handleDelete(contextMenu.entry)
                }}
              >
                Excluir
              </button>
            </>
          ) : null}
        </div>
      ) : null}

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
