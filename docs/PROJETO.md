# SimplePad — Visão geral do projeto

Documento de contexto: o que foi construído, decisões técnicas, limitações, oportunidades de melhoria e ideias de futuro.

| Campo            | Valor                                                                                                                                        |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **Produto**      | SimplePad — editor de texto multiplataforma minimalista com abas                                                                             |
| **Versão atual** | **1.4.1** (Outline à direita do Preview + linha 1.4 de formato Markdown)                                                                     |
| **Licença**      | MIT                                                                                                                                          |
| **Repositório**  | https://github.com/vallades/simplepad                                                                                                        |
| **Release**      | https://github.com/vallades/simplepad/releases/tag/v1.4.1                                                                                    |
| **Stack**        | Electron · Vite · React 19 · TypeScript · Monaco · Zustand · Tailwind · electron-store · react-markdown · KaTeX · Mermaid · electron-updater |
| **Inspiração**   | Bloco de Notas / TextEdit — simples por design                                                                                               |

Documentos relacionados: [README](../README.md) · [CHANGELOG](../CHANGELOG.md) · [PROJECT_OVERVIEW](./PROJECT_OVERVIEW.md) · [DISTRIBUTION](./DISTRIBUTION.md) · [AUTO_UPDATE](./AUTO_UPDATE.md) · [PRD original](../SimplePad_PRD.md) · [Notas v1.4.1](./RELEASE_NOTES_v1.4.1.md)

---

## 1. Propósito e princípios

SimplePad existe para ser um **bloco de notas moderno multiplataforma**:

- Abrir rápido, digitar, salvar, fechar.
- Múltiplas abas sem complexidade de IDE.
- Markdown quando quiser (preview + export), sem forçar “app de notas na nuvem”.
- UX nativa (menu, diálogos, atalhos) em macOS, Windows e Linux.

**Princípios de produto:**

1. **Minimalismo visual** — chrome fino, sem painéis desnecessários.
2. **Dados locais** — sessão e preferências no `userData`; arquivos no disco do usuário.
3. **Segurança Electron** — `contextIsolation`, sem `nodeIntegration`, IPC tipado.
4. **Qualidade de engenharia** — TypeScript strict, testes, lint, CI multi-OS.

---

## 2. Histórico de entrega (fases)

### Fase 0 — Fundação

- Scaffold **electron-vite** (React + TypeScript)
- ESLint, Prettier, Husky + lint-staged, Vitest
- Tailwind CSS v4
- Estrutura `main` / `preload` / `renderer` / `shared`

### Fase 1 — MVP Core

| Capacidade | Detalhe                                                             |
| ---------- | ------------------------------------------------------------------- |
| Abas       | Zustand: criar, fechar, trocar, reordenar (drag & drop), dirty `*`  |
| Monaco     | Uma instância, modelo por aba, undo/redo isolado, fallback textarea |
| Sessão     | `SessionManager` + `electron-store` → restaura abas, cursor, scroll |
| Arquivos   | Abrir / Salvar / Salvar como (diálogos nativos, UTF-8)              |
| Menu       | Arquivo, Editar, Exibir + atalhos                                   |
| Quit       | Confirmação com alterações não salvas + flush de sessão             |

### Fase 2 — Experiência

| Capacidade   | Detalhe                                                      |
| ------------ | ------------------------------------------------------------ |
| Settings     | Fonte, tamanho, tema (sistema/claro/escuro), auto-save       |
| Persistência | `preferences.json` (settings + recentes)                     |
| Auto-save    | Intervalo, troca de aba, blur                                |
| Status bar   | Ln/Col, palavras/caracteres, Salvo/Não salvo, encoding UTF-8 |

### Fase 3 — Preview e export

| Capacidade | Detalhe                                             |
| ---------- | --------------------------------------------------- |
| Split View | Editor \| Preview (`react-markdown` + `remark-gfm`) |
| Export     | HTML standalone e PDF (`printToPDF`)                |

### v1.0 — Distribuição

Modo foco, electron-updater, electron-builder (Win/mac/Linux), CI/CD, docs oficiais.

### v1.1 — Polimento e confiança

Split redimensionável + orientação; Find/Replace/Ir à linha; busca em todas as abas; CONTRIBUTING e templates de issue/PR; docs de signing.

### v1.2 — Produtividade

Templates de notas (`userData/templates/`); auto-save de “Sem título” em `untitled-notes/`; overflow de abas (**…**); drag & drop de `.txt`/`.md`; auto-update com `setFeedURL` GitHub + contorno de signature no Mac.

### v1.3 — Markdown avançado

Outline (TOC); Math (KaTeX); Mermaid; export PDF com margens/tema/outline; preferências de Markdown avançado.

### v1.4 — Formato e layout do Outline

