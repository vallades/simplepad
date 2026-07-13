import { useCallback, useRef, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useTabsStore, type Tab } from '../store/useTabsStore'
import { confirmCloseTab } from '../services/fileActions'

/**
 * Horizontal tab strip with dirty indicators, close confirm, and HTML5 drag & drop reorder.
 */
function TabBar(): React.JSX.Element {
  const tabs = useTabsStore((state) => state.tabs)
  const activeTabId = useTabsStore((state) => state.activeTabId)
  const switchTab = useTabsStore((state) => state.switchTab)
  const closeTab = useTabsStore((state) => state.closeTab)
  const createNewTab = useTabsStore((state) => state.createNewTab)
  const reorderTabs = useTabsStore((state) => state.reorderTabs)

  const dragIdRef = useRef<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const requestClose = useCallback(
    (tab: Tab) => {
      if (tab.isDirty && !confirmCloseTab(tab.title)) return
      closeTab(tab.id)
    },
    [closeTab]
  )

  const onDragStart = (event: React.DragEvent<HTMLDivElement>, id: string): void => {
    dragIdRef.current = id
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', id)
    // Improve drag ghost readability in some browsers
    event.currentTarget.classList.add('opacity-60')
  }

  const onDragEnd = (event: React.DragEvent<HTMLDivElement>): void => {
    dragIdRef.current = null
    setDragOverId(null)
    event.currentTarget.classList.remove('opacity-60')
  }

  const onDragOver = (event: React.DragEvent<HTMLDivElement>, id: string): void => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    if (dragOverId !== id) {
      setDragOverId(id)
    }
  }

  const onDrop = (event: React.DragEvent<HTMLDivElement>, targetId: string): void => {
    event.preventDefault()
    const sourceId = dragIdRef.current ?? event.dataTransfer.getData('text/plain')
    setDragOverId(null)
    dragIdRef.current = null

    if (!sourceId || sourceId === targetId) return

    const fromIndex = tabs.findIndex((tab) => tab.id === sourceId)
    const toIndex = tabs.findIndex((tab) => tab.id === targetId)
    if (fromIndex === -1 || toIndex === -1) return

    const next = [...tabs]
    const [moved] = next.splice(fromIndex, 1)
    if (!moved) return
    next.splice(toIndex, 0, moved)
    reorderTabs(next)
  }

  return (
    <div
      className="flex shrink-0 items-stretch gap-0 overflow-x-auto border-b border-zinc-200 bg-zinc-50 px-1 dark:border-zinc-800 dark:bg-zinc-900"
      role="tablist"
      aria-label="Abas abertas"
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId
        const isDragTarget = dragOverId === tab.id

        return (
          <div
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={0}
            draggable
            onDragStart={(event) => onDragStart(event, tab.id)}
            onDragEnd={onDragEnd}
            onDragOver={(event) => onDragOver(event, tab.id)}
            onDrop={(event) => onDrop(event, tab.id)}
            onClick={() => switchTab(tab.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                switchTab(tab.id)
              }
              if (
                event.key === 'Delete' ||
                (event.key === 'w' && (event.metaKey || event.ctrlKey))
              ) {
                event.preventDefault()
                requestClose(tab)
              }
            }}
            className={[
              'group flex max-w-[200px] min-w-[110px] cursor-grab items-center gap-1 border-r border-zinc-200 px-2 py-1.5 text-xs select-none active:cursor-grabbing dark:border-zinc-800',
              isActive
                ? 'bg-white text-zinc-900 shadow-[inset_0_-2px_0_0_#2563eb] dark:bg-zinc-950 dark:text-zinc-50'
                : 'bg-transparent text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800',
              isDragTarget ? 'bg-blue-50 dark:bg-blue-950/40' : ''
            ].join(' ')}
          >
            <span className="flex-1 truncate" title={tab.filePath ?? tab.title}>
              {tab.title}
              {tab.isDirty ? <span className="text-blue-600 dark:text-blue-400"> *</span> : null}
            </span>
            <button
              type="button"
              aria-label={`Fechar ${tab.title}`}
              className={[
                'rounded p-0.5 transition-opacity hover:bg-zinc-200 dark:hover:bg-zinc-700',
                isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus:opacity-100'
              ].join(' ')}
              onClick={(event) => {
                event.stopPropagation()
                requestClose(tab)
              }}
            >
              <X size={12} strokeWidth={2} />
            </button>
          </div>
        )
      })}

      <button
        type="button"
        aria-label="Nova aba"
        title="Nova aba"
        className="flex shrink-0 items-center px-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        onClick={() => createNewTab()}
      >
        <Plus size={14} />
      </button>
    </div>
  )
}

export default TabBar
