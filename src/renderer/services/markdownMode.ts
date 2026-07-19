import { useTabsStore } from '../store/useTabsStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useUiStore } from '../store/useUiStore'
import { showToast } from '../store/useToastStore'

/**
 * Switch a tab to Markdown or Plain Text and keep the editor/preview in sync.
 *
 * - Updates `isMarkdown` (Monaco language reacts via Editor effect)
 * - Optionally enables Split View / Preview when turning Markdown on
 */
export function applyMarkdownMode(tabId: string, enabled: boolean): void {
  const store = useTabsStore.getState()
  const tab = store.tabs.find((t) => t.id === tabId)
  if (!tab) return

  if (tab.isMarkdown === enabled) return

  store.setMarkdownMode(tabId, enabled)

  if (enabled) {
    const autoPreview = useSettingsStore.getState().autoEnablePreviewOnMarkdown
    const ui = useUiStore.getState()
    if (autoPreview && !ui.splitPreview) {
      ui.setSplitPreview(true)
      showToast('Modo Markdown — Preview ativado.', 'info')
    } else {
      showToast('Formato: Markdown (.md ao salvar).', 'info')
    }
  } else {
    showToast('Formato: Plain Text (.txt ao salvar).', 'info')
  }
}

export function toggleMarkdownModeForTab(tabId: string): void {
  const tab = useTabsStore.getState().tabs.find((t) => t.id === tabId)
  if (!tab) return
  applyMarkdownMode(tabId, !tab.isMarkdown)
}

export function toggleActiveTabMarkdownMode(): void {
  const tab = useTabsStore.getState().getActiveTab()
  if (!tab) return
  applyMarkdownMode(tab.id, !tab.isMarkdown)
}
