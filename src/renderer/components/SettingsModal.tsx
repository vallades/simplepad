interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

/**
 * Settings shell. Real options (font, theme, auto-save) arrive in Phase 2.
 */
function SettingsModal({ open, onClose }: SettingsModalProps): React.JSX.Element | null {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="settings-title" className="mb-3 text-base font-semibold">
          Configurações
        </h2>
        <p className="mb-4 text-sm text-zinc-500">
          As opções de fonte, tema e auto-save serão adicionadas na Fase 2.
        </p>
        <div className="flex justify-end">
          <button
            type="button"
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
