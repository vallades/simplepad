import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import log from 'electron-log/main'
import type { SnippetsFile, TextSnippet } from '../shared/snippets'
import { createDefaultSnippetsFile, sanitizeSnippetsFile } from '../shared/snippets'

/**
 * userData/snippets/snippets.json
 */
export class SnippetsManager {
  private dir: string
  private filePath: string
  private cache: SnippetsFile | null = null

  constructor(userDataPath = app.getPath('userData')) {
    this.dir = join(userDataPath, 'snippets')
    this.filePath = join(this.dir, 'snippets.json')
    this.ensureDir()
  }

  private ensureDir(): void {
    if (!existsSync(this.dir)) {
      mkdirSync(this.dir, { recursive: true })
    }
  }

  list(): TextSnippet[] {
    return this.load().snippets
  }

  load(): SnippetsFile {
    if (this.cache) return this.cache
    if (!existsSync(this.filePath)) {
      const defaults = createDefaultSnippetsFile()
      this.persist(defaults)
      this.cache = defaults
      return defaults
    }
    try {
      const raw = JSON.parse(readFileSync(this.filePath, 'utf-8')) as unknown
      const sanitized = sanitizeSnippetsFile(raw)
      this.cache = sanitized
      this.persist(sanitized)
      return sanitized
    } catch (error) {
      log.error('[snippets] load failed', error)
      const defaults = createDefaultSnippetsFile()
      this.persist(defaults)
      this.cache = defaults
      return defaults
    }
  }

  saveAll(snippets: TextSnippet[]): SnippetsFile {
    const file = sanitizeSnippetsFile({ version: 1, snippets })
    this.persist(file)
    this.cache = file
    return file
  }

  private persist(file: SnippetsFile): void {
    this.ensureDir()
    writeFileSync(this.filePath, JSON.stringify(file, null, 2), 'utf-8')
    log.info('[snippets] saved', this.filePath, `(${file.snippets.length})`)
  }
}

let singleton: SnippetsManager | null = null

export function getSnippetsManager(): SnippetsManager {
  if (!singleton) singleton = new SnippetsManager()
  return singleton
}

export function resetSnippetsManagerForTests(): void {
  singleton = null
}
