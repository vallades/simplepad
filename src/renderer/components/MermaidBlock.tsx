import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Download, Minus, Plus, RotateCcw } from 'lucide-react'
import { useSettingsStore } from '../store/useSettingsStore'
import { useTabsStore } from '../store/useTabsStore'
import { buildMermaidInitConfig, clampMermaidZoom, parseMermaidError } from '../utils/mermaidConfig'
import { exportMermaidPng, exportMermaidSvg } from '../services/mermaidExport'
import { revealInEditor } from '../services/editorCommands'

interface MermaidBlockProps {
  chart: string
}

let mermaidReady: Promise<typeof import('mermaid')> | null = null
let lastInitKey = ''

function loadMermaid(): Promise<typeof import('mermaid')> {
  if (!mermaidReady) {
    mermaidReady = import('mermaid')
  }
  return mermaidReady
}

async function ensureMermaidConfigured(
  isDark: boolean,
  style: { fontSize: number; curve: string; diagramPadding: number }
): Promise<typeof import('mermaid').default> {
  const mod = await loadMermaid()
  const mermaid = mod.default
  const key = `${isDark}|${style.fontSize}|${style.curve}|${style.diagramPadding}`
  if (key !== lastInitKey) {
    const cfg = buildMermaidInitConfig(isDark, {
      fontSize: style.fontSize,
      curve: style.curve as 'basis' | 'linear' | 'cardinal' | 'step',
      diagramPadding: style.diagramPadding
    })
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: cfg.theme,
      themeVariables: cfg.themeVariables,
      flowchart: cfg.flowchart,
      fontFamily: cfg.fontFamily
    })
    lastInitKey = key
  }
  return mermaid
}

function findChartStartLine(doc: string, chart: string): number | undefined {
  const needle = chart.trim()
  if (!needle) return undefined
  const idx = doc.indexOf(needle)
  if (idx < 0) return undefined
  return doc.slice(0, idx).split(/\r?\n/).length
}

/**
 * Mermaid diagram: theme sync, zoom/pan, PNG/SVG export, friendly errors.
 * Lazy-loads mermaid only when a block mounts.
 */
