/**
 * Monaco decorations + Ctrl/Cmd+Click for [[wiki links]].
 */

import type * as Monaco from 'monaco-editor'
import { extractWikiLinks } from '../../shared/wikiLinks'
import { openWikiLink } from '../services/wikiLinkActions'

let linkDisposable: Monaco.IDisposable | null = null
let mouseDisposable: Monaco.IDisposable | null = null
let styleInjected = false

function ensureWikiLinkStyles(): void {
  if (styleInjected || typeof document === 'undefined') return
  styleInjected = true
  const style = document.createElement('style')
  style.textContent = `
    .simplepad-wiki-link {
      color: #2563eb !important;
      text-decoration: underline;
      text-decoration-style: dotted;
      text-underline-offset: 2px;
      cursor: pointer;
    }
    .dark .simplepad-wiki-link,
    .vs-dark .simplepad-wiki-link {
      color: #60a5fa !important;
    }
  `
  document.head.appendChild(style)
}

function applyWikiDecorations(
  monacoApi: typeof Monaco,
  editor: Monaco.editor.IStandaloneCodeEditor,
  decorationIds: string[]
): string[] {
  const model = editor.getModel()
  if (!model) return editor.deltaDecorations(decorationIds, [])

  const text = model.getValue()
  const links = extractWikiLinks(text)
  const decorations: Monaco.editor.IModelDeltaDecoration[] = links.map((link) => {
    const start = model.getPositionAt(link.start)
    const end = model.getPositionAt(link.end)
    return {
      range: new monacoApi.Range(start.lineNumber, start.column, end.lineNumber, end.column),
      options: {
        inlineClassName: 'simplepad-wiki-link',
        hoverMessage: { value: `Abrir nota: **${link.target}** (Ctrl/Cmd+clique)` },
        stickiness: monacoApi.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
      }
    }
  })
  return editor.deltaDecorations(decorationIds, decorations)
}

/**
 * Attach wiki-link decorations and click handler to a Monaco editor instance.
 * Returns a dispose function.
 */
export function attachWikiLinkSupport(
  monacoApi: typeof Monaco,
  editor: Monaco.editor.IStandaloneCodeEditor
): () => void {
  ensureWikiLinkStyles()
  let decorationIds: string[] = []

  const refresh = (): void => {
    decorationIds = applyWikiDecorations(monacoApi, editor, decorationIds)
  }

  refresh()

  const contentDisp = editor.onDidChangeModelContent(() => refresh())
  const modelDisp = editor.onDidChangeModel(() => refresh())

  mouseDisposable?.dispose()
  mouseDisposable = editor.onMouseDown((e) => {
    if (!e.event.ctrlKey && !e.event.metaKey) return
    if (e.target.type !== monacoApi.editor.MouseTargetType.CONTENT_TEXT) return
    const model = editor.getModel()
    const pos = e.target.position
    if (!model || !pos) return
    const offset = model.getOffsetAt(pos)
    const text = model.getValue()
    const links = extractWikiLinks(text)
    const hit = links.find((l) => offset >= l.start && offset < l.end)
    if (!hit) return
    e.event.preventDefault()
    e.event.stopPropagation()
    void openWikiLink(hit.target)
  })

  // Keep reference for HMR cleanup
  linkDisposable?.dispose()
  linkDisposable = {
    dispose: () => {
      contentDisp.dispose()
      modelDisp.dispose()
      mouseDisposable?.dispose()
      mouseDisposable = null
      decorationIds = editor.deltaDecorations(decorationIds, [])
    }
  }

  return () => linkDisposable?.dispose()
}
