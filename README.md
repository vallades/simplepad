# SimplePad

Editor de texto multiplataforma **minimalista** com abas — inspirado no Bloco de Notas e TextEdit.

**Versão:** [1.0.0](https://github.com/vallades/simplepad/releases/tag/v1.0.0) · **Licença:** [MIT](./LICENSE)

**Stack:** Electron · Vite · React · TypeScript · Monaco · Zustand · Tailwind · electron-store · react-markdown · electron-updater

[![CI](https://github.com/vallades/simplepad/actions/workflows/ci.yml/badge.svg)](https://github.com/vallades/simplepad/actions/workflows/ci.yml)
[![Release](https://github.com/vallades/simplepad/actions/workflows/release.yml/badge.svg)](https://github.com/vallades/simplepad/actions/workflows/release.yml)
[![GitHub release](https://img.shields.io/github/v/release/vallades/simplepad?label=download)](https://github.com/vallades/simplepad/releases/latest)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

> Simples por design. Poderoso por escolha.

### Download

Instaladores oficiais da **[v1.0.0](https://github.com/vallades/simplepad/releases/tag/v1.0.0)**:

| Plataforma | Arquivo típico                        |
| ---------- | ------------------------------------- |
| macOS      | `.dmg` / `.zip`                       |
| Windows    | `-setup.exe` (NSIS) / `-portable.exe` |
| Linux      | `.AppImage` / `.deb`                  |

→ [Todas as releases](https://github.com/vallades/simplepad/releases)

---

## Status

| Área                           | Status    |
| ------------------------------ | --------- |
| MVP + abas + Monaco + arquivos | Concluído |
| Configurações + auto-save      | Concluído |
| Preview Markdown + export      | Concluído |
| Distração zero + auto-update   | Concluído |
| Distribuição (builder + docs)  | Concluído |
| CI/CD (GitHub Actions)         | Concluído |

---

## Funcionalidades

- **Abas** com drag & drop, dirty state, undo/redo por aba
- **Persistência de sessão** (conteúdo, cursor, scroll)
- **Abrir / Salvar / Salvar como** + **Recentes**
- **Configurações**: fonte, tamanho, tema, auto-save
- **Split View** Editor \| Preview Markdown (GFM)
- **Exportar** HTML e PDF
- **Modo Distração Zero** (F11) — fullscreen sem chrome
- **Auto-update** via GitHub Releases
- Toasts e diálogos nativos

### Screenshots

Coloque imagens em [`docs/screenshots/`](./docs/screenshots/README.md):

| Arquivo          | Conteúdo            |
| ---------------- | ------------------- |
| `tabbar.png`     | Barra de abas       |
| `split-view.png` | Editor + Preview    |
| `settings.png`   | Configurações       |
| `focus-mode.png` | Modo distração zero |

```markdown
![Split View](docs/screenshots/split-view.png)
```

---

## Começando

```bash
# Node 20+ recomendado
npm install
npm run dev
```

### Scripts

| Comando                 | Descrição                         |
| ----------------------- | --------------------------------- |
| `npm run dev`           | Desenvolvimento                   |
| `npm test`              | Testes unitários                  |
| `npm run test:coverage` | Testes + coverage (Vitest/v8)     |
| `npm run typecheck`     | TypeScript strict                 |
| `npm run lint`          | ESLint                            |
| `npm run build`         | Build de produção (`out/`)        |
| `npm run dist`          | Instalador da plataforma atual    |
| `npm run dist:mac`      | DMG + ZIP                         |
| `npm run dist:win`      | NSIS + portable                   |
| `npm run dist:linux`    | AppImage + deb                    |
| `npm run dist:all`      | mac + win + linux                 |
| `npm run release`       | Build + publish (GitHub Releases) |

Guia completo: [docs/DISTRIBUTION.md](./docs/DISTRIBUTION.md)

**Documentação do projeto:** [docs/PROJETO.md](./docs/PROJETO.md) — o que foi feito, decisões, melhorias e roadmap.

---

## CI/CD

Workflows em [`.github/workflows/`](./.github/workflows/):

| Workflow    | Arquivo                                          | Quando                     | O que faz                                                                                  |
| ----------- | ------------------------------------------------ | -------------------------- | ------------------------------------------------------------------------------------------ |
| **CI**      | [`ci.yml`](./.github/workflows/ci.yml)           | Push/PR em `main`          | Lint, typecheck, testes + coverage, instaladores (Ubuntu/Windows/macOS) como **Artifacts** |
| **Release** | [`release.yml`](./.github/workflows/release.yml) | Tag `v*` ou _Run workflow_ | Instaladores oficiais + **GitHub Release** (`softprops/action-gh-release`)                 |

### Jobs do CI

1. **Lint & Type Check** — `npm run lint` + `npm run typecheck` (Node 22)
2. **Tests** — `npm run test:coverage` (artifact de coverage)
3. **Build (matrix)** — `electron-vite build` + `electron-builder` por SO (timeout **60 min**)
4. **CI Success** — agregador para _branch protection_

**Timeout do Build (60 min):** o passo mais lento é o **macOS** (download do Electron, packaging arm64, geração de **DMG** + ZIP e blockmaps). Em runners do GitHub isso costuma levar vários minutos a mais que Linux/Windows. O job usa 60 minutos para evitar falhas por tempo e **não cancela** runs em andamento em `main` (só cancela CI desatualizado em PRs) — senão o log termina com _“The operation was canceled.”_ logo após o DMG/ZIP terem sido gerados com sucesso.

### Secrets (code signing, opcional)

| Secret                        | Uso                    |
| ----------------------------- | ---------------------- |
| `CSC_LINK`                    | Certificado (Win/mac)  |
| `CSC_KEY_PASSWORD`            | Senha do certificado   |
| `APPLE_ID`                    | Conta Apple (notarize) |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password  |
| `APPLE_TEAM_ID`               | Team ID                |

### Como validar

```bash
# Espelha jobs 1–2 localmente
npm ci
npm run lint && npm run typecheck && npm run test:coverage

# Dispara CI no GitHub
git push origin main   # ou abra um PR

# Dispara Release
git tag -a v1.0.1 -m "SimplePad v1.0.1"
git push origin v1.0.1
# ou Actions → Release → Run workflow
```

Artifacts: **Actions → run → Artifacts** (`simplepad-linux`, `simplepad-windows`, `simplepad-macos`, `coverage-report`).

---

## Atalhos

| Atalho                       | Ação                        |
| ---------------------------- | --------------------------- |
| `Ctrl/Cmd+N`                 | Nova aba                    |
| `Ctrl/Cmd+O`                 | Abrir                       |
| `Ctrl/Cmd+S`                 | Salvar                      |
| `Ctrl/Cmd+Shift+S`           | Salvar como                 |
| `Ctrl/Cmd+W`                 | Fechar aba                  |
| `Ctrl/Cmd+,`                 | Configurações               |
| `Ctrl/Cmd+Shift+P`           | Toggle Preview / Split View |
| `Ctrl/Cmd+Shift+M`           | Toggle modo Markdown        |
| `Ctrl/Cmd+Tab` / `Shift+Tab` | Alternar abas               |
| `F11`                        | Modo Distração Zero         |
| `Esc`                        | Sair do modo foco           |
| `Ctrl/Cmd+Z` / `Y`           | Undo / Redo (Monaco)        |

Menu **Ajuda → Verificar atualizações…** para checar updates.

---

## Arquitetura

```
src/
├── main/           # Electron main, IPC, updater, export, menu
├── preload/        # contextBridge tipado
├── shared/         # contratos sessão/settings
└── renderer/       # React UI, Monaco, preview, stores
```

Dados locais:

- `session.json` — abas
- `preferences.json` — settings + recentes

macOS: `~/Library/Application Support/simplepad/`

---

## Build e distribuição

```bash
npm test && npm run typecheck && npm run lint
npm run dist:mac    # ou dist:win / dist:linux
```

### Tamanho do instalador

Electron + Monaco dominam o peso. Com `compression: maximum` e chunks lazy, o **shell** inicial é leve, mas o instalador completo costuma ficar **acima de 70 MB**. Isso é esperado; ver [docs/DISTRIBUTION.md](./docs/DISTRIBUTION.md).

### Code signing / notarization

Documentado em [docs/DISTRIBUTION.md](./docs/DISTRIBUTION.md) (Windows Authenticode, macOS Developer ID + notarize).

---

## Limitações conhecidas

- Renderer com **`sandbox: false`** por causa dos workers do Monaco
- Auto-update em **dev** precisa de feed (`dev-app-update.yml`); sem feed, o erro no toast é esperado
- Notarization macOS **desligada** por padrão (`notarize: false`)
- Meta &lt; 70 MB de instalador é **difícil** com Electron+Monaco intactos

---

## Como contribuir

1. Fork e clone
2. `npm install`
3. Crie branch: `git checkout -b feat/minha-feature`
4. Commits no estilo [Conventional Commits](https://www.conventionalcommits.org/)
5. `npm test && npm run lint && npm run typecheck`
6. Abra um Pull Request

Sugestões bem-vindas: acessibilidade, i18n, redução de bundle, temas.

---

## Roadmap futuro

- [ ] CI multi-OS (GitHub Actions) com artefatos assinados
- [ ] Preview layout vertical / painel redimensionável
- [ ] Tree-shake mais agressivo dos workers Monaco
- [ ] Canal de pre-releases no updater
- [ ] Screenshots oficiais no README
- [ ] Plugin / extensões leves (opcional)

Histórico: [CHANGELOG.md](./CHANGELOG.md)

---

## Licença

[MIT](./LICENSE) © SimplePad contributors
