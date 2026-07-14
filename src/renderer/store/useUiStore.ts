import { create } from 'zustand'

interface UiState {
  /** Editor | Preview split for the workspace */
  splitPreview: boolean
  /** 0–1 scroll ratio from the editor (for optional preview sync) */
  editorScrollRatio: number
  toggleSplitPreview: () => void
  setSplitPreview: (value: boolean) => void
  setEditorScrollRatio: (ratio: number) => void
}

export const useUiStore = create<UiState>()((set) => ({
  splitPreview: false,
  editorScrollRatio: 0,

  toggleSplitPreview: () => {
    set((state) => ({ splitPreview: !state.splitPreview }))
  },

  setSplitPreview: (value) => {
    set({ splitPreview: value })
  },

  setEditorScrollRatio: (ratio) => {
    const next = Number.isFinite(ratio) ? Math.min(1, Math.max(0, ratio)) : 0
    set({ editorScrollRatio: next })
  }
}))

export function resetUiStoreForTests(): void {
  useUiStore.setState({
    splitPreview: false,
    editorScrollRatio: 0
  })
}
