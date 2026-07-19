import { create } from 'zustand'
import type { WorkspaceInfo } from '../../shared/workspace'
import { workspaceDisplayName } from '../../shared/workspace'

interface WorkspaceState {
  hydrated: boolean
  rootPath: string | null
  name: string
  dataPath: string
  id: string
  setFromInfo: (info: WorkspaceInfo) => void
  clearToGlobal: () => void
}

const emptyGlobal = (): Pick<WorkspaceState, 'rootPath' | 'name' | 'dataPath' | 'id'> => ({
  rootPath: null,
  name: workspaceDisplayName(null),
  dataPath: '',
  id: 'global'
})

export const useWorkspaceStore = create<WorkspaceState>()((set) => ({
  hydrated: false,
  ...emptyGlobal(),

  setFromInfo: (info) => {
    set({
      hydrated: true,
      rootPath: info.rootPath,
      name: info.name || workspaceDisplayName(info.rootPath),
      dataPath: info.dataPath,
      id: info.id
    })
  },

  clearToGlobal: () => {
    set({ hydrated: true, ...emptyGlobal() })
  }
}))

export function resetWorkspaceStoreForTests(): void {
  useWorkspaceStore.setState({
    hydrated: false,
    ...emptyGlobal()
  })
}
