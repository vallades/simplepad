# SimplePad v1.4.1 — Release notes

**Data:** 2026-07-19  
**Tag:** [v1.4.1](https://github.com/vallades/simplepad/releases/tag/v1.4.1)

## Destaque

**Outline (TOC) à direita do Preview** — o sumário de headings deixa de aparecer à esquerda do editor e fica ancorado ao painel de Preview no Split View.

## Layout

```
Editor  |  Preview Markdown  |  Outline (TOC)
```

## Correções

- Posição do Outline: **direita do Preview**
- Outline só com Markdown + Split View
- Colapso em telas / painéis estreitos

## Melhorias desta patch

- Largura do Outline persistida (`outlineWidth`, padrão 220px; arraste a borda)
- Toggle: Status Bar **Outline**, header do Preview **TOC**, menu **Exibir → Outline Markdown**, `⌘⇧O`

## Inclui (linha 1.4)

- Plain Text vs Markdown por aba (antes de salvar)
- Salvar como → `.md` ou `.txt` conforme o modo
- Settings: nova aba padrão Markdown; auto-Preview ao ativar Markdown

## Download

https://github.com/vallades/simplepad/releases/tag/v1.4.1

### macOS Gatekeeper

Se o app aparecer como “danificado”:

```bash
xattr -cr /Applications/SimplePad.app
open /Applications/SimplePad.app
```

## Atualização automática

Com o app **instalado** (não `npm run dev`), o SimplePad consulta o feed GitHub (`latest*.yml`).  
Se a versão instalada for **&lt; 1.4.1**, deve oferecer download e reinício.

Ver [AUTO_UPDATE.md](./AUTO_UPDATE.md).
