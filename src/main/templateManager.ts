import { app } from 'electron'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import log from 'electron-log/main'
import type { NoteTemplate, TemplatesFile } from '../shared/templates'
import {
  createDefaultTemplatesFile,
  removeTemplate,
  sanitizeTemplatesFile,
  upsertTemplate
} from '../shared/templatesSanitize'

/**
 * Manages userData/templates/templates.json
 */
export class TemplateManager {
  private dir: string
  private filePath: string
  private cache: TemplatesFile | null = null

  constructor(userDataPath = app.getPath('userData')) {
    this.dir = join(userDataPath, 'templates')
    this.filePath = join(this.dir, 'templates.json')
    this.ensureDir()
  }

  private ensureDir(): void {
    if (!existsSync(this.dir)) {
      mkdirSync(this.dir, { recursive: true })
      log.info('[templates] created', this.dir)
    }
  }

  getTemplatesDir(): string {
    return this.dir
  }

  getFilePath(): string {
    return this.filePath
  }

  list(): NoteTemplate[] {
    return this.load().templates
  }

  getById(id: string): NoteTemplate | undefined {
    return this.list().find((t) => t.id === id)
  }

  load(): TemplatesFile {
    if (this.cache) return this.cache

    if (!existsSync(this.filePath)) {
      const defaults = createDefaultTemplatesFile()
      this.persist(defaults)
      this.cache = defaults
      return defaults
    }

    try {
      const raw = JSON.parse(readFileSync(this.filePath, 'utf-8')) as unknown
      const sanitized = sanitizeTemplatesFile(raw)
      this.cache = sanitized
      // Write back if we had to repair structure
      this.persist(sanitized)
      return sanitized
    } catch (error) {
      log.error('[templates] load failed, reseeding defaults', error)
      const defaults = createDefaultTemplatesFile()
      this.persist(defaults)
      this.cache = defaults
      return defaults
    }
  }

  saveAll(templates: NoteTemplate[]): TemplatesFile {
    const file: TemplatesFile = sanitizeTemplatesFile({ version: 1, templates })
    this.persist(file)
    this.cache = file
    return file
  }

  upsert(template: NoteTemplate): TemplatesFile {
    const current = this.load()
    const next = upsertTemplate(current.templates, {
      ...template,
      updatedAt: new Date().toISOString()
    })
    return this.saveAll(next)
  }

  delete(id: string): TemplatesFile {
    const current = this.load()
    return this.saveAll(removeTemplate(current.templates, id))
  }

  private persist(file: TemplatesFile): void {
    this.ensureDir()
    writeFileSync(this.filePath, JSON.stringify(file, null, 2), 'utf-8')
    log.info('[templates] saved', this.filePath, `(${file.templates.length} items)`)
  }
}

let singleton: TemplateManager | null = null

export function getTemplateManager(): TemplateManager {
  if (!singleton) singleton = new TemplateManager()
  return singleton
}

/** Test helper */
export function resetTemplateManagerForTests(): void {
  singleton = null
}
