import { useTabsStore } from '../store/useTabsStore'
import { countWords } from '../utils/fileUtils'

/**
 * Minimal status bar: cursor, counts, dirty flag, path when available.
 */
function StatusBar(): React.JSX.Element {
  const title = useTabsStore((state) => {
    const tab = state.tabs.find((item) => item.id === state.activeTabId)
    return tab?.title
  })
  const filePath = useTabsStore((state) => {
    const tab = state.tabs.find((item) => item.id === state.activeTabId)
    return tab?.filePath
  })
  const content = useTabsStore((state) => {
    const tab = state.tabs.find((item) => item.id === state.activeTabId)
    return tab?.content ?? ''
  })
  const isMarkdown = useTabsStore((state) => {
    const tab = state.tabs.find((item) => item.id === state.activeTabId)
    return tab?.isMarkdown ?? false
  })
  const dirty = useTabsStore((state) => {
    const tab = state.tabs.find((item) => item.id === state.activeTabId)
    return tab?.isDirty ?? false
  })
  const line = useTabsStore((state) => {
    const tab = state.tabs.find((item) => item.id === state.activeTabId)
    return tab?.cursorPosition.lineNumber ?? 1
  })
  const col = useTabsStore((state) => {
    const tab = state.tabs.find((item) => item.id === state.activeTabId)
    return tab?.cursorPosition.column ?? 1
  })

  const words = countWords(content)
  const chars = content.length
  const mode = isMarkdown ? 'Markdown' : 'Plain Text'
  const locationLabel = filePath ?? title ?? '—'

  return (
    <footer className="flex shrink-0 items-center justify-between border-t border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex min-w-0 items-center gap-3">
        <span className="tabular-nums">
          Ln {line}, Col {col}
        </span>
        <span>
          {words} palavra{words === 1 ? '' : 's'}
        </span>
        <span>{chars} caracteres</span>
        <span
          className={
            dirty ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
          }
        >
          {dirty ? 'Não salvo' : 'Salvo'}
        </span>
      </div>
      <div className="flex min-w-0 items-center gap-3">
        <span className="max-w-[320px] truncate" title={filePath ?? title}>
          {locationLabel}
        </span>
        <span>{mode}</span>
        <span>UTF-8</span>
      </div>
    </footer>
  )
}

export default StatusBar
