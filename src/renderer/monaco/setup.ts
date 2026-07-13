/**
 * Configures Monaco for Electron + Vite without CDN.
 * Safe to call multiple times; never throws into the React tree.
 */
import { loader } from '@monaco-editor/react'

let configured = false
let configurePromise: Promise<typeof import('monaco-editor')> | null = null

export async function setupMonaco(): Promise<typeof import('monaco-editor') | null> {
  if (typeof window === 'undefined') return null

  if (configurePromise) return configurePromise

  configurePromise = (async () => {
    // Dynamic import keeps the initial renderer shell free of Monaco's huge graph.
    const monaco = await import('monaco-editor')
    await import('monaco-editor/min/vs/editor/editor.main.css')

    // Prefer a real worker; fall back to a no-op worker so the editor still mounts.
    try {
      const workerMod = await import('monaco-editor/esm/vs/editor/editor.worker?worker')
      const WorkerCtor = workerMod.default
      self.MonacoEnvironment = {
        getWorker(): Worker {
          return new WorkerCtor()
        }
      }
    } catch (error) {
      console.warn('[SimplePad] Monaco worker unavailable, using stub worker:', error)
      self.MonacoEnvironment = {
        getWorker(): Worker {
          // Minimal stub — enough for plaintext/markdown editing without language services
          const noop = (): void => undefined
          const stub = {
            postMessage: noop,
            addEventListener: noop,
            removeEventListener: noop,
            terminate: noop,
            onmessage: null,
            onerror: null,
            onmessageerror: null,
            dispatchEvent: (): boolean => false
          }
          return stub as unknown as Worker
        }
      }
    }

    loader.config({ monaco })
    // Ensure the loader resolves before <Editor /> mounts
    await loader.init()
    configured = true
    return monaco
  })().catch((error) => {
    console.error('[SimplePad] Monaco setup failed:', error)
    configurePromise = null
    configured = false
    return null as unknown as typeof import('monaco-editor')
  })

  return configurePromise
}

export function isMonacoConfigured(): boolean {
  return configured
}
