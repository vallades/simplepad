import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useUiStore } from '../store/useUiStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { EditorErrorBoundary } from './EditorErrorBoundary'
import { MAX_SPLIT_RATIO, MIN_SPLIT_RATIO } from '../../shared/settings'

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
 * Workspace layout:
 *   [ Editor ] | [ Preview content | Outline (right of preview) ]
 *
 * Outline is owned by PreviewPanel so it stays anchored to the right of the Preview.
 */
function EditorWorkspace(): React.JSX.Element {
  const splitPreview = useUiStore((state) => state.splitPreview)
  const splitRatio = useSettingsStore((state) => state.splitRatio)
  const splitOrientation = useSettingsStore((state) => state.splitOrientation)
  const updateSettings = useSettingsStore((state) => state.updateSettings)

  const containerRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const [dragRatio, setDragRatio] = useState<number | null>(null)

  const ratio = dragRatio ?? splitRatio

  const onPointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>): void => {
    event.preventDefault()
    draggingRef.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [])

  const onPointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>): void => {
      if (!draggingRef.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      let next: number
      if (splitOrientation === 'horizontal') {
        next = (event.clientX - rect.left) / rect.width
      } else {
        next = (event.clientY - rect.top) / rect.height
      }
      next = Math.min(MAX_SPLIT_RATIO, Math.max(MIN_SPLIT_RATIO, next))
      setDragRatio(next)
    },
    [splitOrientation]
  )

  const endDrag = useCallback((): void => {
    if (!draggingRef.current) return
    draggingRef.current = false
    setDragRatio((current) => {
      if (current != null) {
        void updateSettings({ splitRatio: current })
      }
      return null
    })
  }, [updateSettings])

  useEffect(() => {
    const onUp = (): void => {
      if (draggingRef.current) endDrag()
    }
    window.addEventListener('pointerup', onUp)
    return () => window.removeEventListener('pointerup', onUp)
  }, [endDrag])

  const isHorizontal = splitOrientation === 'horizontal'
  const editorFlex = splitPreview ? `${ratio * 100}%` : undefined

  return (
    <div
      ref={containerRef}
      className={[
        'flex min-h-0 flex-1',
        splitPreview ? (isHorizontal ? 'flex-row' : 'flex-col') : 'flex-col'
      ].join(' ')}
    >
      <div
        className={['flex min-h-0 min-w-0 flex-col', splitPreview ? 'flex-none' : 'flex-1'].join(
          ' '
        )}
        style={
          splitPreview
            ? isHorizontal
              ? { width: editorFlex, height: '100%' }
              : { height: editorFlex, width: '100%' }
            : undefined
        }
      >
        <EditorErrorBoundary>
          <Suspense fallback={<EditorFallback />}>
            <Editor />
          </Suspense>
        </EditorErrorBoundary>
      </div>

      {splitPreview ? (
        <>
          <div
            role="separator"
            aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
            aria-label="Redimensionar painéis"
            title="Arraste para redimensionar"
            className={[
              'z-10 shrink-0 bg-zinc-200 transition-colors hover:bg-blue-400 dark:bg-zinc-700 dark:hover:bg-blue-600',
              isHorizontal ? 'w-1 cursor-col-resize' : 'h-1 cursor-row-resize'
            ].join(' ')}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          />
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <Suspense
              fallback={
                <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-zinc-400">
                  Carregando preview…
                </div>
              }
            >
              <PreviewPanel />
            </Suspense>
          </div>
        </>
      ) : null}
    </div>
  )
}

export default EditorWorkspace