| Versão    | Entrega                                                                                                                 |
| --------- | ----------------------------------------------------------------------------------------------------------------------- |
| **1.4.0** | Nova aba em Plain Text; toggle Markdown (Status Bar + menu da aba); Salvar como `.md`/`.txt`; settings de padrão da aba |
| **1.4.1** | Outline **à direita do Preview**; `outlineWidth` persistida; toggles ⌘⇧O / TOC / Status Bar                             |

---

## 3. Arquitetura técnica

```
simplepad/
├── src/
│   ├── main/
│   │   ├── index.ts, ipc.ts, menu.ts, quitController.ts
│   │   ├── sessionManager.ts, preferencesManager.ts, fileManager.ts
│   │   ├── exportManager.ts, updater.ts
│   │   ├── templateManager.ts, untitledNotesManager.ts
│   ├── preload/          # contextBridge → window.api
│   ├── shared/           # session, settings, templates, untitledNotes (+ sanitize)
│   └── renderer/
│       ├── components/   # Editor, Preview (+ Outline à direita), TabBar, StatusBar, Settings…
│       ├── store/        # tabs, settings, toast, ui
│       ├── services/     # file, session, autoSave, export, markdownMode, templates, update
│       ├── monaco/       # setup + model registry
│       └── utils/        # outline, markdownExport, fileUtils…
├── .github/workflows/    # ci.yml, release.yml
├── docs/
└── electron-builder.yml
```

### Fluxo de dados

1. **Renderer** edita via Monaco → Zustand (`useTabsStore`).
2. Sessão debounced → IPC → **main** grava `session.json`.
3. Arquivos / export / diálogos / update → IPC → **main**.
4. Preferências → `preferences.json`; templates → `templates/templates.json`.
5. Preview (e Outline) só com Split View; Outline só com Markdown.

### Dados no disco (userData)

| Caminho                    | Conteúdo                                                |
| -------------------------- | ------------------------------------------------------- |
| `session.json`             | Abas, conteúdo, cursor, scroll, `isMarkdown`, aba ativa |
| `preferences.json`         | Settings + recentes                                     |
| `templates/templates.json` | Templates de notas                                      |
| `untitled-notes/*.md`      | Rascunhos auto-salvos                                   |
| logs                       | `electron-log`                                          |

Caminhos típicos: macOS `~/Library/Application Support/simplepad/`, Windows `%APPDATA%/simplepad/`, Linux `~/.config/simplepad/`.

### Layout Split View (v1.4.1)

```
[ Editor (Monaco) ] | [ Preview Markdown | Outline TOC ]
```

---

## 4. Funcionalidades entregues (checklist)

### Editor e abas

- [x] Múltiplas abas, reordenação, dirty state, overflow (**…**)
- [x] Plain Text ↔ Markdown por aba; badge MD; menu de contexto
- [x] Monaco com modelo por aba; linguagem reage a `isMarkdown`
- [x] Sessão restaurada (inclui formato Markdown)

### Arquivos e feedback

- [x] Diálogos nativos; recentes; DnD `.txt`/`.md`
- [x] Salvar como com extensão por formato (`.md` / `.txt`)
- [x] Auto-save em disco e em untitled-notes
- [x] Templates (menu + Settings)
- [x] Confirmações nativas e toasts

### Markdown e export

- [x] Split preview GFM, redimensionável, orientação
- [x] Outline à **direita** do Preview (toggle, largura, debounce)
- [x] KaTeX e Mermaid (toggles)
- [x] Export HTML / PDF (opções de PDF)

### UX e distribuição

- [x] Tema, fonte, modo foco, status bar
- [x] Instaladores 3 plataformas + auto-update GitHub
- [x] CI + Release; testes unitários; TypeScript strict

---

## 5. Problemas encontrados e como foram resolvidos

| Problema                          | Causa                        | Solução                                |
| --------------------------------- | ---------------------------- | -------------------------------------- |
| Título sob traffic lights (macOS) | `hiddenInset` sem padding    | `mac-titlebar-pad`                     |
| Menu “Electron” em dev            | Nome do binário              | `app.setName` + productName            |
| Release mac: CSC vazio            | `CSC_LINK=""`                | Exportar secrets só se não-vazios      |
| Job canceled em main              | concurrency                  | Não cancelar builds longos em main     |
| Auto-update sem detecção          | feed ≤ app / sem latest*.yml | Docs + setFeedURL + releases com yml   |
| Mac: signature no install         | Squirrel + ad-hoc            | Instalador custom zip + xattr          |
| Outline à esquerda do editor      | Layout inicial v1.3          | Mover para direita do Preview (v1.4.1) |
| Instalador > 70 MB                | Electron + Monaco            | Limitação documentada; chunks lazy     |

---

## 6. Métricas e qualidade (estado v1.4)

| Área         | Estado                                                                          |
| ------------ | ------------------------------------------------------------------------------- |
| Testes       | 100+ unitários (Vitest): stores, sanitize, outline, export, markdown mode, etc. |
| Coverage     | `npm run test:coverage`                                                         |
| Bundle       | Monaco, markdown, katex, mermaid em chunks separados                            |
| Instaladores | Ordem de ~100 MB+ por artefato (típico Electron)                                |

