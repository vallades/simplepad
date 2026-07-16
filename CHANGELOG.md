# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/).

## [1.1.0] — 2026-07-16

**Polimento e Confiança** — split redimensionável, busca, docs de assinatura e contribuição.

### Added

- **Divisor redimensionável** no Split View (arrastar; posição salva em preferências)
- **Orientação do split**: lado a lado ou empilhado (Settings + menu Exibir)
- **Localizar / Substituir** expostos na status bar e menu Editar (Monaco)
- **Ir para linha** (`Ctrl/Cmd+G`)
- **Buscar em todas as abas** (`Ctrl/Cmd+Shift+F`) com lista de resultados por aba
- **CONTRIBUTING.md** + templates de issue/PR (já existentes, documentados)
- **docs/PROJECT_OVERVIEW.md**, placeholders de screenshots, guia de signing ampliado
- Preferências: `splitRatio`, `splitOrientation`

### Changed

- Versão **1.0.1 → 1.1.0**
- Workflow de Release documentado para secrets CSC__/Apple__ (sem forçar assinatura)

### Fixed

- (herdado da linha 1.0.x) CI Windows/bash e concurrency em main

## [1.0.1] — 2026-07-16

Patch de auto-update, CI Windows e documentação.

### Added

- Documentação **[docs/AUTO_UPDATE.md](./docs/AUTO_UPDATE.md)** — fluxo de publicação de versões
- Diálogo nativo ao terminar download da atualização (**Reiniciar agora** / **Depois**)
- Re-check de updates diário com o app aberto
- Flag `silent` nos eventos de update (check em background sem spam de toasts)

### Fixed

- CI Windows: falha após build bem-sucedido por `2>/dev/null` no PowerShell (`D:\dev\null`)
- CI: builds longos em `main` não são mais cancelados por concurrency
- CI/Release: secrets `CSC_*` vazios não quebram o packaging macOS

### Changed

- Toasts de update mais claros (“Nova versão — baixando…”)
- Versão do pacote **1.0.0 → 1.0.1**

## [1.0.0] — 2026-07-14

**SimplePad v1.0.0** — primeiro release estável. Editor multiplataforma minimalista com abas, pronto para download.

### Highlights

- Editor multi-aba com Monaco (undo/redo por aba)
- Preview Markdown em Split View (GFM)
- Exportação HTML e PDF
- Configurações, auto-save e arquivos recentes
- Auto-update via GitHub Releases
- Instaladores Windows, macOS e Linux
- CI/CD com GitHub Actions

### Added

#### Core (MVP)

- Sistema de **abas** com drag & drop, dirty state e atalhos
- **Monaco Editor** (uma instância, modelo por aba, undo/redo isolado)
- Persistência de **sessão** via electron-store (`session.json`)
- Abrir / Salvar / Salvar como com diálogos nativos
- Menu nativo (Arquivo, Editar, Exibir, Ajuda)

#### Experiência (Fase 2)

- **Configurações**: fonte, tamanho, tema (sistema/claro/escuro), auto-save
- **Auto-save** configurável (intervalo, troca de aba, blur)
- **Arquivos recentes** (máx. 10)
- Diálogos nativos de confirmação e **toasts** de feedback
- Status bar: Ln/Col, palavras, caracteres, Salvo/Não salvo, UTF-8

#### Preview & export (Fase 3)

- **Split View** Editor | Preview Markdown (GFM)
- Debounce no preview + sync de scroll
- Toggle modo Markdown (extensão + manual)
- Exportar **HTML** e **PDF**

#### Distribuição, polish e CI

- **Modo Distração Zero** (F11 / Esc)
- **electron-updater** (GitHub Releases) + menu Ajuda
- electron-builder: Windows (NSIS + portable), macOS (DMG + ZIP), Linux (AppImage + deb)
- Nome do app **SimplePad** na barra de menu macOS
- Padding correto para traffic lights (`hiddenInset`)
- **GitHub Actions**: CI multi-OS + workflow de Release
- Documentação: README, CHANGELOG, LICENSE (MIT), `docs/DISTRIBUTION.md`

### Changed

- Versão do pacote **0.1.0 → 1.0.0**
- Chunks lazy para Monaco e markdown (bundle inicial menor)
- UX do header com ícones (Preview, Foco, Config)

### Security

- `contextIsolation: true`, `nodeIntegration: false`
- Renderer `sandbox: false` (workers do Monaco — documentado)
- Janela de PDF export com sandbox habilitado

### Known limitations

- Instalador tipicamente **> 70 MB** (Electron + Monaco)
- Auto-update exige releases publicados com artefatos do electron-builder
- Notarization macOS desligada por padrão (`notarize: false`)

## [0.1.0] — 2026-07-13

### Added

- Fundação do MVP: abas, Monaco, sessão, abrir/salvar, menu nativo

[1.1.0]: https://github.com/vallades/simplepad/releases/tag/v1.1.0
[1.0.1]: https://github.com/vallades/simplepad/releases/tag/v1.0.1
[1.0.0]: https://github.com/vallades/simplepad/releases/tag/v1.0.0
[0.1.0]: https://github.com/vallades/simplepad/releases/tag/v0.1.0
