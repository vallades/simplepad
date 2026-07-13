# SimplePad

Editor de texto multiplataforma **minimalista** com abas — inspirado no Bloco de Notas e TextEdit.

**Stack:** Electron · Vite · React · TypeScript · Monaco Editor · Zustand · Tailwind CSS · electron-store

> Simples por design. Poderoso por escolha.

---

## Status do projeto

| Área                                                | Status                  |
| --------------------------------------------------- | ----------------------- |
| Setup Electron + Vite + React + TS                  | Concluído               |
| Qualidade (strict, ESLint, Prettier, Husky, Vitest) | Concluído               |
| Sistema de abas (Zustand)                           | Concluído               |
| Monaco Editor (modelo por aba)                      | Concluído               |
| Persistência de sessão no main (`electron-store`)   | Concluído               |
| Abrir / Salvar / Salvar como (diálogos nativos)     | Concluído               |
| Menu nativo + atalhos                               | Concluído               |
| Confirmação ao fechar aba/app com dirty             | Concluído               |
| Preview Markdown / split view                       | Pendente (Fase 3)       |
| Settings (fonte, auto-save, tema forçado)           | Pendente (Fase 2)       |
| Auto-update / code signing                          | Pendente (distribuição) |

Documento de produto: [SimplePad_PRD.md](./SimplePad_PRD.md)

---

## Requisitos

- **Node.js** 20+ (recomendado 22 LTS)
- **npm** 10+

## Começando

```bash
# Instalar dependências
npm install

# Desenvolvimento (HMR no renderer; restart do main quando necessário)
npm run dev
```

O app Electron abre automaticamente.

## Scripts

| Comando                                        | Descrição                              |
| ---------------------------------------------- | -------------------------------------- |
| `npm run dev`                                  | App em desenvolvimento                 |
| `npm run build`                                | Typecheck + build de produção (`out/`) |
| `npm run preview`                              | Pré-visualiza o build                  |
| `npm run test`                                 | Testes unitários (Vitest)              |
| `npm run lint`                                 | ESLint                                 |
| `npm run format`                               | Prettier                               |
| `npm run typecheck`                            | TypeScript (main + renderer)           |
| `npm run dist`                                 | Instaladores (electron-builder)        |
| `npm run dist:mac` / `dist:win` / `dist:linux` | Build por plataforma                   |

---

## O que já foi feito

### Fase 0 — Base do projeto

- Template **electron-vite** com React + TypeScript
- TypeScript **strict** (`strict`, `noImplicitAny`, `strictNullChecks`)
- ESLint (React + TS) + Prettier + integração ESLint/Prettier
- Husky + lint-staged no pre-commit
- Tailwind CSS v4
- Scripts de dev/build/test/dist e `electron-builder.yml`
- Estrutura main / preload / renderer / shared

### Fase 1 — Abas + editor + arquivos + sessão

**Abas (Zustand)**

- Modelo `Tab`: id, título, conteúdo, dirty, markdown, filePath, cursor, scroll, lastModified
- Ações: criar, fechar, trocar, reordenar (drag & drop), dirty state
- Atalhos: `Ctrl/Cmd+N`, `W`, `Tab` / `Shift+Tab`, `O`, `S`, `Shift+S`
- UI: TabBar, StatusBar, confirmação ao fechar aba dirty

**Monaco Editor**

- Uma instância do editor + um modelo por aba (Undo/Redo por aba)
- Sync de conteúdo, cursor e scroll com o store
- Linguagem plaintext / markdown; tema claro/escuro do SO
- Fallback para textarea se o Monaco falhar
- Correções de tela branca e loop de updates React

**Persistência (main process)**

- `SessionManager` com **electron-store** em `app.getPath('userData')`
- Salva/restaura abas + aba ativa + cursor/scroll
- Sanitização se o arquivo de sessão estiver corrompido
- Interop ESM/CJS do `electron-store` no build CJS do main
- Debounce de save no renderer + flush no quit

**Arquivos nativos**

- `FileManager`: open/save dialogs, read/write UTF-8
- Filtros `.txt`, `.md`, todos os arquivos
- IPC tipado + `contextBridge` no preload
- Salvar / Salvar como atualizam `filePath`, título e limpam dirty

**Menu e quit**

- Menu Arquivo/Editar/Exibir ligado às ações
- Confirmação ao sair com alterações não salvas
- Sessão gravada antes de encerrar

