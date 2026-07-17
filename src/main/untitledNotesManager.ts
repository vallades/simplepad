import { app } from 'electron'
import { mkdirSync, writeFileSync, existsSync, unlinkSync } from 'fs'
import { join } from 'path'
import log from 'electron-log/main'
import { formatUntitledFileName, isUntitledNotesPath } from '../shared/untitledNotes'

/**
 * Auto-saves untitled tabs under userData/untitled-notes/
 */
export class UntitledNotesManager {
  private dir: string

  constructor(userDataPath = app.getPath('userData')) {
    this.dir = join(userDataPath, 'untitled-notes')
    this.ensureDir()
  }

  getDir(): string {
    return this.dir
  }

  private ensureDir(): void {
    if (!existsSync(this.dir)) {
      mkdirSync(this.dir, { recursive: true })
      log.info('[untitled-notes] created', this.dir)
    }
  }

  /**
   * Write content to an existing untitled path or allocate a new file name.
   * Returns absolute path written.
   */
  save(content: string, existingPath?: string): string {
    this.ensureDir()

    let target = existingPath
    if (!target || !isUntitledNotesPath(target)) {
      target = this.allocatePath()
    }

    writeFileSync(target, content, 'utf-8')
    log.info('[untitled-notes] wrote', target, `(${content.length} chars)`)
    return target
  }

  /** New unique path: untitled-YYYYMMDD-HHmmss.md (collision → suffix). */
  allocatePath(date = new Date()): string {
    this.ensureDir()
    let name = formatUntitledFileName(date)
    let full = join(this.dir, name)
    let n = 0
    while (existsSync(full)) {
      n += 1
      const base = formatUntitledFileName(date).replace(/\.md$/i, '')
      name = `${base}-${n}.md`
      full = join(this.dir, name)
    }
    return full
  }

  /** Delete previous untitled file after user "Save As" to a real path. */
  removeIfUntitled(filePath: string | undefined | null): void {
    if (!filePath || !isUntitledNotesPath(filePath)) return
    try {
      if (existsSync(filePath)) {
        unlinkSync(filePath)
        log.info('[untitled-notes] removed after promote', filePath)
      }
    } catch (error) {
      log.warn('[untitled-notes] failed to remove', filePath, error)
    }
  }
}

let singleton: UntitledNotesManager | null = null

export function getUntitledNotesManager(): UntitledNotesManager {
  if (!singleton) singleton = new UntitledNotesManager()
  return singleton
}

export function resetUntitledNotesManagerForTests(): void {
  singleton = null
}
