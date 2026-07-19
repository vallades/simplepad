import { v4 as uuidv4 } from 'uuid'
import type { TextSnippet } from '../../shared/snippets'
import { DEFAULT_SNIPPETS } from '../../shared/snippets'
import { isElectronApiAvailable } from './sessionBridge'
import { showToast } from '../store/useToastStore'

let cache: TextSnippet[] | null = null

/** Sync access for Tab expansion (defaults until listSnippets loads). */
export function getSnippetsSync(): TextSnippet[] {
  if (cache) return cache
  return DEFAULT_SNIPPETS
}

export async function listSnippets(force = false): Promise<TextSnippet[]> {
  if (!force && cache) return cache
  if (!isElectronApiAvailable() || typeof window.api.listSnippets !== 'function') {
    cache = DEFAULT_SNIPPETS.map((s) => ({ ...s }))
    return cache
  }
  const result = await window.api.listSnippets()
  cache = result.data ?? DEFAULT_SNIPPETS.map((s) => ({ ...s }))
  return cache
}

export async function saveAllSnippets(snippets: TextSnippet[]): Promise<TextSnippet[]> {
  if (!isElectronApiAvailable() || typeof window.api.saveAllSnippets !== 'function') {
    cache = snippets
    return snippets
  }
  const result = await window.api.saveAllSnippets(snippets)
  if (!result.ok && result.error) showToast(result.error, 'error')
  cache = result.data ?? snippets
  return cache
}

export function newBlankSnippet(): TextSnippet {
  return {
    id: uuidv4(),
    trigger: ';novo',
    name: 'Novo snippet',
    body: 'texto$0'
  }
}

export function invalidateSnippetCache(): void {
  cache = null
}
