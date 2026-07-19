import { useEffect, useRef, useState } from 'react'
import { ListTree, PanelRightClose } from 'lucide-react'
import { useTabsStore } from '../store/useTabsStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { extractMarkdownOutline, type OutlineHeading } from '../utils/markdownOutline'
import { revealInEditor } from '../services/editorCommands'
import { DEFAULT_OUTLINE_WIDTH, MAX_OUTLINE_WIDTH, MIN_OUTLINE_WIDTH } from '../../shared/settings'

const OUTLINE_DEBOUNCE_MS = 150

interface OutlinePanelProps {
  /** Called when user collapses via the header button */
  onCollapse?: () => void
}

/**
 * Heading outline (TOC) — sits on the **right** of the Markdown Preview.
 * Click → reveal line in Monaco. Content is debounced for performance.
 */
function OutlinePanel({ onCollapse }: OutlinePanelProps): React.JSX.Element {
  const content = useTabsStore((state) => {
    const tab = state.tabs.find((item) => item.id === state.activeTabId)
    return tab?.content ?? ''
  })
  const outlineWidth = useSettingsStore((s) => s.outlineWidth)
  const updateSettings = useSettingsStore((s) => s.updateSettings)
  const draggingRef = useRef(false)

  const [headings, setHeadings] = useState<OutlineHeading[]>(() => extractMarkdownOutline(content))

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHeadings(extractMarkdownOutline(content))
    }, OUTLINE_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [content])

  const width = Math.min(
    MAX_OUTLINE_WIDTH,
    Math.max(MIN_OUTLINE_WIDTH, outlineWidth || DEFAULT_OUTLINE_WIDTH)
  )

  const onResizePointerDown = (event: React.PointerEvent<HTMLDivElement>): void => {
    event.preventDefault()
    event.stopPropagation()
    draggingRef.current = true
    const startX = event.clientX
    const startW = width

    const onMove = (e: PointerEvent): void => {
      if (!draggingRef.current) return
      // Left edge of outline: drag left → wider
      const delta = startX - e.clientX
      const next = Math.min(MAX_OUTLINE_WIDTH, Math.max(MIN_OUTLINE_WIDTH, startW + delta))
      void updateSettings({ outlineWidth: Math.round(next) })
    }
    const onUp = (): void => {
      draggingRef.current = false
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <aside
      className="outline-panel relative flex shrink-0 flex-col border-l border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/80"
      aria-label="Outline"
      style={{ width }}
    >
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Redimensionar Outline"
        title="Arraste para redimensionar"
        className="absolute top-0 bottom-0 left-0 z-10 w-1 cursor-col-resize bg-transparent hover:bg-blue-400/60"
        onPointerDown={onResizePointerDown}
      />

      <div className="flex shrink-0 items-center justify-between gap-1 border-b border-zinc-100 px-2 py-1.5 dark:border-zinc-800">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-zinc-500">
          <ListTree size={12} aria-hidden />
          Outline
        </span>
        {onCollapse ? (
          <button
            type="button"
            className="rounded p-0.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            title="Ocultar Outline (⌘⇧O)"
            aria-label="Ocultar Outline"
            onClick={onCollapse}
          >
            <PanelRightClose size={12} />
          </button>
        ) : null}
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
                  title={`Ir para linha ${h.lineNumber} no editor`}
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
