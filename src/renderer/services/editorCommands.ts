/**
 * Lightweight command bus between UI/menu and the Monaco Editor instance.
 * Editor registers a handler; menus/status bar dispatch commands.
 */

export type EditorCommand =
  | 'find'
  | 'replace'
  | 'go-to-line'
  | { type: 'reveal'; lineNumber: number; column: number; smooth?: boolean }

type Handler = (command: EditorCommand) => void

let handler: Handler | null = null

export function registerEditorCommandHandler(next: Handler | null): void {
  handler = next
}

export function dispatchEditorCommand(command: EditorCommand): boolean {
  if (!handler) return false
  handler(command)
  return true
}

export function revealInEditor(
  lineNumber: number,
  column: number,
  options?: { smooth?: boolean }
): boolean {
  return dispatchEditorCommand({
    type: 'reveal',
    lineNumber,
    column,
    smooth: options?.smooth ?? true
  })
}
