# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/).

## [1.0.0] — 2026-07-14

Release oficial do MVP completo — editor multiplataforma pronto para distribuição.

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

#### Distribuição & polish

- **Modo Distração Zero** (F11 / Esc)
- **electron-updater** (GitHub Releases) + menu Ajuda
- electron-builder: Windows (NSIS + portable), macOS (DMG + ZIP), Linux (AppImage + deb)
- Nome do app **SimplePad** na barra de menu macOS (`app.setName` + `productName`)
- Padding correto para traffic lights com `hiddenInset`
- Documentação: README, CHANGELOG, LICENSE (MIT), `docs/DISTRIBUTION.md`
- Scripts: `dist`, `dist:mac|win|linux`, `dist:all`, `release`

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
- Auto-update exige releases publicados no GitHub com artefatos do builder
- Notarization macOS desligada por padrão (`notarize: false`)

## [0.1.0] — 2026-07-13

### Added

- Fundação do MVP: abas, Monaco, sessão, abrir/salvar, menu nativo

[1.0.0]: https://github.com/vallades/simplepad/releases/tag/v1.0.0
[0.1.0]: https://github.com/vallades/simplepad/releases/tag/v0.1.0
