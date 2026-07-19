import { useEffect, useId, useRef, useState } from 'react'

interface MermaidBlockProps {
  chart: string
}

let mermaidReady: Promise<typeof import('mermaid')> | null = null

function loadMermaid(): Promise<typeof import('mermaid')> {
  if (!mermaidReady) {
    mermaidReady = import('mermaid').then((mod) => {
      const mermaid = mod.default
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif'
      })
      return mod
    })
  }
  return mermaidReady
}

/**
 * Renders a Mermaid diagram from fenced ```mermaid source.
 * Lazy-loads mermaid to keep initial preview light.
 */
function MermaidBlock({ chart }: MermaidBlockProps): React.JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null)
  const reactId = useId().replace(/:/g, '')
  const source = chart.trim()
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!source) {
      queueMicrotask(() => {
        if (!cancelled) setDone(true)
      })
      return () => {
        cancelled = true
      }
    }

    void (async () => {
      try {
        const mod = await loadMermaid()
        const mermaid = mod.default
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default'
        })
        const id = `mermaid-${reactId}-${Math.random().toString(36).slice(2, 8)}`
        const { svg } = await mermaid.render(id, source)
        if (cancelled || !hostRef.current) return
        hostRef.current.innerHTML = svg
        setError(null)
        setDone(true)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
        setDone(true)
        if (hostRef.current) hostRef.current.innerHTML = ''
      }
    })()

    return () => {
      cancelled = true
    }
  }, [source, reactId])

  if (error) {
    return (
      <pre className="overflow-x-auto rounded-md border border-red-200 bg-red-50 p-3 text-[12px] text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
        Mermaid: {error}
        {'\n\n'}
        {chart}
      </pre>
    )
  }

  return (
    <div className="mermaid-block my-3 overflow-x-auto rounded-md border border-zinc-100 bg-zinc-50/50 p-3 dark:border-zinc-800 dark:bg-zinc-900/40">
      {!done ? <p className="text-[11px] text-zinc-400">Renderizando diagrama…</p> : null}
      <div ref={hostRef} className="flex justify-center [&_svg]:max-w-full" />
    </div>
  )
}

export default MermaidBlock
