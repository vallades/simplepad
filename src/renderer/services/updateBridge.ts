import { showToast } from '../store/useToastStore'
import { isElectronApiAvailable } from './sessionBridge'
import type { UpdateEventPayload } from '../../shared/session'

/**
 * Handles auto-updater events from main → user-facing toasts.
 */
export function handleUpdateEvent(payload: UpdateEventPayload): void {
  const quiet = Boolean(payload.silent)

  switch (payload.type) {
    case 'checking':
      // Background launch check stays silent
      if (!quiet) showToast('Verificando atualizações…', 'info')
      break
    case 'available':
      // Always show — user should know a download started
      showToast(
        payload.version
          ? `Nova versão ${payload.version} disponível — baixando…`
          : 'Nova versão disponível — baixando…',
        'info'
      )
      break
    case 'not-available':
      if (!quiet) {
        showToast(
          payload.version
            ? `Você já está na versão mais recente (${payload.version}).`
            : 'Nenhuma atualização disponível.',
          'success'
        )
      }
      break
    case 'progress':
      // Avoid toast spam — only announce milestones
      if (payload.percent === 50 || payload.percent === 100) {
        showToast(`Download da atualização: ${payload.percent}%`, 'info')
      }
      break
    case 'downloaded':
      showToast(
        payload.version
          ? `Versão ${payload.version} baixada. Use o diálogo para reiniciar ou saia do app para instalar.`
          : 'Atualização baixada. Reinicie o SimplePad para instalar.',
        'success'
      )
      break
    case 'error':
      if (!quiet) {
        showToast(
          payload.message
            ? `Atualização: ${payload.message}`
            : 'Falha ao verificar atualizações. Veja o log do app.',
          'error'
        )
      }
      break
    default:
      break
  }
}

export async function requestCheckForUpdates(): Promise<void> {
  if (!isElectronApiAvailable() || typeof window.api.checkForUpdates !== 'function') {
    showToast('Verificação de atualizações indisponível neste ambiente.', 'error')
    return
  }
  const result = await window.api.checkForUpdates()
  if (!result.ok && result.error) {
    showToast(result.error, 'error')
  }
}

export async function requestInstallUpdate(): Promise<void> {
  if (!isElectronApiAvailable() || typeof window.api.installUpdate !== 'function') return
  await window.api.installUpdate()
}

export async function syncFocusModeToMain(enabled: boolean): Promise<void> {
  if (!isElectronApiAvailable() || typeof window.api.setFocusMode !== 'function') return
  await window.api.setFocusMode(enabled)
}
