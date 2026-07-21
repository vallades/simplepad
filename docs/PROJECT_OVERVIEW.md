# SimplePad — Project Overview (v2.2)

Visão da linha **v2.2 “Layout Visual Studio Code”**.  
Histórico: [PROJETO.md](./PROJETO.md).

## Versão

| Campo     | Valor                                     |
| --------- | ----------------------------------------- |
| **Atual** | **2.2.0**                                 |
| Anterior  | 2.1.0 (File Explorer avançado + menus)    |
| Foco      | Activity Bar + Side Panel + animações CSS |
| Tag       | `v2.2.0`                                  |

## Layout v2.2

```
┌──────────────────────────────────────────────────────────┐
│ Header                                                   │
├──────────────────────────────────────────────────────────┤
│ TabBar                                                   │
├────┬──────────┬──────────────────────────────────────────┤
│ AB │ Side     │ Editor  [ | Preview | Outline right ]    │
│ 48 │ Panel    │                                          │
│ px │ 240px    │                                          │
├────┴──────────┴──────────────────────────────────────────┤
│ StatusBar                                                │
└──────────────────────────────────────────────────────────┘
```

- **Activity Bar:** Explorador · Outline · Timeline · Busca (últimos dois em breve)
- **Side Panel:** conteúdo da view ativa; colapsável (duplo clique / ⌘B)
- **Editor:** centro; Split View inalterado

## Componentes

| Peça        | Path                                                                                   |
| ----------- | -------------------------------------------------------------------------------------- |
| ActivityBar | `src/renderer/components/ActivityBar.tsx`                                              |
| SidePanel   | `src/renderer/components/SidePanel.tsx`                                                |
| CSS vars    | `styles.css` (`--activity-bar-width`, `--side-panel-width`, `--side-panel-transition`) |

## Como testar

```bash
git checkout feature/v2.2-vscode-layout
npm install && npm test && npm run lint && npm run typecheck
npm run dev
```

1. Ícone de pastas (1º) abre o Explorador
2. Clique em Outline → TOC no painel esquerdo
3. Duplo clique no ícone ativo → painel some (só Activity Bar)
4. Arraste a borda do painel → largura persiste ao reabrir
5. Timeline / Busca → placeholder “em breve”

## Release

```bash
git tag -a v2.2.0 -m "SimplePad v2.2.0 - VS Code style layout"
git push origin v2.2.0
```
