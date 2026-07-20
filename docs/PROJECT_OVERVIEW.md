# SimplePad — Project Overview (v2.1)

Visão da linha **v2.1 “File Explorer avançado + correções de workspace”**.  
Histórico: [PROJETO.md](./PROJETO.md).

## Versão

| Campo     | Valor                                  |
| --------- | -------------------------------------- |
| **Atual** | **2.1.0**                              |
| Anterior  | 2.0.0 (Workspaces + explorer básico)   |
| Foco      | Explorer VS Code-like + abas portáteis |

## O que entra na v2.1

### Correções

1. **Abas portáteis** — rascunhos sem path / `untitled-notes` viajam ao trocar workspace; a sessão do contexto anterior continua no disco (Pessoal ou pasta)
2. **Refresh da árvore** — save/create no workspace e mudanças externas (chokidar) atualizam o explorer

### File Explorer avançado

- Toolbar: nova nota, nova pasta, refresh, expandir, recolher
- Contexto (botão direito): renomear, excluir, nova nota/pasta
- Busca, DnD de arquivos para a sidebar, loading
- `⌘B` colapsável; fechada por padrão; largura persistida

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
| UI       | `FileExplorerSidebar.tsx`                 |

## Como testar

```bash
git checkout feature/v2.1-file-explorer-fixes
npm install
npm test && npm run lint && npm run typecheck
npm run dev
```

1. Em **Pessoal**, digite num rascunho sem salvar → abra pasta workspace → rascunho continua aberto
2. Feche workspace → sessão Pessoal com o rascunho ainda existe
3. No workspace: Nova nota na sidebar → arquivo aparece na árvore; Salvar → refresh
4. Crie arquivo no Finder na pasta → árvore atualiza
5. Renomear / excluir / DnD de `.md` na sidebar

## Release

```bash
git tag -a v2.1.0 -m "SimplePad v2.1.0 - Advanced File Explorer"
git push origin v2.1.0
```
