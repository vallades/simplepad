import { v4 as uuidv4 } from 'uuid'
import type { NoteTemplate } from '../../shared/templates'
import { renderTemplateContent } from '../../shared/templates'
import { useTabsStore } from '../store/useTabsStore'
import { isElectronApiAvailable } from './sessionBridge'
import { showToast } from '../store/useToastStore'

export async function listTemplates(): Promise<NoteTemplate[]> {
  if (!isElectronApiAvailable() || typeof window.api.listTemplates !== 'function') {
    return []
  }
  const result = await window.api.listTemplates()
  if (!result.ok) {
    if (result.error) showToast(result.error, 'error')
    return result.data ?? []
  }
  return result.data ?? []
}

export async function saveAllTemplates(templates: NoteTemplate[]): Promise<NoteTemplate[]> {
  if (!isElectronApiAvailable()) return templates
  const result = await window.api.saveAllTemplates(templates)
  if (!result.ok && result.error) showToast(result.error, 'error')
  return result.data ?? templates
}

export async function upsertTemplate(template: NoteTemplate): Promise<NoteTemplate[]> {
  if (!isElectronApiAvailable()) return [template]
  const result = await window.api.upsertTemplate(template)
  if (!result.ok && result.error) showToast(result.error, 'error')
  return result.data ?? []
}

export async function deleteTemplate(id: string): Promise<NoteTemplate[]> {
  if (!isElectronApiAvailable()) return []
  const result = await window.api.deleteTemplate(id)
  if (!result.ok && result.error) showToast(result.error, 'error')
  return result.data ?? []
}

/** Create a new tab from a template id (menu or settings). */
export async function createTabFromTemplateId(templateId: string): Promise<void> {
  const templates = await listTemplates()
  const template = templates.find((t) => t.id === templateId)
  if (!template) {
    showToast('Template não encontrado.', 'error')
    return
  }
  createTabFromTemplate(template)
}

export function createTabFromTemplate(template: NoteTemplate): string {
  const content = renderTemplateContent(template.content)
  const id = useTabsStore.getState().createNewTab({
    title: template.name,
    content,
    isDirty: true,
    isMarkdown: template.isMarkdown !== false
  })
  return id
}

export function newBlankTemplate(): NoteTemplate {
  return {
    id: uuidv4(),
    name: 'Novo template',
    content: '# Novo template\n\n',
    isMarkdown: true,
    updatedAt: new Date().toISOString()
  }
}
