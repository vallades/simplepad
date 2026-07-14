import { create } from 'zustand'

export type ToastKind = 'error' | 'info' | 'success'

export interface ToastItem {
  id: string
  message: string
  kind: ToastKind
}

interface ToastState {
  toasts: ToastItem[]
  push: (message: string, kind?: ToastKind) => string
  dismiss: (id: string) => void
  clear: () => void
}

let toastSeq = 0

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],

  push: (message, kind = 'error') => {
    const id = `toast-${Date.now()}-${toastSeq++}`
    const trimmed = message.trim()
    if (!trimmed) return id

    set((state) => ({
      toasts: [...state.toasts.slice(-4), { id, message: trimmed, kind }]
    }))

    // Auto-dismiss (imperative timer — no React dependency)
    if (typeof window !== 'undefined') {
      window.setTimeout(
        () => {
          useToastStore.getState().dismiss(id)
        },
        kind === 'error' ? 7000 : 4000
      )
    }

    return id
  },

  dismiss: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id)
    }))
  },

  clear: () => set({ toasts: [] })
}))

/** Convenience for services outside React. */
export function showToast(message: string, kind: ToastKind = 'error'): void {
  useToastStore.getState().push(message, kind)
}

export function resetToastStoreForTests(): void {
  useToastStore.setState({ toasts: [] })
}
