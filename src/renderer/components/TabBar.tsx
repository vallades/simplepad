import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { MoreHorizontal, Plus, X } from 'lucide-react'
import { useTabsStore, type Tab } from '../store/useTabsStore'
import {
  confirmCloseTab,
  saveActiveTab,
  saveActiveTabAs,
  openRecentFile
} from '../services/fileActions'
import { applyMarkdownMode } from '../services/markdownMode'
import { copyTextToClipboard, showItemInFolder } from '../services/workspaceActions'
import { isUntitledNotesPath } from '../../shared/untitledNotes'
import { isElectronApiAvailable } from '../services/sessionBridge'
import ContextMenu, { type ContextMenuItem } from './ContextMenu'

/** Show overflow "…" when more than this many tabs. */
export const TAB_OVERFLOW_THRESHOLD = 6

interface TabContextMenuState {
  tabId: string
  x: number
  y: number
}

/**
 * Horizontal tab strip with dirty indicators, close confirm, HTML5 drag reorder,
 * overflow menu, and rich right-click context menu.
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
  const [overflowOpen, setOverflowOpen] = useState(false)
  const overflowRef = useRef<HTMLDivElement | null>(null)
  const [contextMenu, setContextMenu] = useState<TabContextMenuState | null>(null)
  const contextRef = useRef<HTMLDivElement | null>(null)

  const showOverflow = tabs.length > TAB_OVERFLOW_THRESHOLD
  const visibleTabs = showOverflow ? tabs.slice(0, TAB_OVERFLOW_THRESHOLD) : tabs

  useEffect(() => {
    if (!overflowOpen && !contextMenu) return
    const onDoc = (event: MouseEvent): void => {
      if (overflowOpen && !overflowRef.current?.contains(event.target as Node)) {
        setOverflowOpen(false)
      }
      if (contextMenu && !contextRef.current?.contains(event.target as Node)) {
        setContextMenu(null)
      }
    }
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setOverflowOpen(false)
        setContextMenu(null)
      }
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [overflowOpen, contextMenu])

  const requestClose = useCallback(
    (tab: Tab) => {
      void (async () => {
        if (tab.isDirty) {
          const ok = await confirmCloseTab(tab.title)
          if (!ok) return
        }
        closeTab(tab.id)
      })()
    },
    [closeTab]
  )

  const closeOthers = useCallback((keepId: string) => {
    void (async () => {
      const list = useTabsStore.getState().tabs
      for (const tab of list) {
        if (tab.id === keepId) continue
        if (tab.isDirty) {
          const ok = await confirmCloseTab(tab.title)
          if (!ok) continue
        }
        useTabsStore.getState().closeTab(tab.id)
      }
      useTabsStore.getState().switchTab(keepId)
    })()
  }, [])

  const closeToTheRight = useCallback((fromId: string) => {
    void (async () => {
      const list = useTabsStore.getState().tabs
      const idx = list.findIndex((t) => t.id === fromId)
      if (idx === -1) return
      const toClose = list.slice(idx + 1)
      for (const tab of toClose) {
        if (tab.isDirty) {
          const ok = await confirmCloseTab(tab.title)
          if (!ok) continue
        }
        useTabsStore.getState().closeTab(tab.id)
      }
    })()
  }, [])

  const closeAll = useCallback(() => {
    void (async () => {
      const list = [...useTabsStore.getState().tabs]
      for (const tab of list) {
        if (tab.isDirty) {
          const ok = await confirmCloseTab(tab.title)
          if (!ok) continue
        }
        useTabsStore.getState().closeTab(tab.id)
      }
    })()
  }, [])

  const duplicateTab = useCallback((tab: Tab) => {
    useTabsStore.getState().createNewTab({
      title: `${tab.title} (cópia)`,
      content: tab.content,
      isMarkdown: tab.isMarkdown,
      isDirty: true
    })
  }, [])

  const onDragStart = (event: React.DragEvent<HTMLDivElement>, id: string): void => {
    dragIdRef.current = id
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', id)
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

  const contextItems = useMemo((): ContextMenuItem[] => {
    if (!contextMenu) return []
    const tab = tabs.find((t) => t.id === contextMenu.tabId)
    if (!tab) return []

    const hasRealPath = Boolean(tab.filePath) && !isUntitledNotesPath(tab.filePath)
    const idx = tabs.findIndex((t) => t.id === tab.id)
    const hasToRight = idx >= 0 && idx < tabs.length - 1
    const revealLabel =
      typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)
        ? 'Revelar no Finder'
        : 'Revelar no Explorer'

    const items: ContextMenuItem[] = [
      {
        id: 'close',
        label: 'Fechar',
        onSelect: () => requestClose(tab)
      },
      {
        id: 'close-others',
        label: 'Fechar outras',
        disabled: tabs.length <= 1,
        onSelect: () => closeOthers(tab.id)
      },
      {
        id: 'close-right',
        label: 'Fechar à direita',
        disabled: !hasToRight,
        onSelect: () => closeToTheRight(tab.id)
      },
      {
        id: 'close-all',
        label: 'Fechar todas',
        onSelect: () => closeAll()
      },
      { id: 'sep-1', label: '', separator: true },
      {
        id: 'save',
        label: 'Salvar',
        onSelect: () => {
          switchTab(tab.id)
          void saveActiveTab()
        }
      },
      {
        id: 'save-as',
        label: 'Salvar como…',
        onSelect: () => {
          switchTab(tab.id)
          void saveActiveTabAs()
        }
      },
      {
        id: 'reload',
        label: 'Recarregar do disco',
        disabled: !hasRealPath || tab.isDirty,
        onSelect: () => {
          if (tab.filePath) void openRecentFile(tab.filePath)
        }
      },
      { id: 'sep-2', label: '', separator: true },
      {
        id: 'copy-path',
        label: 'Copiar caminho',
        disabled: !hasRealPath,
        onSelect: () => {
          if (tab.filePath) void copyTextToClipboard(tab.filePath, 'Caminho copiado')
        }
      },
      {
        id: 'copy-name',
        label: 'Copiar nome',
        onSelect: () => void copyTextToClipboard(tab.title, 'Nome copiado')
      },
      {
        id: 'reveal',
        label: revealLabel,
        disabled: !hasRealPath || !isElectronApiAvailable(),
        onSelect: () => {
          if (tab.filePath) void showItemInFolder(tab.filePath)
        }
      },
      { id: 'sep-3', label: '', separator: true },
      {
        id: 'format',
        label: tab.isMarkdown ? 'Formato: Plain Text' : 'Formato: Markdown',
        onSelect: () => applyMarkdownMode(tab.id, !tab.isMarkdown)
      },
      {
        id: 'duplicate',
        label: 'Duplicar aba',
        onSelect: () => duplicateTab(tab)
      },
      {
        id: 'new',
        label: 'Nova aba',
        onSelect: () => createNewTab()
      }
    ]
    return items
  }, [
    contextMenu,
    tabs,
    requestClose,
    closeOthers,
    closeToTheRight,
    closeAll,
    switchTab,
    duplicateTab,
    createNewTab
  ])

  const renderTab = (tab: Tab): React.JSX.Element => {
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
        onContextMenu={(event) => {
          event.preventDefault()
          switchTab(tab.id)
          setContextMenu({ tabId: tab.id, x: event.clientX, y: event.clientY })
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            switchTab(tab.id)
          }
          if (event.key === 'Delete' || (event.key === 'w' && (event.metaKey || event.ctrlKey))) {
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
        <span
          className="flex-1 truncate"
          title={`${tab.filePath ?? tab.title} · ${tab.isMarkdown ? 'Markdown' : 'Plain Text'}`}
        >
          {tab.title}
          {tab.isDirty ? <span className="text-blue-600 dark:text-blue-400"> *</span> : null}
          {tab.isMarkdown ? (
            <span className="ml-0.5 text-[9px] font-medium text-blue-500/80" title="Markdown">
              MD
            </span>
          ) : null}
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
  }

  return (
    <div
      className="flex shrink-0 items-stretch gap-0 overflow-x-auto border-b border-zinc-200 bg-zinc-50 px-1 dark:border-zinc-800 dark:bg-zinc-900"
      role="tablist"
      aria-label="Abas abertas"
    >
      {visibleTabs.map(renderTab)}

      {showOverflow ? (
        <div className="relative flex shrink-0 items-stretch" ref={overflowRef}>
          <button
            type="button"
            aria-label="Mais abas"
            aria-expanded={overflowOpen}
            aria-haspopup="listbox"
            title={`${tabs.length} abas — ver todas`}
            className={[
              'flex items-center border-r border-zinc-200 px-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:border-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200',
              overflowOpen ? 'bg-zinc-100 dark:bg-zinc-800' : ''
            ].join(' ')}
            onClick={() => setOverflowOpen((v) => !v)}
          >
            <MoreHorizontal size={14} />
            <span className="ml-0.5 text-[10px] tabular-nums text-zinc-400">{tabs.length}</span>
          </button>
          {overflowOpen ? (
            <ul
              role="listbox"
              aria-label="Todas as abas"
              className="absolute top-full left-0 z-50 mt-0.5 max-h-64 min-w-[220px] overflow-y-auto rounded-md border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
            >
              {tabs.map((tab) => {
                const isActive = tab.id === activeTabId
                return (
                  <li key={tab.id} role="option" aria-selected={isActive}>
                    <button
                      type="button"
                      className={[
                        'flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs',
                        isActive
                          ? 'bg-blue-50 text-blue-900 dark:bg-blue-950/50 dark:text-blue-100'
                          : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                      ].join(' ')}
                      onClick={() => {
                        switchTab(tab.id)
                        setOverflowOpen(false)
                      }}
                      onContextMenu={(event) => {
                        event.preventDefault()
                        switchTab(tab.id)
                        setOverflowOpen(false)
                        setContextMenu({ tabId: tab.id, x: event.clientX, y: event.clientY })
                      }}
                    >
                      <span className="min-w-0 flex-1 truncate" title={tab.filePath ?? tab.title}>
                        {tab.title}
                      </span>
                      {tab.isDirty ? (
                        <span
                          className="shrink-0 text-blue-600 dark:text-blue-400"
                          title="Não salvo"
                        >
                          •
                        </span>
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        aria-label="Nova aba"
        title="Nova aba"
        className="flex shrink-0 items-center px-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
        onClick={() => createNewTab()}
      >
        <Plus size={14} />
      </button>

      {contextMenu && contextItems.length > 0 ? (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextItems}
          onClose={() => setContextMenu(null)}
          menuRef={contextRef}
        />
      ) : null}
    </div>
  )
}

export default TabBar
