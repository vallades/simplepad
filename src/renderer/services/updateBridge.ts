import { showToast } from '../store/useToastStore'
import { isElectronApiAvailable } from './sessionBridge'
import type { UpdateEventPayload } from '../../shared/session'

/**
 * Handles auto-updater events from main → user-facing toasts.
 */
export function handleUpdateEvent(payload: UpdateEventPayload): void {
  switch (payload.type) {
    case 'checking':
      showToast('Verificando atualizações…', 'info')
      break
    case 'available':
      showToast(
        payload.version
          ? `Atualização ${payload.version} disponível — baixando…`
          : 'Atualização disponível — baixando…',
        'info'
      )
      break
    case 'not-available':
      showToast(
        payload.version
          ? `Você já está na versão mais recente (${payload.version}).`
          : 'Nenhuma atualização disponível.',
        'success'
      )
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
          ? `Atualização ${payload.version} pronta. Reinicie para instalar (Ajuda → ou ao sair).`
          : 'Atualização baixada. Reinicie o app para instalar.',
        'success'
      )
      break
    case 'error':
      showToast(
        payload.message
          ? `Atualização: ${payload.message}`
          : 'Falha ao verificar atualizações. Veja o log do app.',
        'error'
      )
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
