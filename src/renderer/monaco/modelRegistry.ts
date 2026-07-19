import type * as Monaco from 'monaco-editor'
import type { Tab } from '../types/tab'
import { resolveLanguage, type EditorLanguage } from '../utils/monacoUtils'
import { getEditorDocumentText } from '../utils/frontmatter'

/** In-memory models keyed by tab id — preserves Undo/Redo across tab switches. */
const models = new Map<string, Monaco.editor.ITextModel>()

/** Editor view states (cursor, selection, scroll) kept only for the current session. */
const viewStates = new Map<string, Monaco.editor.ICodeEditorViewState | null>()

function modelUri(monacoApi: typeof Monaco, tabId: string): Monaco.Uri {
  return monacoApi.Uri.parse(`inmemory://simplepad/tab/${tabId}`)
}

export function getLanguageForTab(
  tab: Pick<Tab, 'isMarkdown' | 'filePath' | 'title'>
): EditorLanguage {
  if (tab.isMarkdown) return 'markdown'
  if (tab.filePath) return resolveLanguage(tab.filePath)
  return resolveLanguage(tab.title)
}

/**
 * Returns an existing model for the tab or creates one from store content.
 * Does not overwrite an existing model value (protects undo stack).
 */
export function getOrCreateTabModel(monacoApi: typeof Monaco, tab: Tab): Monaco.editor.ITextModel {
  const language = getLanguageForTab(tab)
  const existing = models.get(tab.id)

  if (existing && !existing.isDisposed()) {
    if (existing.getLanguageId() !== language) {
      monacoApi.editor.setModelLanguage(existing, language)
    }
    return existing
  }

  const uri = modelUri(monacoApi, tab.id)
  // Dispose any orphan model with the same URI (HMR / remount edge cases)
  const orphan = monacoApi.editor.getModel(uri)
  if (orphan && !orphan.isDisposed()) {
    orphan.dispose()
  }

  // Markdown: editor shows body only (YAML frontmatter hidden but kept in tab.content)
  const initial = getEditorDocumentText(tab.content, tab.isMarkdown)
  const model = monacoApi.editor.createModel(initial, language, uri)
  models.set(tab.id, model)
  return model
}

/**
 * Syncs model text from the store only when it diverges (e.g. external load).
 * Prefer avoiding this while the user is typing — it resets the undo stack.
 * Markdown models use body-only text (frontmatter stripped for editing).
 */
export function syncModelContentFromTab(
  monacoApi: typeof Monaco,
  model: Monaco.editor.ITextModel,
  tab: Tab
): void {
  const editorText = getEditorDocumentText(tab.content, tab.isMarkdown)
  if (model.getValue() !== editorText) {
    model.setValue(editorText)
  }
  const language = getLanguageForTab(tab)
  if (model.getLanguageId() !== language) {
    monacoApi.editor.setModelLanguage(model, language)
  }
}

export function saveViewState(tabId: string, editor: Monaco.editor.IStandaloneCodeEditor): void {
  viewStates.set(tabId, editor.saveViewState())
}

export function restoreViewState(
  tabId: string,
  editor: Monaco.editor.IStandaloneCodeEditor
): boolean {
  const state = viewStates.get(tabId)
  if (!state) return false
  editor.restoreViewState(state)
  return true
}

export function disposeTabModel(tabId: string): void {
  const model = models.get(tabId)
  if (model && !model.isDisposed()) {
    model.dispose()
  }
  models.delete(tabId)
  viewStates.delete(tabId)
}

/** Dispose models for tabs that are no longer open. */
export function disposeModelsExcept(openTabIds: ReadonlySet<string>): void {
  for (const tabId of [...models.keys()]) {
    if (!openTabIds.has(tabId)) {
      disposeTabModel(tabId)
    }
  }
}

/** Test / HMR helper */
export function clearAllModels(): void {
  for (const tabId of [...models.keys()]) {
    disposeTabModel(tabId)
  }
}

export function getRegisteredModelCount(): number {
  return models.size
}

export function hasModel(tabId: string): boolean {
  const model = models.get(tabId)
  return Boolean(model && !model.isDisposed())
}
