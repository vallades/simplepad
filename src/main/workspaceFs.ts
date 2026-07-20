/**
 * Safe filesystem mutations scoped to the active workspace root.
 */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync
} from 'fs'
import { basename, dirname, extname, join, normalize, resolve, sep } from 'path'
import log from 'electron-log/main'
import { getWorkspaceManager } from './workspaceManager'

export interface WorkspaceFsResult {
  path: string
  name: string
  isDirectory: boolean
}

function getRoot(): string {
  const root = getWorkspaceManager().getActiveRoot()
  if (!root) throw new Error('Nenhum workspace de pasta aberto')
  return root
}

export function isPathInsideRoot(root: string, candidate: string): boolean {
  const rootResolved = resolve(root)
  const candResolved = resolve(candidate)
  if (candResolved === rootResolved) return true
  const rootNorm = normalize(rootResolved + sep)
  return normalize(candResolved).startsWith(rootNorm)
}

function assertInside(root: string, target: string): string {
  const resolved = resolve(target)
  if (!isPathInsideRoot(root, resolved)) {
    throw new Error('Caminho fora do workspace')
  }
  return resolved
}

function uniquePath(dir: string, baseName: string): string {
  let candidate = join(dir, baseName)
  if (!existsSync(candidate)) return candidate
  const ext = extname(baseName)
  const stem = ext ? baseName.slice(0, -ext.length) : baseName
  let n = 1
  while (existsSync(candidate)) {
    candidate = join(dir, `${stem} ${n}${ext}`)
    n += 1
  }
  return candidate
}

export function createNote(
  parentDir: string | undefined,
  fileName?: string,
  content = ''
): WorkspaceFsResult {
  const root = getRoot()
  const dir = assertInside(root, parentDir && parentDir.length > 0 ? parentDir : root)
  if (!statSync(dir).isDirectory()) throw new Error('Destino não é pasta')
  const name = fileName?.trim() || 'Nova nota.md'
  const safeName = name.includes('.') ? name : `${name}.md`
  const target = uniquePath(dir, safeName)
  writeFileSync(target, content, 'utf-8')
  log.info('[workspaceFs] createNote', target)
  return { path: target, name: basename(target), isDirectory: false }
}

export function createFolder(
  parentDir: string | undefined,
  folderName?: string
): WorkspaceFsResult {
  const root = getRoot()
  const dir = assertInside(root, parentDir && parentDir.length > 0 ? parentDir : root)
  if (!statSync(dir).isDirectory()) throw new Error('Destino não é pasta')
  const name = folderName?.trim() || 'Nova pasta'
  const target = uniquePath(dir, name)
  mkdirSync(target, { recursive: true })
  log.info('[workspaceFs] createFolder', target)
  return { path: target, name: basename(target), isDirectory: true }
}

export function renameEntry(oldPath: string, newName: string): WorkspaceFsResult {
  const root = getRoot()
  const from = assertInside(root, oldPath)
  if (!existsSync(from)) throw new Error('Item não encontrado')
  const trimmed = newName.trim()
  if (!trimmed || trimmed.includes('/') || trimmed.includes('\\')) {
    throw new Error('Nome inválido')
  }
  const parent = dirname(from)
  const to = assertInside(root, join(parent, trimmed))
  if (from === to) {
    return {
      path: from,
      name: basename(from),
      isDirectory: statSync(from).isDirectory()
    }
  }
  if (existsSync(to)) throw new Error('Já existe um item com esse nome')
  renameSync(from, to)
  log.info('[workspaceFs] rename', from, '→', to)
  return {
    path: to,
    name: basename(to),
    isDirectory: statSync(to).isDirectory()
  }
}

export function deleteEntry(targetPath: string): void {
  const root = getRoot()
  const target = assertInside(root, targetPath)
  if (target === resolve(root)) throw new Error('Não é possível apagar a raiz do workspace')
  if (!existsSync(target)) throw new Error('Item não encontrado')
  rmSync(target, { recursive: true, force: true })
  log.info('[workspaceFs] delete', target)
}

export function writeFileInWorkspace(
  parentDir: string | undefined,
  fileName: string,
  content: string
): WorkspaceFsResult {
  return createNote(parentDir, fileName, content)
}

export function importFileIntoWorkspace(sourcePath: string, destDir?: string): WorkspaceFsResult {
  const root = getRoot()
  const dir = assertInside(root, destDir && destDir.length > 0 ? destDir : root)
  if (!existsSync(sourcePath) || !statSync(sourcePath).isFile()) {
    throw new Error('Arquivo de origem inválido')
  }
  const name = basename(sourcePath)
  const target = uniquePath(dir, name)
  // Prefer copy for external drops (keep original)
  try {
    copyFileSync(sourcePath, target)
  } catch {
    const data = readFileSync(sourcePath)
    writeFileSync(target, data)
  }
  log.info('[workspaceFs] import', sourcePath, '→', target)
  return { path: target, name: basename(target), isDirectory: false }
}

/** Duplicate a file next to the original (name copy / name 2.ext). */
export function duplicateFile(sourcePath: string): WorkspaceFsResult {
  const root = getRoot()
  const from = assertInside(root, sourcePath)
  if (!existsSync(from) || !statSync(from).isFile()) {
    throw new Error('Arquivo inválido para duplicar')
  }
  const dir = dirname(from)
  const base = basename(from)
  const ext = extname(base)
  const stem = ext ? base.slice(0, -ext.length) : base
  const target = uniquePath(dir, `${stem} copy${ext}`)
  copyFileSync(from, target)
  log.info('[workspaceFs] duplicate', from, '→', target)
  return { path: target, name: basename(target), isDirectory: false }
}