function MermaidBlock({ chart }: MermaidBlockProps): React.JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null)
  const reactId = useId().replace(/:/g, '')
  const source = chart.trim()

  const themePref = useSettingsStore((s) => s.theme)
  const mermaidFontSize = useSettingsStore((s) => s.mermaidFontSize)
  const mermaidCurve = useSettingsStore((s) => s.mermaidCurve)
  const mermaidDiagramPadding = useSettingsStore((s) => s.mermaidDiagramPadding)

  // Track system preference for re-render when theme === 'system'
  const [systemDark, setSystemDark] = useState(
    () =>
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
  )

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (): void => setSystemDark(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const isDark = useMemo(() => {
    if (themePref === 'dark') return true
    if (themePref === 'light') return false
    return systemDark
  }, [themePref, systemDark])

  // Also follow document `.dark` class (applyThemeToDocument)
  const [docDark, setDocDark] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  )
  useEffect(() => {
    if (typeof MutationObserver === 'undefined') return
    const obs = new MutationObserver(() => {
      setDocDark(document.documentElement.classList.contains('dark'))
    })
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => obs.disconnect()
  }, [])

  const resolvedDark = themePref === 'system' ? docDark || isDark : isDark

  const [error, setError] = useState<{ message: string; lineNumber?: number } | null>(null)
  const [done, setDone] = useState(false)
  const [svgMarkup, setSvgMarkup] = useState('')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [exportOpen, setExportOpen] = useState(false)
  const dragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    ox: 0,
    oy: 0
  })

  useEffect(() => {
    let cancelled = false
    if (!source) {
      queueMicrotask(() => {
        if (!cancelled) {
          setDone(true)
          setError(null)
          setSvgMarkup('')
        }
      })
      return () => {
        cancelled = true
      }
    }

    void (async () => {
      try {
        setDone(false)
        lastInitKey = '' // re-init when theme/style changes
        const mermaid = await ensureMermaidConfigured(resolvedDark, {
          fontSize: mermaidFontSize,
          curve: mermaidCurve,
          diagramPadding: mermaidDiagramPadding
        })
        const id = `mermaid-${reactId}-${Math.random().toString(36).slice(2, 8)}`
        const { svg } = await mermaid.render(id, source)
        if (cancelled) return
        if (hostRef.current) {
          hostRef.current.innerHTML = svg
          const svgEl = hostRef.current.querySelector('svg')
          if (svgEl) {
            svgEl.style.maxWidth = 'none'
            svgEl.style.height = 'auto'
          }
        }
        setSvgMarkup(svg)
        setError(null)
        setDone(true)
      } catch (err) {
        if (cancelled) return
        setError(parseMermaidError(err))
        setSvgMarkup('')
        setDone(true)
        if (hostRef.current) hostRef.current.innerHTML = ''
      }
    })()

    return () => {
      cancelled = true
    }
  }, [source, reactId, resolvedDark, mermaidFontSize, mermaidCurve, mermaidDiagramPadding])

  const onWheel = useCallback((event: React.WheelEvent): void => {
    event.preventDefault()
    const delta = event.deltaY > 0 ? -0.1 : 0.1
    setZoom((z) => clampMermaidZoom(z + delta))
  }, [])

  const onPointerDown = (event: React.PointerEvent): void => {
    if (event.button !== 0) return
    dragRef.current = {
      active: true,
      startX: event.clientX,
      startY: event.clientY,
      ox: pan.x,
      oy: pan.y
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event: React.PointerEvent): void => {
    if (!dragRef.current.active) return
    setPan({
      x: dragRef.current.ox + (event.clientX - dragRef.current.startX),
      y: dragRef.current.oy + (event.clientY - dragRef.current.startY)
    })
  }

  const onPointerUp = (event: React.PointerEvent): void => {
    dragRef.current.active = false
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // ignore
    }
  }

  const resetView = (): void => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const goToError = (): void => {
    const doc = useTabsStore.getState().getActiveTab()?.content ?? ''
    const start = findChartStartLine(doc, source)
    if (start == null) return
    const line = error?.lineNumber != null ? start + error.lineNumber - 1 : start
    revealInEditor(Math.max(1, line), 1)
  }

  if (error) {
    return (
      <div className="mermaid-block mermaid-error my-3 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/40">
        <p className="text-[12px] font-medium text-red-700 dark:text-red-300">
          Diagrama Mermaid inválido
          {error.lineNumber != null ? ` (linha ${error.lineNumber} do bloco)` : ''}
        </p>
        <p className="mt-1 text-[11px] text-red-600/90 dark:text-red-400">{error.message}</p>
        <button
          type="button"
          className="mt-2 rounded border border-red-300 px-2 py-0.5 text-[11px] text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
          onClick={goToError}
        >
          Editar código
        </button>
        <pre className="mt-2 max-h-32 overflow-auto rounded bg-white/60 p-2 font-mono text-[10px] text-red-800/80 dark:bg-black/20 dark:text-red-200/80">
          {chart}
        </pre>
      </div>
    )
  }

  return (
    <div className="mermaid-block group relative my-3 overflow-hidden rounded-md border border-zinc-100 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="pointer-events-none absolute top-1 right-1 z-20 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100 focus-within:pointer-events-auto focus-within:opacity-100">
        <button
          type="button"
          className="rounded bg-white/90 p-1 text-zinc-500 shadow-sm ring-1 ring-zinc-200 hover:text-zinc-800 dark:bg-zinc-900/90 dark:ring-zinc-700 dark:hover:text-zinc-200"
          title="Zoom −"
          onClick={() => setZoom((z) => clampMermaidZoom(z - 0.2))}
        >
          <Minus size={12} />
        </button>
        <button
          type="button"
          className="rounded bg-white/90 p-1 text-zinc-500 shadow-sm ring-1 ring-zinc-200 hover:text-zinc-800 dark:bg-zinc-900/90 dark:ring-zinc-700 dark:hover:text-zinc-200"
          title="Zoom +"
          onClick={() => setZoom((z) => clampMermaidZoom(z + 0.2))}
        >
          <Plus size={12} />
        </button>
        <button
          type="button"
          className="rounded bg-white/90 p-1 text-zinc-500 shadow-sm ring-1 ring-zinc-200 hover:text-zinc-800 dark:bg-zinc-900/90 dark:ring-zinc-700 dark:hover:text-zinc-200"
          title="Reset zoom e pan"
          onClick={resetView}
        >
          <RotateCcw size={12} />
        </button>
        <div className="relative">
          <button
            type="button"
            className="rounded bg-white/90 p-1 text-zinc-500 shadow-sm ring-1 ring-zinc-200 hover:text-zinc-800 dark:bg-zinc-900/90 dark:ring-zinc-700 dark:hover:text-zinc-200"
            title="Exportar diagrama"
            onClick={() => setExportOpen((v) => !v)}
          >
            <Download size={12} />
          </button>
          {exportOpen ? (
            <div className="absolute top-full right-0 mt-1 min-w-[120px] rounded-md border border-zinc-200 bg-white py-1 text-[11px] shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
              <button
                type="button"
                className="block w-full px-3 py-1.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
                disabled={!svgMarkup}
                onClick={() => {
                  setExportOpen(false)
                  void exportMermaidPng(svgMarkup)
                }}
              >
                PNG
              </button>
              <button
                type="button"
                className="block w-full px-3 py-1.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
                disabled={!svgMarkup}
                onClick={() => {
                  setExportOpen(false)
                  void exportMermaidSvg(svgMarkup)
                }}
              >
                SVG
              </button>
            </div>
          ) : null}
        </div>
        <span className="rounded bg-white/80 px-1 font-mono text-[10px] text-zinc-400 tabular-nums dark:bg-zinc-900/80">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {!done ? <p className="p-3 text-[11px] text-zinc-400">Renderizando diagrama…</p> : null}

      <div
        className="mermaid-viewport max-h-[480px] min-h-[80px] cursor-grab overflow-hidden active:cursor-grabbing"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="flex origin-center justify-center p-3"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
          }}
        >
          <div ref={hostRef} className="[&_svg]:max-w-none" />
        </div>
      </div>
    </div>
  )
}

export default MermaidBlock
