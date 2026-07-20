/**
 * Minimal shared context menu primitives (explorer + tabs).
 */

export interface ContextMenuItem {
  id: string
  label: string
  disabled?: boolean
  danger?: boolean
  separator?: boolean
  onSelect?: () => void
}

interface ContextMenuProps {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
  menuRef?: React.RefObject<HTMLDivElement | null>
}

function clampMenuPosition(
  x: number,
  y: number,
  width = 220,
  height = 280
): { left: number; top: number } {
  if (typeof window === 'undefined') return { left: x, top: y }
  const left = Math.min(x, Math.max(8, window.innerWidth - width - 8))
  const top = Math.min(y, Math.max(8, window.innerHeight - height - 8))
  return { left, top }
}

function ContextMenu({ x, y, items, onClose, menuRef }: ContextMenuProps): React.JSX.Element {
  const pos = clampMenuPosition(x, y)

  return (
    <div
      ref={menuRef}
      role="menu"
      className="fixed z-[100] min-w-[200px] max-w-[280px] rounded-md border border-zinc-200 bg-white py-1 text-xs shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
      style={{ left: pos.left, top: pos.top }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      {items.map((item) => {
        if (item.separator) {
          return (
            <div
              key={item.id}
              role="separator"
              className="my-1 border-t border-zinc-100 dark:border-zinc-800"
            />
          )
        }
        return (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            className={[
              'flex w-full px-3 py-1.5 text-left transition-colors disabled:cursor-default disabled:opacity-40',
              item.danger
                ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40'
                : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800'
            ].join(' ')}
            onClick={() => {
              if (item.disabled) return
              onClose()
              item.onSelect?.()
            }}
          >
            {item.label}
          </button>
        )
      })}
    </div>
  )
}

export default ContextMenu
