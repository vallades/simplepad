# SimplePad — Project Overview (v2.1)

Visão da linha **v2.1 “File Explorer avançado + correções de workspace”**.  
Histórico: [PROJETO.md](./PROJETO.md).

## Versão

| Campo     | Valor                                       |
| --------- | ------------------------------------------- |
| **Atual** | **2.1.0**                                   |
| Anterior  | 2.0.0 (Workspaces + explorer básico)        |
| Foco      | Explorer, abas portáteis, menus de contexto |
| Tag       | `v2.1.0`                                    |
| Branch    | `feature/v2.1-file-explorer-fixes` → `main` |

## O que entra na v2.1

### Correções

1. **Abas portáteis** — rascunhos sem path / `untitled-notes` viajam ao trocar workspace
2. **Refresh da árvore** — save/create + chokidar
3. **Input inline** no explorador (create/rename) — Electron não tem `window.prompt`
4. **Editor sincroniza** ao abrir arquivo pelo explorador (Monaco model + disco)

### File Explorer avançado

- Toolbar: nova nota, nova pasta, refresh, expandir, recolher
- Menus de contexto ricos (arquivo, pasta, raiz)
- Busca, DnD, loading, `⌘B`

### Menus de contexto (abas)

- Fechar / outras / à direita / todas
- Salvar, recarregar, copiar path/nome, revelar no SO
- Formato Markdown/Plain Text, duplicar, nova aba

## Arquitetura

```
workspace switch:
  1. capture portable tabs (untitled)
  2. flush full session → current data dir
  3. rebind managers + open root
  4. load destination session
  5. merge portable drafts into open tabs

explorer refresh:
  save/create → requestExplorerRefresh
  chokidar → workspace:fs-changed → same
```

| Área     | Path                                      |
| -------- | ----------------------------------------- |
| Portable | `src/shared/workspacePortable.ts`         |
| FS ops   | `src/main/workspaceFs.ts`                 |
| Watcher  | `src/main/workspaceWatcher.ts` (chokidar) |
| Events   | `src/renderer/services/explorerEvents.ts` |
| UI       | `FileExplorerSidebar.tsx`, `TabBar.tsx`   |
| Menu UI  | `ContextMenu.tsx`                         |

## Como testar

```bash
git checkout feature/v2.1-file-explorer-fixes
npm install
npm test && npm run lint && npm run typecheck
npm run dev
```

1. Rascunho em Pessoal → abrir workspace → rascunho continua
2. Nova nota (input inline) → abre no editor
3. Clique em várias notas no explorador → editor atualiza
4. Contexto na aba e no explorador (fechar outras, revelar, duplicar…)
5. Chokidar: criar arquivo no Finder → árvore atualiza

## Release

```bash
git tag -a v2.1.0 -m "SimplePad v2.1.0 - Advanced File Explorer and workspace fixes"
git push origin v2.1.0
```
