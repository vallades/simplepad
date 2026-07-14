import { lazy, Suspense } from 'react'
import { useUiStore } from '../store/useUiStore'
import { EditorErrorBoundary } from './EditorErrorBoundary'

const Editor = lazy(() => import('./Editor'))
const PreviewPanel = lazy(() => import('./PreviewPanel'))

function EditorFallback(): React.JSX.Element {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-zinc-400">
      Carregando editor…
    </div>
  )
}

/**
 * Full-width editor or horizontal split (Editor | Preview).
 * Monaco stays mounted when toggling preview so undo stack is preserved.
 */
function EditorWorkspace(): React.JSX.Element {
  const splitPreview = useUiStore((state) => state.splitPreview)

  return (
    <div className={['flex min-h-0 flex-1', splitPreview ? 'flex-row' : 'flex-col'].join(' ')}>
      <div
        className={[
          'flex min-h-0 min-w-0 flex-col',
          splitPreview ? 'w-1/2 flex-none border-r border-zinc-200 dark:border-zinc-800' : 'flex-1'
        ].join(' ')}
      >
        <EditorErrorBoundary>
          <Suspense fallback={<EditorFallback />}>
            <Editor />
          </Suspense>
        </EditorErrorBoundary>
      </div>

      {splitPreview ? (
        <Suspense
          fallback={
            <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-zinc-400">
              Carregando preview…
            </div>
          }
        >
          <PreviewPanel />
        </Suspense>
      ) : null}
    </div>
  )
}

export default EditorWorkspace
