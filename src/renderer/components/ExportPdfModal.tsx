import { useEffect, useState } from 'react'
import type { PdfMarginPreset } from '../../shared/session'
import type { ExportTheme } from '../utils/markdownExport'

export interface PdfExportFormValues {
  theme: ExportTheme
  margins: PdfMarginPreset
  includeOutline: boolean
}

interface ExportPdfModalProps {
  open: boolean
  defaultTheme: ExportTheme
  onCancel: () => void
  onConfirm: (values: PdfExportFormValues) => void
}

/**
 * Minimal options dialog before PDF export (margins, theme, outline).
 * Form state is keyed by `open` + defaultTheme so remount resets without setState-in-effect.
 */
function ExportPdfModal({
  open,
  defaultTheme,
  onCancel,
  onConfirm
}: ExportPdfModalProps): React.JSX.Element | null {
  if (!open) return null

  return (
    <ExportPdfModalForm
      key={`${defaultTheme}-${String(open)}`}
      defaultTheme={defaultTheme}
      onCancel={onCancel}
      onConfirm={onConfirm}
    />
  )
}

function ExportPdfModalForm({
  defaultTheme,
  onCancel,
  onConfirm
}: {
  defaultTheme: ExportTheme
  onCancel: () => void
  onConfirm: (values: PdfExportFormValues) => void
}): React.JSX.Element {
  const [theme, setTheme] = useState<ExportTheme>(defaultTheme)
  const [margins, setMargins] = useState<PdfMarginPreset>('default')
  const [includeOutline, setIncludeOutline] = useState(true)

  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-pdf-title"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="export-pdf-title" className="mb-3 text-base font-semibold">
          Exportar PDF
        </h2>

        <div className="flex flex-col gap-4 text-sm">
          <fieldset className="flex flex-col gap-1.5">
            <legend className="text-xs font-medium text-zinc-500">Tema</legend>
            <div className="flex gap-2">
              {(
                [
                  { value: 'light' as const, label: 'Claro' },
                  { value: 'dark' as const, label: 'Escuro' }
                ] as const
              ).map((opt) => (
                <label
                  key={opt.value}
                  className={[
                    'cursor-pointer rounded-md border px-2.5 py-1 text-xs',
                    theme === opt.value
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                      : 'border-zinc-200 dark:border-zinc-700'
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name="pdf-theme"
                    className="sr-only"
                    checked={theme === opt.value}
                    onChange={() => setTheme(opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-500">Margens</span>
            <select
              className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-950"
              value={margins}
              onChange={(e) => setMargins(e.target.value as PdfMarginPreset)}
            >
              <option value="default">Padrão</option>
              <option value="minimal">Mínimas</option>
              <option value="none">Nenhuma</option>
            </select>
          </label>

          <label className="flex items-center justify-between gap-3 text-xs">
            <span className="font-medium text-zinc-500">Incluir outline (sumário)</span>
            <input
              type="checkbox"
              className="h-4 w-4 accent-zinc-800 dark:accent-zinc-200"
              checked={includeOutline}
              onChange={(e) => setIncludeOutline(e.target.checked)}
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
            onClick={() => onConfirm({ theme, margins, includeOutline })}
          >
            Exportar…
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExportPdfModal
