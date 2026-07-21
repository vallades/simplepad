import { useRef } from 'react'
import { Files, History, ListTree, Search } from 'lucide-react'
import type { SidePanelViewId } from '../../shared/settings'

export interface ActivityBarItem {
  id: SidePanelViewId
  label: string
  comingSoon?: boolean
}

/** Fixed order: Explorer is always first */
export const ACTIVITY_BAR_ITEMS: readonly ActivityBarItem[] = [
  { id: 'explorer', label: 'Explorador' },
  { id: 'outline', label: 'Outline' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'search', label: 'Busca' }
] as const

interface ActivityBarProps {
  activeView: SidePanelViewId
  collapsed: boolean
  onSelect: (view: SidePanelViewId) => void
  onToggleCollapse: () => void
}

function ActivityBarIcon({
  item,
  active,
  collapsed,
  onSelect,
  onToggleCollapse
}: {
  item: ActivityBarItem
  active: boolean
  collapsed: boolean
  onSelect: (view: SidePanelViewId) => void
  onToggleCollapse: () => void
}): React.JSX.Element {
  const lastClickRef = useRef(0)
  const timerRef = useRef<number | null>(null)

  const Icon =
    item.id === 'explorer'
      ? Files
      : item.id === 'outline'
        ? ListTree
        : item.id === 'timeline'
          ? History
          : Search

  const handleClick = (): void => {
    const now = Date.now()
    if (now - lastClickRef.current < 350) {
      // Double click → collapse panel
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current)
        timerRef.current = null
      }
      lastClickRef.current = 0
      onToggleCollapse()
      return
    }
    lastClickRef.current = now
    if (timerRef.current != null) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null
      onSelect(item.id)
    }, 280)
  }

  return (
    <button
      type="button"
      className={[
        'activity-bar-item',
        active && !collapsed ? 'activity-bar-item--active' : '',
        item.comingSoon ? 'activity-bar-item--soon' : ''
      ]
        .filter(Boolean)
        .join(' ')}
      title={
        item.comingSoon
          ? `${item.label} (em breve)`
          : active && !collapsed
            ? `${item.label} — duplo clique para recolher`
            : item.label
      }
      aria-label={item.label}
      aria-pressed={active && !collapsed}
      onClick={handleClick}
    >
      <span className="activity-bar-item__indicator" aria-hidden />
      <Icon size={22} strokeWidth={1.75} aria-hidden />
    </button>
  )
}

/**
 * VS Code–style vertical Activity Bar (fixed ~48px).
 * First icon is always File Explorer.
 */
function ActivityBar({
  activeView,
  collapsed,
  onSelect,
  onToggleCollapse
}: ActivityBarProps): React.JSX.Element {
  return (
    <nav className="activity-bar" aria-label="Activity Bar">
      <div className="activity-bar__top">
        {ACTIVITY_BAR_ITEMS.map((item) => (
          <ActivityBarIcon
            key={item.id}
            item={item}
            active={activeView === item.id}
            collapsed={collapsed}
            onSelect={onSelect}
            onToggleCollapse={onToggleCollapse}
          />
        ))}
      </div>
    </nav>
  )
}

export default ActivityBar
