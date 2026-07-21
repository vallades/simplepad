/**
 * Walk workspace tree and search file contents (bounded for performance).
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'fs'
import { basename, join, resolve } from 'path'
import log from 'electron-log/main'
import { EXPLORER_IGNORE_NAMES } from '../shared/workspace'
import {
  DEFAULT_SEARCH_MAX_DEPTH,
  DEFAULT_SEARCH_MAX_FILE_BYTES,
  DEFAULT_SEARCH_MAX_FILES,
  DEFAULT_SEARCH_MAX_HITS,
  isSearchableTextFileName,
  searchInTextContent,
  type WorkspaceSearchHit,
  type WorkspaceSearchOptions
} from '../shared/workspaceSearch'
import { isPathInsideRoot } from './workspaceFs'

export function searchWorkspaceFiles(
  rootPath: string,
  options: WorkspaceSearchOptions
): WorkspaceSearchHit[] {
  const query = options.query?.trim() ?? ''
  if (!query || !rootPath || !existsSync(rootPath)) return []

  const maxHits = options.maxHits ?? DEFAULT_SEARCH_MAX_HITS
  const maxFiles = options.maxFiles ?? DEFAULT_SEARCH_MAX_FILES
  const maxDepth = options.maxDepth ?? DEFAULT_SEARCH_MAX_DEPTH
  const maxFileBytes = options.maxFileBytes ?? DEFAULT_SEARCH_MAX_FILE_BYTES
  const caseSensitive = options.caseSensitive ?? false

  const root = resolve(rootPath)
  const hits: WorkspaceSearchHit[] = []
  let filesScanned = 0

  const walk = (dir: string, depth: number): void => {
    if (hits.length >= maxHits || filesScanned >= maxFiles) return
    if (depth > maxDepth) return

    let names: string[]
    try {
      names = readdirSync(dir)
    } catch {
      return
    }

    for (const name of names) {
      if (hits.length >= maxHits || filesScanned >= maxFiles) return
      if (EXPLORER_IGNORE_NAMES.has(name)) continue
      if (name.startsWith('.') && name !== '.env') continue

      const full = join(dir, name)
      if (!isPathInsideRoot(root, full)) continue

      let st
      try {
        st = statSync(full)
      } catch {
        continue
      }

      if (st.isDirectory()) {
        walk(full, depth + 1)
        continue
      }
      if (!st.isFile()) continue
      if (!isSearchableTextFileName(name)) continue
      if (st.size > maxFileBytes) continue

      filesScanned += 1
      try {
        const content = readFileSync(full, 'utf-8')
        // Skip likely binary
        if (content.includes('\u0000')) continue
        const found = searchInTextContent(content, full, basename(full), query, {
          caseSensitive,
          maxHits,
          already: hits.length
        })
        hits.push(...found)
      } catch (error) {
        log.debug('[workspaceSearch] skip', full, error)
      }
    }
  }

  walk(root, 0)
  log.info(
    `[workspaceSearch] query="${query}" root=${root} files=${filesScanned} hits=${hits.length}`
  )
  return hits
}
