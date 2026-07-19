# SimplePad — Project Overview (v1.8)

Visão da linha **v1.8 “Produtividade e UX”**.  
Histórico: [PROJETO.md](./PROJETO.md).

## Versão

| Campo     | Valor                                     |
| --------- | ----------------------------------------- |
| **Atual** | **1.8.0**                                 |
| Anterior  | 1.7.0 (YAML Frontmatter / Properties)     |
| Foco      | Snippets, DnD, modo foco, split + outline |

## O que entra na v1.8

1. **Snippets** — atalhos de texto (`;hoje`, `;check`, …) com Tab / Ctrl+Espaço e Settings
2. **Drag & Drop** — soltar vários arquivos de texto na janela abre novas abas + overlay visual
3. **Modo Foco** — F11 / menu; Esc sai; opção de lembrar o estado ao reabrir
4. **Split + Outline** — divisor mais suave; Outline à direita do Preview; toggle e largura persistidos

## Arquitetura (novidades)

| Área     | Caminho principal                                       |
| -------- | ------------------------------------------------------- |
| Snippets | `src/shared/snippets.ts`, `src/main/snippetsManager.ts` |
| Expand   | `src/renderer/services/snippetExpand.ts` + Monaco Tab   |
| Drop     | `fileActions.isDroppableTextPath` + `App` DnD overlay   |
| Focus    | `rememberFocusMode` / `focusModeLast` em settings       |

## Como testar

```bash
git checkout feature/v1.8-productivity-ux
npm install
npm test && npm run lint && npm run typecheck
npm run dev
```

### Snippets

1. No editor, digite `;hoje` e pressione **Tab** → data `YYYY-MM-DD`
2. **Ctrl/Cmd+Espaço** → escolha snippet por número ou trigger
3. Settings → Snippets → edite, adicione e exclua; reinicie o app e confira persistência

### Drag & Drop

1. Arraste um ou vários `.md` / `.txt` / `.json` do Finder para a janela
2. Confirme overlay azul e abas abertas (uma por arquivo)
3. Arraste `.png` → toast de formato não suportado

### Modo Foco

1. **F11** ou menu **Exibir → Modo Distração Zero**
2. Some TabBar, StatusBar e Header; Editor (e Preview se Split) permanece
3. **Esc** sai; em Settings ative “Lembrar modo foco” e reabra o app

### Split + Outline

1. Split View (⌘⇧P): arraste o divisor; reabra e confira `splitRatio`
2. Outline à **direita** do Preview; redimensione; **⌘⇧O** ou TOC para esconder

## Release

```bash
git tag -a v1.8.0 -m "SimplePad v1.8.0 - Produtividade e UX"
git push origin v1.8.0
```
