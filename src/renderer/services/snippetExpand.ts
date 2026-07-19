/**
 * Apply snippet expansion at a model offset (Monaco or plain textarea).
 */

import { expandSnippetBody, matchSnippetTrigger, type TextSnippet } from '../../shared/snippets'

export interface SnippetExpandResult {
  /** Full document text after expansion */
  nextText: string
  /** Absolute cursor offset after expansion */
  cursorOffset: number
  /** Trigger that was expanded */
  trigger: string
}

/**
 * Try to expand a snippet ending at `cursorOffset` in `text`.
 * Returns null if no trigger matches.
 */
export function tryExpandSnippetAtCursor(
  text: string,
  cursorOffset: number,
  snippets: TextSnippet[],
  now = new Date()
): SnippetExpandResult | null {
  const safeOffset = Math.max(0, Math.min(cursorOffset, text.length))
  const prefix = text.slice(0, safeOffset)
  const match = matchSnippetTrigger(prefix, snippets)
  if (!match) return null

  const { snippet, triggerStart } = match
  const { text: inserted, cursorOffset: relCursor } = expandSnippetBody(snippet.body, now)
  const nextText = text.slice(0, triggerStart) + inserted + text.slice(safeOffset)
  return {
    nextText,
    cursorOffset: triggerStart + relCursor,
    trigger: snippet.trigger
  }
}
