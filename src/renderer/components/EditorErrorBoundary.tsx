import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/**
 * Prevents a Monaco/runtime failure from blanking the whole app shell.
 */
export class EditorErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[SimplePad] Editor crashed:', error, info.componentStack)
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex min-h-0 flex-1 flex-col items-start justify-center gap-2 p-6 text-sm text-zinc-600 dark:text-zinc-300">
          <p className="font-medium text-red-600 dark:text-red-400">Falha ao carregar o editor</p>
          <pre className="max-w-full overflow-auto rounded bg-zinc-100 p-3 text-xs dark:bg-zinc-900">
            {this.state.error.message}
          </pre>
          <button
            type="button"
            className="rounded bg-zinc-900 px-3 py-1.5 text-xs text-white dark:bg-zinc-100 dark:text-zinc-900"
            onClick={() => this.setState({ error: null })}
          >
            Tentar novamente
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
