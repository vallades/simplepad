import { useEffect, useState } from 'react'
import {
  MAX_AUTO_SAVE_SECONDS,
  MAX_FONT_SIZE,
  MIN_AUTO_SAVE_SECONDS,
  MIN_FONT_SIZE,
  MONOSPACE_FONT_OPTIONS,
  type ThemePreference
} from '../../shared/settings'
import { useSettingsStore } from '../store/useSettingsStore'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: 'system', label: 'Seguir sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' }
]

/**
 * Full settings dialog — font, size, theme, auto-save.
 * Changes apply immediately and persist via electron-store.
 */
function SettingsModal({ open, onClose }: SettingsModalProps): React.JSX.Element | null {
  const fontFamily = useSettingsStore((s) => s.fontFamily)
  const fontSize = useSettingsStore((s) => s.fontSize)
  const theme = useSettingsStore((s) => s.theme)
  const autoSaveEnabled = useSettingsStore((s) => s.autoSaveEnabled)
  const autoSaveIntervalSeconds = useSettingsStore((s) => s.autoSaveIntervalSeconds)
  const splitOrientation = useSettingsStore((s) => s.splitOrientation)
  const updateSettings = useSettingsStore((s) => s.updateSettings)

  const knownFont = MONOSPACE_FONT_OPTIONS.includes(fontFamily)
  // Draft for custom font input; reset when modal remounts via key in parent or open flip
  const [customFontDraft, setCustomFontDraft] = useState(() => (knownFont ? '' : fontFamily))
  const [showCustom, setShowCustom] = useState(!knownFont)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const selectValue = showCustom || !knownFont ? '__custom__' : fontFamily

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
        <h2 id="settings-title" className="mb-4 text-base font-semibold">
          Configurações
        </h2>

        <div className="flex flex-col gap-4 text-sm">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-zinc-500">Fonte do editor</span>
            <select
              className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-950"
              value={selectValue}
              onChange={(event) => {
                const value = event.target.value
                if (value === '__custom__') {
                  setShowCustom(true)
                  setCustomFontDraft(knownFont ? '' : fontFamily)
                  return
                }
                setShowCustom(false)
                void updateSettings({ fontFamily: value })
              }}
            >
              {MONOSPACE_FONT_OPTIONS.map((font) => (
                <option key={font} value={font} style={{ fontFamily: font }}>
                  {font.split(',')[0]?.replace(/"/g, '')}
                </option>
              ))}
              <option value="__custom__">Personalizada…</option>
            </select>
          </label>

          {(showCustom || !knownFont) && (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-500">Fonte personalizada (CSS)</span>
              <input
                type="text"
                className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-950"
                placeholder='ex.: "IBM Plex Mono", monospace'
                value={customFontDraft}
                onChange={(event) => {
                  setCustomFontDraft(event.target.value)
                }}
                onBlur={() => {
                  const next = customFontDraft.trim()
                  if (next) void updateSettings({ fontFamily: next })
                }}
              />
            </label>
          )}

          <label className="flex flex-col gap-1">
            <span className="flex items-center justify-between text-xs font-medium text-zinc-500">
              Tamanho da fonte
              <span className="tabular-nums text-zinc-700 dark:text-zinc-300">{fontSize}px</span>
            </span>
            <input
              type="range"
              min={MIN_FONT_SIZE}
              max={MAX_FONT_SIZE}
              step={1}
              value={fontSize}
              className="w-full accent-zinc-800 dark:accent-zinc-200"
              onChange={(event) => {
                void updateSettings({ fontSize: Number(event.target.value) })
              }}
            />
          </label>

          <fieldset className="flex flex-col gap-1">
            <legend className="text-xs font-medium text-zinc-500">Tema</legend>
            <div className="flex flex-wrap gap-2">
              {THEME_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={[
                    'cursor-pointer rounded-md border px-2.5 py-1 text-xs',
                    theme === option.value
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                      : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800'
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name="theme"
                    className="sr-only"
                    checked={theme === option.value}
                    onChange={() => {
                      void updateSettings({ theme: option.value })
                    }}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="flex flex-col gap-1">
            <legend className="text-xs font-medium text-zinc-500">Layout do Preview</legend>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: 'horizontal' as const, label: 'Lado a lado' },
                  { value: 'vertical' as const, label: 'Empilhado' }
                ] as const
              ).map((option) => (
                <label
                  key={option.value}
                  className={[
                    'cursor-pointer rounded-md border px-2.5 py-1 text-xs',
                    splitOrientation === option.value
                      ? 'border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900'
                      : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800'
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name="split-orientation"
                    className="sr-only"
                    checked={splitOrientation === option.value}
                    onChange={() => {
                      void updateSettings({ splitOrientation: option.value })
                    }}
                  />
                  {option.label}
                </label>
              ))}
            </div>
            <span className="text-[11px] text-zinc-400">
              Com o Preview ativo, arraste a barra entre os painéis para redimensionar.
            </span>
          </fieldset>

          <div className="flex flex-col gap-2 rounded-md border border-zinc-100 p-3 dark:border-zinc-800">
            <label className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-zinc-500">Auto-save</span>
              <input
                type="checkbox"
                className="h-4 w-4 accent-zinc-800 dark:accent-zinc-200"
                checked={autoSaveEnabled}
                onChange={(event) => {
                  void updateSettings({ autoSaveEnabled: event.target.checked })
                }}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="flex items-center justify-between text-xs text-zinc-500">
                Intervalo
                <span className="tabular-nums">{autoSaveIntervalSeconds}s</span>
              </span>
              <input
                type="number"
                min={MIN_AUTO_SAVE_SECONDS}
                max={MAX_AUTO_SAVE_SECONDS}
                step={5}
                disabled={!autoSaveEnabled}
                className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 tabular-nums disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950"
                value={autoSaveIntervalSeconds}
                onChange={(event) => {
                  void updateSettings({
                    autoSaveIntervalSeconds: Number(event.target.value)
                  })
                }}
              />
              <span className="text-[11px] text-zinc-400">
                Salva abas com arquivo no disco a cada intervalo, ao trocar de aba e ao perder o
                foco.
              </span>
            </label>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
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
