/**
 * Pure Mermaid theme / config helpers (unit-tested, no Electron).
 */

export type MermaidCurveStyle = 'basis' | 'linear' | 'cardinal' | 'step'

export interface MermaidStyleOptions {
  fontSize?: number
  curve?: MermaidCurveStyle
  /** Diagram padding / spacing (maps to mermaid flowchart padding) */
  diagramPadding?: number
}

export interface MermaidThemeBundle {
  theme: 'default' | 'dark' | 'neutral' | 'forest'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  themeVariables: Record<string, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  flowchart: Record<string, any>
  fontFamily: string
  fontSize: number
}

const LIGHT_VARS = {
  primaryColor: '#e0e7ff',
  primaryTextColor: '#18181b',
  primaryBorderColor: '#6366f1',
  lineColor: '#52525b',
  secondaryColor: '#f4f4f5',
  tertiaryColor: '#fafafa',
  background: '#ffffff',
  mainBkg: '#e0e7ff',
  nodeBorder: '#6366f1',
  clusterBkg: '#f4f4f5',
  titleColor: '#18181b',
  edgeLabelBackground: '#ffffff',
  textColor: '#18181b'
}

const DARK_VARS = {
  primaryColor: '#312e81',
  primaryTextColor: '#f4f4f5',
  primaryBorderColor: '#818cf8',
  lineColor: '#a1a1aa',
  secondaryColor: '#27272a',
  tertiaryColor: '#18181b',
  background: '#09090b',
  mainBkg: '#312e81',
  nodeBorder: '#818cf8',
  clusterBkg: '#27272a',
  titleColor: '#f4f4f5',
  edgeLabelBackground: '#18181b',
  textColor: '#f4f4f5'
}

/** Build mermaid.initialize config for light/dark + style options. */
export function buildMermaidInitConfig(
  isDark: boolean,
  options: MermaidStyleOptions = {}
): MermaidThemeBundle {
  const fontSize = clamp(options.fontSize ?? 14, 10, 24)
  const curve = isMermaidCurve(options.curve) ? options.curve : 'basis'
  const diagramPadding = clamp(options.diagramPadding ?? 12, 4, 40)

  return {
    theme: isDark ? 'dark' : 'default',
    themeVariables: {
      ...(isDark ? DARK_VARS : LIGHT_VARS),
      fontSize: `${fontSize}px`,
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif'
    },
    flowchart: {
      curve,
      padding: diagramPadding,
      htmlLabels: true,
      useMaxWidth: true
    },
    fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
    fontSize
  }
}

export function isMermaidCurve(value: unknown): value is MermaidCurveStyle {
  return value === 'basis' || value === 'linear' || value === 'cardinal' || value === 'step'
}

/**
 * Parse Mermaid render errors for a friendly message + optional line number.
 * Mermaid often returns messages like: "Parse error on line 3:..."
 */
export function parseMermaidError(error: unknown): { message: string; lineNumber?: number } {
  const raw = error instanceof Error ? error.message : String(error ?? 'Erro desconhecido')
  const lineMatch =
    /line\s+(\d+)/i.exec(raw) ||
    /Lexical error on line (\d+)/i.exec(raw) ||
    /Parse error on line (\d+)/i.exec(raw)

  const lineNumber = lineMatch ? Number(lineMatch[1]) : undefined
  let message = raw
    .replace(/^Error:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (message.length > 280) {
    message = `${message.slice(0, 277)}…`
  }

  if (!message) {
    message = 'Código Mermaid inválido.'
  }

  return {
    message,
    lineNumber: Number.isFinite(lineNumber) ? lineNumber : undefined
  }
}

/**
 * Serialize SVG element/string to a standalone SVG document string.
 */
export function svgElementToString(svg: SVGSVGElement | string): string {
  if (typeof svg === 'string') {
    const trimmed = svg.trim()
    if (trimmed.startsWith('<?xml') || trimmed.startsWith('<svg')) {
      return trimmed.includes('xmlns')
        ? trimmed
        : trimmed.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
    }
    return trimmed
  }

  const clone = svg.cloneNode(true) as SVGSVGElement
  if (!clone.getAttribute('xmlns')) {
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  }
  return new XMLSerializer().serializeToString(clone)
}

/**
 * Convert SVG string to PNG as base64 (without data: prefix) using canvas.
 * Scale multiplies resolution (2 = retina).
 */
export async function svgStringToPngBase64(
  svgString: string,
  scale = 2
): Promise<{ base64: string; width: number; height: number }> {
  const safeScale = Math.min(4, Math.max(1, scale))
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  try {
    const img = await loadImage(url)
    const width = Math.max(1, Math.round((img.naturalWidth || img.width || 800) * safeScale))
    const height = Math.max(1, Math.round((img.naturalHeight || img.height || 600) * safeScale))

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Canvas 2D indisponível')
    }
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)

    const dataUrl = canvas.toDataURL('image/png')
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '')
    return { base64, width, height }
  } finally {
    URL.revokeObjectURL(url)
  }
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Falha ao carregar SVG para PNG'))
    img.src = url
  })
}

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min
  return Math.min(max, Math.max(min, n))
}

/** Clamp zoom factor for Mermaid pan/zoom UI. */
export function clampMermaidZoom(zoom: number): number {
  return clamp(zoom, 0.25, 4)
}