---

## 7. Oportunidades de melhoria

### 7.1 Alta prioridade (confiança)

| Melhoria                         | Por quê                       |
| -------------------------------- | ----------------------------- |
| Code signing + notarização macOS | Gatekeeper                    |
| Authenticode Windows             | SmartScreen                   |
| Screenshots reais                | README / marketing            |
| Smoke E2E                        | CI ainda é unitário + package |

### 7.2 Performance e tamanho

| Melhoria                          | Por quê                  |
| --------------------------------- | ------------------------ |
| Reduzir workers/linguagens Monaco | Download e RAM           |
| Avaliar editor “lite” opcional    | Meta de instalador menor |

### 7.3 Segurança

| Melhoria                  | Por quê          |
| ------------------------- | ---------------- |
| `sandbox: true` + workers | Postura Electron |
| CSP no renderer           | XSS              |

### 7.4 UX (próximas ideias)

| Melhoria                        | Por quê              |
| ------------------------------- | -------------------- |
| Encoding configurável           | Hoje UTF-8 fixo      |
| i18n (pt-BR / en)               | Strings em português |
| Acessibilidade (modais, toasts) | Inclusão             |

### 7.5 Engenharia

| Melhoria                              | Por quê         |
| ------------------------------------- | --------------- |
| Coverage gates no CI                  | Regressão       |
| Dependabot / Renovate                 | Electron/Monaco |
| release-please / changelog automático | Menos fricção   |

---

## 8. Roadmap

### Entregue

- [x] v1.0 — MVP + distribuição
- [x] v1.1 — Polimento e confiança
- [x] v1.2 — Produtividade
- [x] v1.3 — Markdown avançado
- [x] v1.4 — Formato Markdown + layout Outline

### Futuro sugerido (v1.5+)

- Assinatura de código em CI (quando houver certificados)
- Screenshots e onboarding visual
- Encoding / i18n leve
- Workspace de pasta local (ainda offline-first)

### v2.0 (avaliar fit ao minimalismo)

- Sync opcional (folder / iCloud — sem SaaS por padrão)
- Plugins leves
- Preview web view-only

> Filtrar pelo princípio: **não virar IDE nem app de notas na nuvem sem opção offline-first.**

---

## 9. Atalhos atuais (referência)

| Atalho                   | Ação                    |
| ------------------------ | ----------------------- |
| `Ctrl/Cmd+N`             | Nova aba                |
| `Ctrl/Cmd+O`             | Abrir                   |
| `Ctrl/Cmd+S` / `Shift+S` | Salvar / Salvar como    |
| `Ctrl/Cmd+W`             | Fechar aba              |
| `Ctrl/Cmd+,`             | Configurações           |
| `Ctrl/Cmd+Shift+P`       | Toggle Preview          |
| `Ctrl/Cmd+Shift+M`       | Toggle Markdown         |
| `Ctrl/Cmd+Shift+O`       | Toggle Outline (TOC)    |
| `Ctrl/Cmd+F` / `Alt+F`   | Localizar / Substituir  |
| `Ctrl/Cmd+G`             | Ir para linha           |
| `Ctrl/Cmd+Shift+F`       | Buscar em todas as abas |
| `Ctrl/Cmd+Shift+U`       | Verificar atualizações  |
| `Ctrl/Cmd+Tab`           | Alternar abas           |
| `F11` / `Esc`            | Modo foco / sair        |

---

## 10. Como rodar e distribuir

```bash
npm install
npm run dev
npm test && npm run lint && npm run typecheck
npm run dist:mac   # ou dist:win / dist:linux
```

CI: push/PR em `main` → `.github/workflows/ci.yml`  
Release: tag `v*` → `.github/workflows/release.yml`

Detalhes: [DISTRIBUTION.md](./DISTRIBUTION.md) · [AUTO_UPDATE.md](./AUTO_UPDATE.md).

---

## 11. Riscos conhecidos

1. **Tamanho do instalador** — Electron + Monaco.
2. **Gatekeeper / SmartScreen** sem signing.
3. **Auto-update** exige Release com `latest*.yml` e versão maior.
4. **Monaco workers** — `sandbox: false` no renderer.
5. **macOS update nativo** sem Developer ID — contorno via instalador custom (docs).

---

## 12. Conclusão

A **v1.4.1** consolida o ciclo do PRD e as linhas de produtividade e Markdown avançado:

- Editor multi-aba confiável, offline-first
- Markdown com preview, outline, math e diagramas
- Formato da aba antes de salvar
- Distribuição multi-OS, CI e auto-update

O produto está **pronto para uso real**. Melhor ROI pós-1.4:

1. Assinatura de builds
2. Screenshots reais
3. Redução de peso do editor
4. Pequenos polimentos de acessibilidade/i18n

sem abandonar o espírito **“simples por design”**.
