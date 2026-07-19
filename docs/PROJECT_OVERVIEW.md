# SimplePad — Project Overview (v2.0)

Visão da linha **v2.0 “Workspaces + File Explorer”**.  
Histórico: [PROJETO.md](./PROJETO.md).

## Versão

| Campo     | Valor                                         |
| --------- | --------------------------------------------- |
| **Atual** | **2.0.0**                                     |
| Anterior  | 1.8.0 (Snippets, DnD, foco, split/outline)    |
| Foco      | Workspaces (vaults leves) + sidebar de pastas |

## O que entra na v2.0

### Workspaces (vaults leves)

1. **Arquivo → Abrir pasta como Workspace…** (`⌘⌥O` / `Ctrl+Alt+O`)
2. Cada workspace de pasta tem dados isolados:
   - `session.json`, `preferences.json`, `templates/`, `untitled-notes/`
   - em `userData/workspaces/<id>/` (id estável do path)
3. Modo **Pessoal** (sem pasta): dados no `userData` global (compatível com v1.x)
4. **Workspaces recentes** (últimos 5) no menu Arquivo
5. Status Bar: nome do workspace (clicável → abrir outra pasta)
6. Snippets continuam **globais** (compartilhados entre workspaces)

### Sidebar de pastas (File Explorer)

1. Painel esquerdo **colapsável** (`⌘B` / `Ctrl+B`, menu Exibir, botão Arquivos)
2. **Fechada por padrão** (`sidebarOpen: false`)
3. Árvore **lazy** (lista um nível por vez) — bom com pastas grandes
4. Clique em arquivo de texto → abre em aba
5. Busca rápida no topo (filtra nomes no nível carregado)
6. Estado aberto/fechado e largura **persistidos por workspace** (`sidebarOpen`, `sidebarWidth` nas prefs do workspace)

## Arquitetura (v2.0)

```
userData/
  workspaces-registry.json     # activeRoot + recentWorkspaces (global)
  session.json / preferences…  # modo Pessoal
  templates/ untitled-notes/ snippets/
  workspaces/<id>/             # por pasta
    session.json
    preferences.json
    templates/
    untitled-notes/

Renderer
  FileExplorerSidebar | EditorWorkspace (Editor | Preview | Outline)
```

| Área        | Caminho principal                                 |
| ----------- | ------------------------------------------------- |
| Contratos   | `src/shared/workspace.ts`                         |
| Registry/FS | `src/main/workspaceManager.ts`                    |
| IPC         | `workspace:*` em `src/main/ipc.ts` + preload      |
| UI store    | `useWorkspaceStore`, `useUiStore.sidebarOpen`     |
| Sidebar     | `src/renderer/components/FileExplorerSidebar.tsx` |
| Ações       | `src/renderer/services/workspaceActions.ts`       |

## Checklist de funcionalidades (até v2.0.0)

- [x] Abas + sessão persistida + dirty / quit seguro
- [x] Abrir / Salvar / Recentes + drag & drop de arquivos
- [x] Settings (fonte, tema, auto-save)
- [x] Markdown Preview (GFM), split redimensionável, Outline à direita
- [x] Math (KaTeX), Mermaid (tema, export, zoom)
- [x] YAML Frontmatter + Properties
- [x] Templates e untitled auto-save
- [x] Snippets (Tab / Ctrl+Espaço)
- [x] Modo Foco (F11 / Esc, opcionalmente lembrar)
- [x] Auto-update (electron-updater)
- [x] **Workspaces** (abrir pasta, recentes, dados isolados)
- [x] **File Explorer** (sidebar colapsável, busca, lazy tree)

## Como testar

```bash
git checkout feature/v2.0-workspaces-explorer
npm install
npm test && npm run lint && npm run typecheck
npm run dev
```

1. **Arquivo → Abrir pasta como Workspace** em uma pasta com `.md`
2. Status Bar mostra o nome da pasta
3. `⌘B` abre o explorador; clique em arquivo → aba
4. Feche o app e reabra → mesmo workspace + sessão da pasta
5. Abra outro workspace → abas trocam; volte via **Workspaces recentes**
6. **Fechar Workspace** → modo Pessoal

## Release

```bash
git tag -a v2.0.0 -m "SimplePad v2.0.0 - Workspaces and File Explorer"
git push origin v2.0.0
```
