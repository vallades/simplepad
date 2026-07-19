# SimplePad — Project Overview (v1.4.1)

Visão atual do produto na linha **v1.4** (formato Markdown + patch de layout do Outline).  
Histórico completo e arquitetura: [PROJETO.md](./PROJETO.md).

## Versão

| Campo              | Valor                                                                                |
| ------------------ | ------------------------------------------------------------------------------------ |
| **Atual (stable)** | **1.4.1**                                                                            |
| Release            | https://github.com/vallades/simplepad/releases/tag/v1.4.1                            |
| Anterior           | 1.4.0 (formato Markdown antes de salvar)                                             |
| Stack              | Electron · Vite · React · TypeScript · Monaco · Zustand · Tailwind · KaTeX · Mermaid |

## O que o SimplePad é hoje

Editor de texto **minimalista multiplataforma** com abas:

- **Plain Text** ou **Markdown** por aba (antes de salvar)
- Preview GFM com **Outline à direita do Preview**, Math (KaTeX) e Mermaid
- Templates, auto-save (disco + rascunhos untitled), drag & drop de arquivos
- Export HTML/PDF, auto-update via GitHub Releases
- Offline-first: sessão e preferências em `userData`

## Linha do tempo (resumo)

| Versão    | Foco                                                                  |
| --------- | --------------------------------------------------------------------- |
| **1.0.x** | MVP, preview, export, CI/CD, auto-update                              |
| **1.1**   | Split redimensionável, find/replace, busca multi-aba, CONTRIBUTING    |
| **1.2**   | Templates, untitled auto-save, overflow de abas, DnD, updater robusto |
| **1.3**   | Outline, KaTeX, Mermaid, PDF com opções                               |
| **1.4.0** | Toggle Plain Text ↔ Markdown; Salvar como `.md` / `.txt`              |
| **1.4.1** | Outline **à direita do Preview** (não do editor); largura + toggles   |

## Layout do Split View (v1.4.1)

```
┌──────────────────┬─────────────────────────┬──────────┐
│                  │                         │ Outline  │
│     Editor       │   Preview Markdown      │  (TOC)   │
│     (Monaco)     │                         │  direita │
└──────────────────┴─────────────────────────┴──────────┘
```

Outline só com **Markdown + Preview** ativos. Toggle: Status Bar, header do Preview (**TOC**), menu **Exibir**, `⌘⇧O`.

## userData

| Caminho                    | Uso                                          |
| -------------------------- | -------------------------------------------- |
| `session.json`             | Abas, conteúdo, cursor, scroll, `isMarkdown` |
| `preferences.json`         | Settings + recentes                          |
| `templates/templates.json` | Templates de notas                           |
| `untitled-notes/*.md`      | Rascunhos auto-salvos de “Sem título”        |
| logs                       | `electron-log`                               |

## Como desenvolver

```bash
git checkout main
npm install
npm test && npm run lint && npm run typecheck
npm run dev
```

## Como publicar (release)

```bash
# 1. package.json version + CHANGELOG
# 2. commit em main
git tag -a vX.Y.Z -m "SimplePad vX.Y.Z"
git push origin main --tags
# → Actions "Release" gera instaladores + latest*.yml
```

Detalhes: [AUTO_UPDATE.md](./AUTO_UPDATE.md) · [DISTRIBUTION.md](./DISTRIBUTION.md)

## Checklist manual (v1.4.1)

- [ ] Nova aba → Plain Text
- [ ] Toggle Markdown → Preview + linguagem Monaco
- [ ] Outline **à direita** do Preview; clique → linha no editor
- [ ] Salvar como Markdown → `.md`; Plain Text → `.txt`
- [ ] Templates no menu Arquivo
- [ ] Export PDF com opções
- [ ] Auto-update em build packaged (versão &lt; latest)

## Links

| Doc                                  | Conteúdo                    |
| ------------------------------------ | --------------------------- |
| [PROJETO.md](./PROJETO.md)           | Arquitetura, fases, roadmap |
| [AUTO_UPDATE.md](./AUTO_UPDATE.md)   | Publicar e testar updater   |
| [DISTRIBUTION.md](./DISTRIBUTION.md) | Build, signing, CI          |
| [CHANGELOG.md](../CHANGELOG.md)      | Histórico de versões        |
| [README.md](../README.md)            | Entrada do repositório      |
