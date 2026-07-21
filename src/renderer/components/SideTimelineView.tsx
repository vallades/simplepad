import { useCallback, useMemo, useState } from 'react'
import { Clock, FileText, Loader2 } from 'lucide-react'
import { useTabsStore } from '../store/useTabsStore'
import { useWorkspaceStore } from '../store/useWorkspaceStore'
import { openRecentFile } from '../services/fileActions'
import { isElectronApiAvailable } from '../services/sessionBridge'
import type { TimelineEntryDTO } from '../../shared/workspaceSearch'
import { isUntitledNotesPath } from '../../shared/untitledNotes'

const MAX_ENTRIES = 20

function formatRelative(iso: string): string {
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return '—'
  const diff = Date.now() - t
  const sec = Math.round(diff / 1000)
  if (sec < 60) return 'agora'
  const min = Math.round(sec / 60)
  if (min < 60) return `${min} min`
  const hr = Math.round(min / 60)
  if (hr < 48) return `${hr} h`
  const day = Math.round(hr / 24)
  if (day < 14) return `${day} d`
  return new Date(t).toLocaleDateString()
}

/**
 * Recent notes timeline: open tabs (with path) + recent files from disk (max 20).
 */
function SideTimelineView(): React.JSX.Element {
  const tabs = useTabsStore((s) => s.tabs)
  const switchTab = useTabsStore((s) => s.switchTab)
  const workspaceName = useWorkspaceStore((s) => s.name)

  const [diskEntries, setDiskEntries] = useState<TimelineEntryDTO[]>([])
  const [loading, setLoading] = useState(false)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)

  const loadDisk = useCallback(async (): Promise<void> => {
    if (!isElectronApiAvailable() || typeof window.api.listTimeline !== 'function') {
      setDiskEntries([])
      setLoadedKey(workspaceName)
      return
    }
    setLoading(true)
    try {
      const result = await window.api.listTimeline(MAX_ENTRIES)
      setDiskEntries((result.data ?? []) as TimelineEntryDTO[])
      setLoadedKey(workspaceName)
    } finally {
      setLoading(false)
    }
  }, [workspaceName])

  // Load once when view mounts / workspace name changes (render-phase trigger)
  if (loadedKey !== workspaceName && !loading) {
    setLoadedKey(workspaceName)
    void loadDisk()
  }

  const openTabEntries = useMemo((): TimelineEntryDTO[] => {
    return tabs
      .filter((t) => t.filePath && !isUntitledNotesPath(t.filePath))
      .map((t) => ({
        filePath: t.filePath!,
        title: t.title,
        lastModified:
          t.lastModified instanceof Date
            ? t.lastModified.toISOString()
            : new Date(t.lastModified).toISOString(),
        workspaceLabel: 'Aba aberta',
        source: 'open-tab' as const
      }))
  }, [tabs])

  const merged = useMemo(() => {
    const byPath = new Map<string, TimelineEntryDTO>()
    for (const e of diskEntries) {
      byPath.set(e.filePath.replace(/\\/g, '/'), e)
    }
    for (const e of openTabEntries) {
      const key = e.filePath.replace(/\\/g, '/')
      const existing = byPath.get(key)
      if (!existing || e.lastModified > existing.lastModified) {
        byPath.set(key, e)
      } else {
        byPath.set(key, { ...existing, workspaceLabel: 'Aba aberta', source: 'open-tab' })
      }
    }
    return [...byPath.values()]
      .sort((a, b) => b.lastModified.localeCompare(a.lastModified))
      .slice(0, MAX_ENTRIES)
  }, [diskEntries, openTabEntries])

  const openEntry = async (entry: TimelineEntryDTO): Promise<void> => {
    const open = tabs.find(
      (t) => t.filePath && t.filePath.replace(/\\/g, '/') === entry.filePath.replace(/\\/g, '/')
    )
    if (open) {
      switchTab(open.id)
      return
    }
    await openRecentFile(entry.filePath)
  }

  return (
    <div className="side-view flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-1 border-b border-zinc-100 px-2 py-1.5 dark:border-zinc-800">
        <div className="flex items-center gap-1.5">
          <Clock size={12} className="text-zinc-400" aria-hidden />
          <span className="text-[11px] font-medium text-zinc-500">Timeline</span>
        </div>
        <button
          type="button"
          className="rounded px-1.5 py-0.5 text-[10px] text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800"
          title="Atualizar"
          onClick={() => {
            setLoadedKey(null)
            void loadDisk()
          }}
        >
          Atualizar
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        {loading && merged.length === 0 ? (
          <p className="flex items-center gap-2 px-2 py-3 text-[11px] text-zinc-400">
            <Loader2 size={12} className="animate-spin" /> Carregando…
          </p>
        ) : merged.length === 0 ? (
          <p className="px-2 py-3 text-[11px] leading-relaxed text-zinc-400">
            Nenhuma nota recente. Abra ou salve arquivos para vê-los aqui.
          </p>
        ) : (
          <ul className="flex flex-col">
            {merged.map((entry) => (
              <li key={entry.filePath}>
                <button
                  type="button"
                  className="flex w-full flex-col gap-0.5 rounded px-2 py-1.5 text-left hover:bg-zinc-200/80 dark:hover:bg-zinc-800"
                  title={entry.filePath}
                  onClick={() => void openEntry(entry)}
                >
                  <span className="flex items-center gap-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-200">
                    <FileText size={11} className="shrink-0 text-zinc-400" />
                    <span className="min-w-0 flex-1 truncate">{entry.title}</span>
                    <span className="shrink-0 text-[10px] font-normal text-zinc-400">
                      {formatRelative(entry.lastModified)}
                    </span>
                  </span>
                  <span className="truncate pl-4 text-[10px] text-zinc-400">
                    {entry.workspaceLabel}
                    {entry.source === 'open-tab' ? ' · aberta' : ''}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t border-zinc-100 px-2 py-1 text-[10px] text-zinc-400 dark:border-zinc-800">
        Últimas {merged.length} nota{merged.length === 1 ? '' : 's'}
      </div>
    </div>
  )
}

export default SideTimelineView
