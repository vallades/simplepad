/**
 * Lightweight workspace (folder vault) contracts — browser + Node safe.
 */

export const MAX_RECENT_WORKSPACES = 5
export const WORKSPACE_META_VERSION = 1

/** Global registry (always under app userData) */
export interface WorkspacesRegistry {
  version: number
  /** Absolute path of active folder workspace, or null for default (global) mode */
  activeRoot: string | null
  /** Newest first, max MAX_RECENT_WORKSPACES */
  recentWorkspaces: string[]
}

export interface WorkspaceInfo {
  /** Absolute folder path, or null when using global userData */
  rootPath: string | null
  /** Display name (folder basename or "Pessoal") */
  name: string
  /** Where session/prefs/templates/untitled live for this context */
  dataPath: string
  /** Stable id used as data subdirectory name */
  id: string
}

export interface DirEntryDTO {
  name: string
  path: string
  isDirectory: boolean
  /** Extension without dot, lowercased; empty for dirs */
  ext: string
}

export interface ListDirResult {
  path: string
  entries: DirEntryDTO[]
}

export function createDefaultRegistry(): WorkspacesRegistry {
  return {
    version: WORKSPACE_META_VERSION,
    activeRoot: null,
    recentWorkspaces: []
  }
}

/** Stable filesystem-safe id from absolute path (FNV-1a style, not cryptographic). */
export function workspaceIdFromPath(rootPath: string): string {
  const normalized = rootPath.trim().replace(/\\/g, '/').replace(/\/+$/, '') || rootPath
  let hash = 2166136261
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  const a = (hash >>> 0).toString(16).padStart(8, '0')
  let hash2 = 5381
  for (let i = 0; i < normalized.length; i++) {
    hash2 = (hash2 * 33) ^ normalized.charCodeAt(i)
  }
  const b = (hash2 >>> 0).toString(16).padStart(8, '0')
  return `${a}${b}`
}

export function workspaceDisplayName(rootPath: string | null | undefined): string {
  if (!rootPath) return 'Pessoal'
  const cleaned = rootPath.replace(/[/\\]+$/, '')
  const parts = cleaned.split(/[/\\]/)
  return parts[parts.length - 1] || 'Workspace'
}

export function sanitizeRecentWorkspaces(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const result: string[] = []
  for (const item of raw) {
    if (typeof item !== 'string') continue
    const path = item.trim()
    if (!path || seen.has(path)) continue
    seen.add(path)
    result.push(path)
    if (result.length >= MAX_RECENT_WORKSPACES) break
  }
  return result
}

export function pushRecentWorkspace(current: string[], rootPath: string): string[] {
  const path = rootPath.trim()
  if (!path) return sanitizeRecentWorkspaces(current)
  const rest = current.filter((item) => item !== path)
  return sanitizeRecentWorkspaces([path, ...rest])
}

export function sanitizeWorkspacesRegistry(raw: unknown): WorkspacesRegistry {
  if (!raw || typeof raw !== 'object') return createDefaultRegistry()
  const obj = raw as Partial<WorkspacesRegistry>
  const activeRoot =
    typeof obj.activeRoot === 'string' && obj.activeRoot.trim().length > 0
      ? obj.activeRoot.trim()
      : null
  return {
    version: WORKSPACE_META_VERSION,
    activeRoot,
    recentWorkspaces: sanitizeRecentWorkspaces(obj.recentWorkspaces)
  }
}

/** Folders/files ignored in the explorer tree */
export const EXPLORER_IGNORE_NAMES = new Set([
  '.git',
  '.svn',
  '.hg',
  'node_modules',
  '.DS_Store',
  'Thumbs.db',
  '.simplepad',
  'dist',
  'build',
  '.next',
  '.cache',
  '__pycache__',
  '.venv',
  'venv'
])
