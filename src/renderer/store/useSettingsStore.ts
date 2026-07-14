import { create } from 'zustand'
import { DEFAULT_SETTINGS, type AppSettings, type ThemePreference } from '../../shared/settings'
import { sanitizeSettings } from '../../shared/settingsSanitize'
import { isElectronApiAvailable } from '../services/sessionBridge'
import { applyThemeToDocument } from '../utils/theme'

interface SettingsState extends AppSettings {
  hydrated: boolean
  hydrate: (settings?: AppSettings | null) => void
  setLocal: (partial: Partial<AppSettings>) => void
  updateSettings: (partial: Partial<AppSettings>) => Promise<AppSettings>
  loadFromMain: () => Promise<void>
}

function applyImmediate(settings: AppSettings): void {
  applyThemeToDocument(settings.theme)
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  ...DEFAULT_SETTINGS,
  hydrated: false,

  hydrate: (settings) => {
    const next = sanitizeSettings(settings ?? DEFAULT_SETTINGS)
    applyImmediate(next)
    set({ ...next, hydrated: true })
  },

  setLocal: (partial) => {
    const next = sanitizeSettings({ ...get(), ...partial })
    applyImmediate(next)
    set({ ...next })
  },

  updateSettings: async (partial) => {
    const optimistic = sanitizeSettings({ ...get(), ...partial })
    applyImmediate(optimistic)
    set({ ...optimistic })

    if (!isElectronApiAvailable()) {
      return optimistic
    }

    try {
      const result = await window.api.setSettings(partial)
      if (result.ok && result.data) {
        const saved = sanitizeSettings(result.data)
        applyImmediate(saved)
        set({ ...saved, hydrated: true })
        return saved
      }
    } catch (error) {
      console.error('[settings] set failed:', error)
    }

    return optimistic
  },

  loadFromMain: async () => {
    if (!isElectronApiAvailable()) {
      get().hydrate(DEFAULT_SETTINGS)
      return
    }
    try {
      const result = await window.api.getSettings()
      if (result.ok && result.data) {
        get().hydrate(result.data)
        return
      }
    } catch (error) {
      console.error('[settings] load failed:', error)
    }
    get().hydrate(DEFAULT_SETTINGS)
  }
}))

export function getEditorThemeId(
  preference: ThemePreference,
  systemIsDark: boolean
): 'vs' | 'vs-dark' {
  if (preference === 'dark') return 'vs-dark'
  if (preference === 'light') return 'vs'
  return systemIsDark ? 'vs-dark' : 'vs'
}

export function resetSettingsStoreForTests(overrides?: Partial<AppSettings>): void {
  const next = sanitizeSettings({ ...DEFAULT_SETTINGS, ...overrides })
  useSettingsStore.setState({
    ...next,
    hydrated: true
  })
}
