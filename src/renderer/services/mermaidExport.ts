import { isElectronApiAvailable } from './sessionBridge'
import { showToast } from '../store/useToastStore'
import { svgElementToString, svgStringToPngBase64 } from '../utils/mermaidConfig'

export async function exportMermaidSvg(
  svgMarkup: string,
  defaultName = 'diagrama'
): Promise<boolean> {
  if (!isElectronApiAvailable() || typeof window.api.saveBinaryFile !== 'function') {
    showToast('Exportação indisponível neste ambiente.', 'error')
    return false
  }

  const svg = svgElementToString(svgMarkup)
  const result = await window.api.saveBinaryFile({
    format: 'svg',
    data: svg,
    isBase64: false,
    defaultPath: `${defaultName}.svg`
  })

  if (result.error) {
    showToast(result.error, 'error')
    return false
  }
  if (result.canceled) return false

  showToast(`SVG exportado: ${result.filePath ?? ''}`, 'success')
  return true
}

export async function exportMermaidPng(
  svgMarkup: string,
  defaultName = 'diagrama'
): Promise<boolean> {
  if (!isElectronApiAvailable() || typeof window.api.saveBinaryFile !== 'function') {
    showToast('Exportação indisponível neste ambiente.', 'error')
    return false
  }

  try {
    const svg = svgElementToString(svgMarkup)
    const { base64 } = await svgStringToPngBase64(svg, 2)
    const result = await window.api.saveBinaryFile({
      format: 'png',
      data: base64,
      isBase64: true,
      defaultPath: `${defaultName}.png`
    })

    if (result.error) {
      showToast(result.error, 'error')
      return false
    }
    if (result.canceled) return false

    showToast(`PNG exportado: ${result.filePath ?? ''}`, 'success')
    return true
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Falha ao gerar PNG', 'error')
    return false
  }
}
