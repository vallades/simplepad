# SimplePad — Project Overview (v2.3)

Visão da linha **v2.3 “Sidebar features”**.  
Histórico: [PROJETO.md](./PROJETO.md).

## Versão

| Campo     | Valor                                          |
| --------- | ---------------------------------------------- |
| **Atual** | **2.3.0**                                      |
| Anterior  | 2.2.0 (layout VS Code)                         |
| Foco      | Outline, Search e Timeline reais no Side Panel |
| Tag       | `v2.3.0`                                       |

## Activity Bar views

| Ícone | View       | Comportamento                        |
| ----- | ---------- | ------------------------------------ |
| 📁    | Explorador | Árvore do workspace                  |
| ≡     | Outline    | Headings Markdown da aba ativa       |
| 🕐    | Timeline   | Últimas 20 notas (recentes + abas)   |
| 🔍    | Busca      | Abas abertas + arquivos do workspace |

## Componentes

| Peça        | Path                        |
| ----------- | --------------------------- |
| Outline     | `SideOutlineView.tsx`       |
| Search      | `SideSearchView.tsx`        |
| Timeline    | `SideTimelineView.tsx`      |
| Search pure | `shared/workspaceSearch.ts` |
| IPC walk    | `main/workspaceSearch.ts`   |

## Como testar

```bash
git checkout feature/v2.3-sidebar-features
npm install && npm test && npm run lint && npm run typecheck
npm run dev
```

1. Markdown com `#` / `##` → Outline hierárquico; clique → editor rola
2. Busca: digite termo presente em abas e em arquivos do workspace
3. Timeline: abrir/salvar notas e ver lista; clique reabre
4. Trocar de ícone → animação suave no painel

## Release

```bash
git tag -a v2.3.0 -m "SimplePad v2.3.0 - Sidebar Outline, Search and Timeline"
git push origin v2.3.0
```
