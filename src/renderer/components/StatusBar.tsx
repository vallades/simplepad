import { useTabsStore } from '../store/useTabsStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useUiStore } from '../store/useUiStore'
import { useWorkspaceStore } from '../store/useWorkspaceStore'
import { countWords, shortenPath } from '../utils/fileUtils'
import { exportActiveAsHtml } from '../services/exportActions'
import { dispatchEditorCommand } from '../services/editorCommands'
import { toggleMarkdownModeForTab } from '../services/markdownMode'
import { openWorkspaceFromDialog } from '../services/workspaceActions'

interface StatusBarProps {
  onOpenSearchTabs?: () => void
  onExportPdf?: () => void
}

/**
 * Minimal status bar: cursor, counts, dirty, path, preview, export, encoding.
 */
function StatusBar({ onOpenSearchTabs, onExportPdf }: StatusBarProps): React.JSX.Element {
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
  const activeTabId = useTabsStore((state) => state.activeTabId)
  const line = useTabsStore((state) => {
    const tab = state.tabs.find((item) => item.id === state.activeTabId)
    return tab?.cursorPosition.lineNumber ?? 1
  })
  const col = useTabsStore((state) => {
    const tab = state.tabs.find((item) => item.id === state.activeTabId)
    return tab?.cursorPosition.column ?? 1
  })

  const autoSaveEnabled = useSettingsStore((state) => state.autoSaveEnabled)
  const autoSaveIntervalSeconds = useSettingsStore((state) => state.autoSaveIntervalSeconds)
  const showMarkdownOutline = useSettingsStore((state) => state.showMarkdownOutline)
  const showMarkdownProperties = useSettingsStore((state) => state.showMarkdownProperties)
  const updateSettings = useSettingsStore((state) => state.updateSettings)
  const splitPreview = useUiStore((state) => state.splitPreview)
  const toggleSplitPreview = useUiStore((state) => state.toggleSplitPreview)
  const workspaceName = useWorkspaceStore((state) => state.name)
  const workspaceRoot = useWorkspaceStore((state) => state.rootPath)

  const words = countWords(content)
  const chars = content.length
  const displayName = title ?? '—'
  const pathTooltip = filePath ?? title ?? undefined

  return (
    <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-0.5">
        <button
          type="button"
          className={[
            'max-w-[140px] truncate rounded px-1.5 py-0.5 font-medium hover:bg-zinc-200 dark:hover:bg-zinc-800',
            workspaceRoot
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              : 'text-zinc-500'
          ].join(' ')}
          title={
            workspaceRoot
              ? `Workspace: ${workspaceRoot}\nClique para abrir outra pasta`
              : 'Workspace Pessoal (sem pasta). Clique para abrir pasta…'
          }
          onClick={() => void openWorkspaceFromDialog()}
        >
          📁 {workspaceName}
        </button>
        <span className="tabular-nums">
          Ln {line}, Col {col}
        </span>
        <span>
          {words} palavra{words === 1 ? '' : 's'}
        </span>
        <span>
          {chars} caractere{chars === 1 ? '' : 's'}
        </span>
        <span
          className={
            dirty
              ? 'font-medium text-amber-600 dark:text-amber-400'
              : 'text-emerald-600 dark:text-emerald-400'
          }
          title={
            dirty ? 'Há alterações não salvas neste arquivo' : 'Arquivo sincronizado com o disco'
          }
        >
          {dirty ? 'Não salvo' : 'Salvo'}
        </span>
        <span
          title={autoSaveEnabled ? `Intervalo: ${autoSaveIntervalSeconds}s` : 'Auto-save desligado'}
        >
          Auto-save: {autoSaveEnabled ? 'ligado' : 'desligado'}
        </span>
        {splitPreview ? (
          <span
            className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300"
            title="Split View ativo — Editor | Preview"
          >
            ● Preview
          </span>
        ) : null}
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <button
          type="button"
          className="rounded px-1.5 py-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-800"
          title="Localizar (Ctrl/Cmd+F)"
          onClick={() => dispatchEditorCommand('find')}
        >
          Localizar
        </button>
        <button
          type="button"
          className="rounded px-1.5 py-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-800"
          title="Ir para linha (Ctrl/Cmd+G)"
          onClick={() => dispatchEditorCommand('go-to-line')}
        >
          Linha
        </button>
        <button
          type="button"
          className="rounded px-1.5 py-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-800"
          title="Buscar em todas as abas (Ctrl/Cmd+Shift+F)"
          onClick={() => onOpenSearchTabs?.()}
        >
          Abas
        </button>
        <button
          type="button"
          className={[
            'inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium hover:bg-zinc-200 dark:hover:bg-zinc-800',
            isMarkdown
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
              : 'text-zinc-600 dark:text-zinc-400'
          ].join(' ')}
          title={
            isMarkdown
              ? 'Formato Markdown — Preview renderiza #, listas, etc. Ao salvar, sugere .md. Clique para Plain Text. (⌘⇧M)'
              : 'Formato Plain Text — texto simples. Clique para Markdown (ativa Preview e sugere .md ao salvar). (⌘⇧M)'
          }
          aria-pressed={isMarkdown}
          onClick={() => {
            if (activeTabId) toggleMarkdownModeForTab(activeTabId)
          }}
        >
          {isMarkdown ? 'Markdown' : 'Plain Text'}
        </button>
        <button
          type="button"
          className={[
            'rounded px-1.5 py-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-800',
            splitPreview ? 'text-blue-600 dark:text-blue-400' : ''
          ].join(' ')}
          title="Split View / Preview (⌘⇧P)"
          onClick={() => toggleSplitPreview()}
        >
          Preview
        </button>
        {isMarkdown && splitPreview ? (
          <>
            <button
              type="button"
              className={[
                'rounded px-1.5 py-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-800',
                showMarkdownProperties ? 'text-blue-600 dark:text-blue-400' : ''
              ].join(' ')}
              title={
                showMarkdownProperties
                  ? 'Ocultar Properties (YAML) — ⌘⇧Y'
                  : 'Mostrar Properties no Preview — ⌘⇧Y'
              }
              aria-pressed={showMarkdownProperties}
              onClick={() => {
                void updateSettings({ showMarkdownProperties: !showMarkdownProperties })
              }}
            >
              Props
            </button>
            <button
              type="button"
              className={[
                'rounded px-1.5 py-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-800',
                showMarkdownOutline ? 'text-blue-600 dark:text-blue-400' : ''
              ].join(' ')}
              title={
                showMarkdownOutline
                  ? 'Ocultar Outline (direita do Preview) — ⌘⇧O'
                  : 'Mostrar Outline à direita do Preview — ⌘⇧O'
              }
              aria-pressed={showMarkdownOutline}
              onClick={() => {
                void updateSettings({ showMarkdownOutline: !showMarkdownOutline })
              }}
            >
              Outline
            </button>
          </>
        ) : null}
        <button
          type="button"
          className="rounded px-1.5 py-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-800"
          title="Exportar HTML"
          onClick={() => void exportActiveAsHtml()}
        >
          HTML
        </button>
        <button
          type="button"
          className="rounded px-1.5 py-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-800"
          title="Exportar PDF (opções)"
          onClick={() => onExportPdf?.()}
        >
          PDF
        </button>
        <span className="max-w-[200px] truncate" title={pathTooltip}>
          {displayName}
          {filePath ? <span className="text-zinc-400"> · {shortenPath(filePath)}</span> : null}
        </span>
        <span title="Codificação de leitura/escrita">UTF-8</span>
      </div>
    </footer>
  )
}

export default StatusBar
