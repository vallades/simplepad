import { useCallback, useRef, useState } from 'react'
import type { SidePanelViewId } from '../../shared/settings'
import { DEFAULT_SIDEBAR_WIDTH, MAX_SIDEBAR_WIDTH, MIN_SIDEBAR_WIDTH } from '../../shared/settings'
import FileExplorerSidebar from './FileExplorerSidebar'
import SideOutlineView from './SideOutlineView'
import SideSearchView from './SideSearchView'
import SideTimelineView from './SideTimelineView'

interface SidePanelProps {
  activeView: SidePanelViewId
  collapsed: boolean
  width: number
  onWidthChange: (width: number) => void
  onCollapse: () => void
}

const VIEW_TITLES: Record<SidePanelViewId, string> = {
  explorer: 'Explorador',
  outline: 'Outline',
  timeline: 'Timeline',
  search: 'Busca'
}

/**
 * Expandable companion column next to the Activity Bar.
 * Width animates via CSS; content swaps by activeView with fade.
 */
function SidePanel({
  activeView,
  collapsed,
  width,
  onWidthChange,
  onCollapse
}: SidePanelProps): React.JSX.Element {
  const [dragWidth, setDragWidth] = useState<number | null>(null)
  const draggingRef = useRef(false)
  const effectiveWidth = dragWidth ?? width ?? DEFAULT_SIDEBAR_WIDTH

  const onResizePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>): void => {
      event.preventDefault()
      draggingRef.current = true
      const startX = event.clientX
      const startW = effectiveWidth
      const onMove = (e: PointerEvent): void => {
        if (!draggingRef.current) return
        const next = Math.min(
          MAX_SIDEBAR_WIDTH,
          Math.max(MIN_SIDEBAR_WIDTH, startW + (e.clientX - startX))
        )
        setDragWidth(next)
      }
      const onUp = (): void => {
        draggingRef.current = false
        setDragWidth((current) => {
          if (current != null) onWidthChange(Math.round(current))
          return null
        })
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
    },
    [effectiveWidth, onWidthChange]
  )

  return (
    <aside
      className={[
        'side-panel',
        collapsed ? 'side-panel--collapsed' : 'side-panel--open',
        dragWidth != null ? 'side-panel--resizing' : ''
      ]
        .filter(Boolean)
        .join(' ')}
      style={
        {
          '--side-panel-width': `${effectiveWidth}px`
        } as React.CSSProperties
      }
      aria-label={VIEW_TITLES[activeView]}
      aria-hidden={collapsed}
    >
      <div className="side-panel__inner">
        <div className="side-panel__content" data-view={activeView} key={activeView}>
          {activeView === 'explorer' ? <FileExplorerSidebar embedded onClose={onCollapse} /> : null}
          {activeView === 'outline' ? <SideOutlineView /> : null}
          {activeView === 'timeline' ? <SideTimelineView /> : null}
          {activeView === 'search' ? <SideSearchView /> : null}
        </div>
      </div>

      {!collapsed ? (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Redimensionar painel"
          title="Arraste para redimensionar"
          className="side-panel__resizer"
          onPointerDown={onResizePointerDown}
        />
      ) : null}
    </aside>
  )
}

export default SidePanel