**Qualidade**

- Testes Vitest (store, sessão, utils, bridge)
- `electron-log` no main
- Segurança: `contextIsolation`, sem `nodeIntegration`, API só via preload

---

## O que ainda precisa fazer

### Curto prazo (polimento da Fase 1)

- [ ] Diálogo nativo do Electron no lugar de `window.confirm` (UX mais nativa)
- [ ] Lista de arquivos recentes
- [ ] Tratamento visual de erros de I/O na UI (toast/banner)
- [ ] Garantir `sandbox: true` com Monaco estável (hoje `sandbox: false` por workers)

### Fase 2 — Experiência

- [ ] Auto-save configurável (intervalo + ao trocar de aba)
- [ ] Janela de Configurações (fonte, tamanho, tema)
- [ ] Tema claro/escuro forçado (além do “seguir o sistema”)
- [ ] Status bar completa (encoding, tipo de arquivo mais rico)
- [ ] Logging/erros centralizados no renderer

### Fase 3 — v1.0

- [ ] Split view Editor | Preview Markdown
- [ ] Exportar para PDF/HTML
- [ ] Otimizar tamanho do instalador (Monaco tree-shaking / lazy chunks)
- [ ] Auto-update (`electron-updater`)
- [ ] Code signing / notarization (macOS) documentados e aplicados

### Distribuição

- [ ] CI (build + test + artefatos por SO)
- [ ] Página de releases / changelog

---

## Estrutura de pastas

```
simplepad/
├── src/
│   ├── main/                    # Processo principal Electron
│   │   ├── index.ts
│   │   ├── menu.ts
│   │   ├── ipc.ts
│   │   ├── quitController.ts
│   │   ├── sessionManager.ts    # electron-store
│   │   └── fileManager.ts       # diálogos + fs
│   ├── preload/
│   │   ├── index.ts             # contextBridge
│   │   └── index.d.ts
│   ├── shared/                  # Contratos IPC / sessão
│   │   ├── session.ts
│   │   └── sessionSanitize.ts
│   └── renderer/
│       ├── components/          # TabBar, Editor, StatusBar, …
│       ├── store/useTabsStore.ts
│       ├── services/            # sessionBridge, fileActions
│       ├── monaco/              # setup + model registry
│       ├── utils/
│       ├── App.tsx
│       └── main.tsx
├── build/                       # Ícones do instalador
├── resources/                   # Ícone do app
├── electron.vite.config.ts
├── electron-builder.yml
├── package.json
├── SimplePad_PRD.md
└── README.md
```

---

## Persistência e dados locais

A sessão **não** fica no repositório. O main grava em:

| SO      | Caminho típico                                         |
| ------- | ------------------------------------------------------ |
| macOS   | `~/Library/Application Support/simplepad/session.json` |
| Windows | `%APPDATA%/simplepad/session.json`                     |
| Linux   | `~/.config/simplepad/session.json`                     |

Logs do main (electron-log) também ficam sob o diretório de dados do app.

---

## Atalhos principais

| Atalho                       | Ação                 |
| ---------------------------- | -------------------- |
| `Ctrl/Cmd+N`                 | Nova aba             |
| `Ctrl/Cmd+O`                 | Abrir arquivo(s)     |
| `Ctrl/Cmd+S`                 | Salvar               |
| `Ctrl/Cmd+Shift+S`           | Salvar como          |
| `Ctrl/Cmd+W`                 | Fechar aba           |
| `Ctrl/Cmd+Tab` / `Shift+Tab` | Alternar abas        |
| `Ctrl/Cmd+Z` / `Y`           | Undo / Redo (Monaco) |

---

## Qualidade de código

- TypeScript strict
- ESLint + Prettier
- Husky + lint-staged
- Vitest

```bash
npm test
npm run typecheck
npm run lint
```

## Segurança (Electron)

- `contextIsolation: true`
- `nodeIntegration: false`
- Superfície IPC mínima e tipada no preload
- (Nota) `sandbox` está `false` temporariamente por compatibilidade com workers do Monaco

## Build e distribuição

```bash
npm run build
npm run dist          # plataforma atual
npm run dist:mac      # .dmg
npm run dist:win      # .exe
npm run dist:linux    # AppImage + .deb
```

Artefatos em `dist/`. Ícones em `build/` e `resources/`.

---

## Licença

MIT
