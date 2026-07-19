import { useEffect, useState } from 'react'
import {
  MAX_AUTO_SAVE_SECONDS,
  MAX_FONT_SIZE,
  MIN_AUTO_SAVE_SECONDS,
  MIN_FONT_SIZE,
  MONOSPACE_FONT_OPTIONS,
  type ThemePreference
} from '../../shared/settings'
import type { NoteTemplate } from '../../shared/templates'
import { useSettingsStore } from '../store/useSettingsStore'
import {
  deleteTemplate,
  listTemplates,
  newBlankTemplate,
  upsertTemplate
} from '../services/templateActions'
import { showToast } from '../store/useToastStore'

interface SettingsModalProps {
  open: boolean
  onClose: () => void
}

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: 'system', label: 'Seguir sistema' },
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' }
]

type SettingsTab = 'geral' | 'templates'

/**
 * Settings dialog — Geral (font, theme, auto-save) + Templates.
 */
function SettingsModal({ open, onClose }: SettingsModalProps): React.JSX.Element | null {
  const fontFamily = useSettingsStore((s) => s.fontFamily)
  const fontSize = useSettingsStore((s) => s.fontSize)
  const theme = useSettingsStore((s) => s.theme)
  const autoSaveEnabled = useSettingsStore((s) => s.autoSaveEnabled)
  const autoSaveIntervalSeconds = useSettingsStore((s) => s.autoSaveIntervalSeconds)
  const splitOrientation = useSettingsStore((s) => s.splitOrientation)
  const markdownMathEnabled = useSettingsStore((s) => s.markdownMathEnabled)
  const markdownMermaidEnabled = useSettingsStore((s) => s.markdownMermaidEnabled)
  const showMarkdownOutline = useSettingsStore((s) => s.showMarkdownOutline)
  const newTabDefaultMarkdown = useSettingsStore((s) => s.newTabDefaultMarkdown)
  const autoEnablePreviewOnMarkdown = useSettingsStore((s) => s.autoEnablePreviewOnMarkdown)
  const updateSettings = useSettingsStore((s) => s.updateSettings)

  const knownFont = MONOSPACE_FONT_OPTIONS.includes(fontFamily)
  const [customFontDraft, setCustomFontDraft] = useState(() => (knownFont ? '' : fontFamily))
  const [showCustom, setShowCustom] = useState(!knownFont)
  const [tab, setTab] = useState<SettingsTab>('geral')
  const [templates, setTemplates] = useState<NoteTemplate[]>([])
  const [editing, setEditing] = useState<NoteTemplate | null>(null)
  const [templatesStatus, setTemplatesStatus] = useState<'idle' | 'ready'>('idle')

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        if (editing) {
          setEditing(null)
          return
        }
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, editing])

  useEffect(() => {
    if (!open || tab !== 'templates') return
    let cancelled = false
    void (async () => {
      const list = await listTemplates()
      if (!cancelled) {
        setTemplates(list)
        setTemplatesStatus('ready')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [open, tab])

  if (!open) return null

  const selectValue = showCustom || !knownFont ? '__custom__' : fontFamily

  const saveEditing = async (): Promise<void> => {
    if (!editing) return
    if (!editing.name.trim()) {
      showToast('Nome do template é obrigatório.', 'error')
      return
    }
    const next = await upsertTemplate({
      ...editing,
      name: editing.name.trim(),
      updatedAt: new Date().toISOString()
    })
    setTemplates(next)
    setEditing(null)
    showToast('Template salvo.', 'success')
  }

  const removeTemplate = async (id: string): Promise<void> => {
    const next = await deleteTemplate(id)
    setTemplates(next)
    if (editing?.id === id) setEditing(null)
    showToast('Template removido.', 'info')
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-lg flex-col rounded-lg border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 pt-4 pb-0 dark:border-zinc-800">
          <h2 id="settings-title" className="pb-3 text-base font-semibold">
            Configurações
          </h2>
        </div>

        <div className="flex gap-1 border-b border-zinc-100 px-5 dark:border-zinc-800">
          {(
            [
              { id: 'geral' as const, label: 'Geral' },
              { id: 'templates' as const, label: 'Templates' }
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              className={[
                'border-b-2 px-3 py-2 text-xs font-medium transition-colors',
                tab === item.id
                  ? 'border-zinc-900 text-zinc-900 dark:border-zinc-100 dark:text-zinc-100'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              ].join(' ')}
              onClick={() => {
                setTab(item.id)
                setEditing(null)
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {tab === 'geral' ? (
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
                  <span className="text-xs font-medium text-zinc-500">
                    Fonte personalizada (CSS)
                  </span>
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
                  <span className="tabular-nums text-zinc-700 dark:text-zinc-300">
                    {fontSize}px
                  </span>
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
              </fieldset>

              <div className="flex flex-col gap-2 rounded-md border border-zinc-100 p-3 dark:border-zinc-800">
                <p className="text-xs font-medium text-zinc-500">Formato da aba</p>
                <label className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Nova aba padrão: Markdown
                  </span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-zinc-800 dark:accent-zinc-200"
                    checked={newTabDefaultMarkdown}
                    onChange={(event) => {
                      void updateSettings({ newTabDefaultMarkdown: event.target.checked })
                    }}
                  />
                </label>
                <label className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Ativar Preview ao mudar para Markdown
                  </span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-zinc-800 dark:accent-zinc-200"
                    checked={autoEnablePreviewOnMarkdown}
                    onChange={(event) => {
                      void updateSettings({ autoEnablePreviewOnMarkdown: event.target.checked })
                    }}
                  />
                </label>
                <span className="text-[11px] text-zinc-400">
                  Por padrão, “Sem título” começa em Plain Text. Mude o formato na Status Bar ou
                  clique direito na aba. Ao salvar: Markdown → .md, Plain Text → .txt.
                </span>
              </div>

              <div className="flex flex-col gap-2 rounded-md border border-zinc-100 p-3 dark:border-zinc-800">
                <p className="text-xs font-medium text-zinc-500">Markdown avançado</p>
                <label className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-zinc-600 dark:text-zinc-400">Outline (sumário)</span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-zinc-800 dark:accent-zinc-200"
                    checked={showMarkdownOutline}
                    onChange={(event) => {
                      void updateSettings({ showMarkdownOutline: event.target.checked })
                    }}
                  />
                </label>
                <label className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-zinc-600 dark:text-zinc-400">Math (KaTeX) $…$</span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-zinc-800 dark:accent-zinc-200"
                    checked={markdownMathEnabled}
                    onChange={(event) => {
                      void updateSettings({ markdownMathEnabled: event.target.checked })
                    }}
                  />
                </label>
                <label className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-zinc-600 dark:text-zinc-400">Diagramas Mermaid</span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-zinc-800 dark:accent-zinc-200"
                    checked={markdownMermaidEnabled}
                    onChange={(event) => {
                      void updateSettings({ markdownMermaidEnabled: event.target.checked })
                    }}
                  />
                </label>
                <span className="text-[11px] text-zinc-400">
                  Outline e Preview só com Markdown + Split View ativos.
                </span>
              </div>

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
                    Abas com arquivo no disco e rascunhos “Sem título” (em untitled-notes/) são
                    salvos automaticamente.
                  </span>
                </label>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 text-sm">
              {editing ? (
                <div className="flex flex-col gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-zinc-500">Nome</span>
                    <input
                      type="text"
                      className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-950"
                      value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                    />
                  </label>
                  <label className="flex items-center gap-2 text-xs text-zinc-500">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 accent-zinc-800"
                      checked={editing.isMarkdown !== false}
                      onChange={(e) => setEditing({ ...editing, isMarkdown: e.target.checked })}
                    />
                    Abrir em modo Markdown
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-zinc-500">
                      Conteúdo <span className="font-normal text-zinc-400">(use {'{{date}}'})</span>
                    </span>
                    <textarea
                      className="min-h-[180px] rounded-md border border-zinc-200 bg-white px-2 py-1.5 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-950"
                      value={editing.content}
                      onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                    />
                  </label>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="rounded-md px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      onClick={() => setEditing(null)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs text-white dark:bg-zinc-100 dark:text-zinc-900"
                      onClick={() => void saveEditing()}
                    >
                      Salvar template
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-[11px] text-zinc-400">
                    Templates ficam em userData/templates/templates.json. Use no menu{' '}
                    <strong className="font-medium text-zinc-600 dark:text-zinc-300">
                      Arquivo → Nova nota a partir de template
                    </strong>
                    .
                  </p>
                  {templatesStatus === 'idle' ? (
                    <p className="text-xs text-zinc-400">Carregando…</p>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {templates.map((t) => (
                        <li
                          key={t.id}
                          className="flex items-center gap-2 rounded-md border border-zinc-100 px-2 py-1.5 dark:border-zinc-800"
                        >
                          <span className="min-w-0 flex-1 truncate text-xs font-medium">
                            {t.name}
                          </span>
                          <button
                            type="button"
                            className="text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                            onClick={() => setEditing({ ...t })}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className="text-[11px] text-red-500 hover:text-red-700"
                            onClick={() => void removeTemplate(t.id)}
                          >
                            Excluir
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    className="self-start rounded-md border border-dashed border-zinc-300 px-3 py-1.5 text-xs text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
                    onClick={() => setEditing(newBlankTemplate())}
                  >
                    + Novo template
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
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
