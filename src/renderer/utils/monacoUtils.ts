import type { editor } from 'monaco-editor'

/**
 * Monaco Editor helpers — language resolution and default options.
 */

export type EditorLanguage = 'plaintext' | 'markdown'

export const DEFAULT_FONT_SIZE = 14

export const EDITOR_FONT_FAMILY = 'Consolas, Menlo, monospace'

export function resolveLanguage(fileNameOrFlag: string | boolean): EditorLanguage {
  if (typeof fileNameOrFlag === 'boolean') {
    return fileNameOrFlag ? 'markdown' : 'plaintext'
  }

  const lower = fileNameOrFlag.toLowerCase()
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) {
    return 'markdown'
  }
  return 'plaintext'
}

/** Minimalist Notepad-like Monaco options (single shared editor instance). */
export function getDefaultEditorOptions(
  fontSize = DEFAULT_FONT_SIZE
): editor.IStandaloneEditorConstructionOptions {
  return {
    fontSize,
    fontFamily: EDITOR_FONT_FAMILY,
    fontLigatures: false,
    lineNumbers: 'on',
    lineNumbersMinChars: 3,
    glyphMargin: false,
    folding: true,
    minimap: { enabled: false },
    wordWrap: 'on',
    automaticLayout: true,
    scrollBeyondLastLine: false,
    renderLineHighlight: 'line',
    renderWhitespace: 'none',
    tabSize: 2,
    insertSpaces: true,
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    contextmenu: true,
    quickSuggestions: false,
    suggestOnTriggerCharacters: false,
    wordBasedSuggestions: 'off',
    parameterHints: { enabled: false },
    hover: { enabled: true, delay: 400 },
    links: true,
    // Clean chrome — hide overview ruler noise
    overviewRulerLanes: 0,
    overviewRulerBorder: false,
    hideCursorInOverviewRuler: true,
    padding: { top: 12, bottom: 12 },
    scrollbar: {
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
      useShadows: false,
      verticalHasArrows: false,
      horizontalHasArrows: false
    },
    find: {
      addExtraSpaceOnTop: false
    },
    // Keep accessibility support on for screen readers
    accessibilitySupport: 'auto'
  }
}

export type MonacoThemeId = 'vs' | 'vs-dark'

export function themeFromColorScheme(isDark: boolean): MonacoThemeId {
  return isDark ? 'vs-dark' : 'vs'
}
