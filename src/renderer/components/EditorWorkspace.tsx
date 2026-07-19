import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useUiStore } from '../store/useUiStore'
import { useSettingsStore } from '../store/useSettingsStore'
import { useTabsStore } from '../store/useTabsStore'
import { EditorErrorBoundary } from './EditorErrorBoundary'
import { MAX_SPLIT_RATIO, MIN_SPLIT_RATIO } from '../../shared/settings'

const Editor = lazy(() => import('./Editor'))
const PreviewPanel = lazy(() => import('./PreviewPanel'))
const OutlinePanel = lazy(() => import('./OutlinePanel'))

function EditorFallback(): React.JSX.Element {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-zinc-400">
      Carregando editor…
    </div>
  )
}

/**
 * Editor workspace with optional resizable split (Editor | Preview).
 * Ratio and orientation persist via settings store.
 */
function EditorWorkspace(): React.JSX.Element {
  const splitPreview = useUiStore((state) => state.splitPreview)
  const splitRatio = useSettingsStore((state) => state.splitRatio)
  const splitOrientation = useSettingsStore((state) => state.splitOrientation)
  const showMarkdownOutline = useSettingsStore((state) => state.showMarkdownOutline)
  const updateSettings = useSettingsStore((state) => state.updateSettings)
  const isMarkdown = useTabsStore((state) => {
    const tab = state.tabs.find((item) => item.id === state.activeTabId)
    return tab?.isMarkdown ?? false
  })
  const showOutline = splitPreview && isMarkdown && showMarkdownOutline

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
        className={[
          'flex min-h-0 min-w-0',
          splitPreview ? 'flex-none' : 'flex-1',
          showOutline ? 'flex-row' : 'flex-col'
        ].join(' ')}
        style={
          splitPreview
            ? isHorizontal
              ? { width: editorFlex, height: '100%' }
              : { height: editorFlex, width: '100%' }
            : undefined
        }
      >
        {showOutline ? (
          <Suspense fallback={null}>
            <OutlinePanel />
          </Suspense>
        ) : null}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <EditorErrorBoundary>
            <Suspense fallback={<EditorFallback />}>
              <Editor />
            </Suspense>
          </EditorErrorBoundary>
        </div>
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
