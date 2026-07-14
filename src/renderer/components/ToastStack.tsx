import { X } from 'lucide-react'
import { useToastStore } from '../store/useToastStore'

/**
 * Lightweight top-right toast stack for I/O and session feedback.
 */
function ToastStack(): React.JSX.Element | null {
  const toasts = useToastStore((state) => state.toasts)
  const dismiss = useToastStore((state) => state.dismiss)

  if (toasts.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed top-3 right-3 z-[100] flex w-full max-w-sm flex-col gap-2 px-2"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((toast) => {
        const palette =
          toast.kind === 'error'
            ? 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100'
            : toast.kind === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100'
              : 'border-zinc-200 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100'

        return (
          <div
            key={toast.id}
            role={toast.kind === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex items-start gap-2 rounded-md border px-3 py-2 text-xs shadow-lg ${palette}`}
          >
            <p className="min-w-0 flex-1 whitespace-pre-wrap break-words leading-relaxed">
              {toast.message}
            </p>
            <button
              type="button"
              aria-label="Dispensar"
              className="shrink-0 rounded p-0.5 opacity-60 hover:opacity-100"
              onClick={() => dismiss(toast.id)}
            >
              <X size={12} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default ToastStack
