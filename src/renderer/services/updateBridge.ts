import { showToast } from '../store/useToastStore'
import { isElectronApiAvailable } from './sessionBridge'
import type { UpdateEventPayload } from '../../shared/session'

/** Last progress milestone toasted (0–100), avoids spam during download. */
let lastProgressMilestone = -1

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
      lastProgressMilestone = -1
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
    case 'progress': {
      // Milestones ~25% (rounded percent can skip exact 25/50/75)
      const p = payload.percent ?? 0
      const milestone = p >= 100 ? 100 : p >= 75 ? 75 : p >= 50 ? 50 : p >= 25 ? 25 : 0
      if (milestone > 0 && milestone > lastProgressMilestone) {
        lastProgressMilestone = milestone
        showToast(`Baixando atualização: ${milestone}%`, 'info')
      }
      break
    }
    case 'downloaded':
      lastProgressMilestone = 100
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
