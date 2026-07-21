# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/).

## [2.4.0] — 2026-07-21

**Polimento da Sidebar + Links Internos** (`[[Nota]]`).

### Added

- **Wiki links** `[[Nome da Nota]]` / `[[Nota|rótulo]]` no editor e no Preview
- Ctrl/Cmd+clique no editor (decoração pontilhada) e clique no Preview abrem a nota
- Resolução no workspace (`workspace:resolve-wiki`); cria `.md` se não existir e houver pasta aberta
- **Backlinks** no painel Outline: “Links para esta nota” (abas abertas)
- Activity Bar: ícone `FolderTree`, hover/scale, indicador azul mais visível

### Changed

- Versão **2.3.0 → 2.4.0**

## [2.3.0] — 2026-07-21

**Sidebar real** — Outline, busca global e Timeline no Side Panel.

### Added

- **Outline** hierárquico da aba Markdown ativa (debounce, clique → scroll suave no editor)
- **Busca global**: abas abertas + arquivos do workspace (IPC `workspace:search`, resultados com linha/trecho)
- **Timeline**: últimas 20 notas (recentes + abas abertas com path); clique abre/foca
- IPC `workspace:timeline`; animação ao trocar de view no Side Panel

### Changed

- Activity Bar: Timeline e Busca deixam de ser placeholders
- Versão **2.2.0 → 2.3.0**

## [2.2.0] — 2026-07-21

**Layout estilo Visual Studio Code** — Activity Bar, Side Panel e animações.

### Added

- **Activity Bar** (~48px) à esquerda com ícones: Explorador (primeiro), Outline, Timeline, Busca
- Clique simples no ícone abre a view; **duplo clique** recolhe o Side Panel
- **Side Panel** redimensionável (padrão 240px) com transição suave (300ms)
- Views: Explorador de arquivos, Outline (TOC), placeholders Timeline e Busca
- Preferências: `activeView`, `sidePanelCollapsed`, `sidebarWidth` (persistidas)

### Changed

- Layout principal: Activity Bar | Side Panel | Editor (+ Preview no split)
- ⌘B / Ctrl+B alterna colapso do Side Panel
- Versão **2.1.0 → 2.2.0**

## [2.1.0] — 2026-07-21

**File Explorer avançado + correções de workspace + menus de contexto.**

### Fixed

- Rascunhos **untitled / não salvos** permanecem abertos ao trocar de workspace (sessão Pessoal/global continua salva em separado)
- Árvore do explorador **atualiza** ao criar/salvar notas no workspace (eventos + chokidar)
- **Nova nota / pasta / renomear** no explorador: input inline (Electron não implementa `window.prompt`)
- Clique em arquivo no explorador **atualiza o editor** (sync do model Monaco + reload do disco)

### Added

- Toolbar da sidebar: Nova nota, Nova pasta, Atualizar, Expandir, Recolher
- Drag & drop de arquivos de texto para dentro da sidebar (copia para a pasta)
- Watcher de arquivos no workspace (`chokidar`) com refresh debounced
- Indicador de loading ao atualizar a árvore
- **Menus de contexto ricos**:
  - **Abas:** fechar / fechar outras / à direita / todas, salvar, recarregar, copiar caminho/nome, revelar no Finder/Explorer, formato MD/texto, duplicar, nova aba
  - **Explorador:** abrir, abrir com app padrão, expandir/recolher, nova nota/pasta, renomear, duplicar, copiar caminho/nome, revelar, excluir, atualizar
- IPC: `shell:show-item-in-folder`, `shell:open-path`, `workspace:duplicate`

### Changed

- Versão **2.0.0 → 2.1.0**

## [2.0.0] — 2026-07-19

**Workspaces + File Explorer** — vaults leves por pasta e sidebar de arquivos.

### Added

- **Workspaces**: Abrir pasta como workspace (`Arquivo → Abrir pasta…`, `⌘⌥O`)
- Dados por workspace: `session`, `preferences`, `templates`, `untitled-notes` em `userData/workspaces/<id>/`
- Modo **Pessoal** (sem pasta) mantém dados no `userData` global
- Menu **Workspaces recentes** (últimos 5)
- Status Bar com nome do workspace (clicável)
- **File Explorer** (sidebar esquerda): árvore lazy, busca, clique abre aba
- Toggle explorador: `⌘B` / `Ctrl+B`, menu Exibir, botão no header
- Persistência por workspace: `sidebarOpen` (padrão fechado), `sidebarWidth`

### Changed

- Versão **1.8.0 → 2.0.0** (major: novo modelo de dados multi-workspace)

## [1.8.0] — 2026-07-19

**Produtividade e UX** — snippets, drag & drop aprimorado, modo foco e split/outline.

### Added

- **Snippets** de texto (ex: `;hoje` → data atual) com placeholders `{{date}}`, `{{time}}`, `{{datetime}}` e `$0`
- Snippets padrão: data, hora, agora, checklist, reunião, ideia
- Aba **Snippets** em Configurações (adicionar / editar / excluir); persistência em `userData/snippets/snippets.json`
- Expansão no editor: **Tab** (após o trigger) ou **Ctrl/Cmd+Espaço** (seletor)
- **Drag & drop** de arquivos de texto do Finder/Explorer em qualquer lugar da janela → abre em novas abas (múltiplos de uma vez)
- Extensões suportadas no drop: `.txt`, `.md`, `.json`, `.ts`, `.csv`, `.yml`, código e outros formatos de texto
- Feedback visual ao arrastar (borda destacada + overlay)
- **Modo Foco** persistente opcional (`rememberFocusMode` / `focusModeLast` em Settings)

### Changed

- Divisor do Split View mais largo e com destaque visual ao hover/arraste; posição (`splitRatio`) já persistida
- Outline continua **sempre à direita do Preview**, com redimensionamento e toggle (⌘⇧O / menu / Status Bar)
- Versão **1.7.0 → 1.8.0**

## [1.7.0] — 2026-07-19

**YAML Frontmatter + Properties** — metadata no topo das notas Markdown, visível no Preview.

### Added

- Parser de **YAML frontmatter** (`---` … `---`) com `gray-matter`
- **PropertiesPanel** no Preview (cards minimalistas; tags como badges; tema claro/escuro)
- Toggle **Mostrar Properties** (Preview header **Props**, Status Bar, menu **Exibir**, `⌘⇧Y`)
- Settings: **Properties (YAML frontmatter)** / `showMarkdownProperties`
- Editor Monaco/textarea mostra **só o body** (frontmatter oculto, preservado no save/sessão)
- Outline e export HTML/PDF usam body sem o bloco YAML

### Changed

- Versão **1.5.0 → 1.7.0**

## [1.5.0] — 2026-07-19

**Mermaid Avançado** — tema do app, export PNG/SVG, zoom/pan e erros amigáveis.

### Added

- Tema Mermaid sincronizado com claro/escuro do app (`themeVariables` + Tailwind)
- Export de cada diagrama: **PNG** (2×) e **SVG** via diálogo nativo (hover → download)
- Zoom (scroll / + −) e pan (arrastar) no container do diagrama; reset da vista
- Erros Mermaid com mensagem amigável, linha do bloco e botão **Editar código**
- Settings: fonte, curva das setas e espaçamento dos diagramas (além do toggle on/off)
- IPC `file:save-binary` para salvar SVG/PNG

### Changed

- Lazy-load de Mermaid mantido; re-render ao mudar tema ou opções
- Versão **1.4.1 → 1.5.0**

## [1.4.1] — 2026-07-19

**Outline no lugar certo** — TOC à direita do Preview (não mais à esquerda do editor).

### Fixed

- Outline/TOC ancorado à **direita do Preview** no Split View
- Layout: Editor | Preview | Outline (colapsável, redimensionável)

### Added

- Largura do Outline persistida (`outlineWidth`, padrão 220px)
- Toggle Outline: Status Bar, header do Preview (**TOC**), menu **Exibir**, atalho **⌘⇧O**
- Outline colapsa em painéis estreitos / janelas pequenas

### Changed

- Versão **1.4.0 → 1.4.1**

## [1.4.0] — 2026-07-19

**Formato Markdown antes de salvar** — mude Plain Text ↔ Markdown na aba e salve com a extensão certa.

### Added

- Toggle **Plain Text / Markdown** na Status Bar (com tooltip) e no **menu de contexto da aba**
- Ao ativar Markdown: Monaco → linguagem `markdown`, Preview opcionalmente liga sozinho
- **Salvar como** sugere **`.md`** em modo Markdown e **`.txt`** em Plain Text
- Settings: **Nova aba padrão: Markdown** e **Ativar Preview ao mudar para Markdown**
- Indicador **MD** na aba quando em Markdown

### Changed

- Novas abas “Sem título” começam em **Plain Text** por padrão
- Arquivos `.md` / `.markdown` continuam abrindo em Markdown automaticamente
- Versão **1.3.0 → 1.4.0**

## [1.3.0] — 2026-07-18

**Markdown Avançado** — Outline, Math (KaTeX), Mermaid e export PDF com opções.

### Added

- **Outline / TOC** — painel de headings no modo Markdown + Preview; clique → scroll no editor
- **Math (KaTeX)** — `$inline$` e `$$block$$` no Preview (toggle em Settings)
- **Mermaid** — blocos ` ```mermaid ` no Preview (toggle em Settings)
- **Export PDF aprimorado** — diálogo com margens (padrão/mínimas/nenhuma), tema claro/escuro e outline
- Preferências: `markdownMathEnabled`, `markdownMermaidEnabled`, `showMarkdownOutline`

### Changed

- Preview com debounce ~150 ms; KaTeX/Mermaid em chunks separados
- Versão **1.2.1 → 1.3.0**

## [1.2.1] — 2026-07-16

**Produtividade (tag de release)** — mesmo conteúdo da linha 1.2; tag `v1.2.0` já existia no remoto (auto-update).

> Conteúdo idêntico ao bloco 1.2.0 de produtividade abaixo; `package.json` = **1.2.1**.

## [1.2.0] — 2026-07-16

**Produtividade** — templates, rascunhos untitled, overflow de abas, drag & drop de arquivos.  
Inclui também hardening de auto-update (feed GitHub + contorno de signature no Mac).

### Added

#### Produtividade

- **Templates de notas** em `userData/templates/templates.json`
  - Menu **Arquivo → Nova nota a partir de template** (submenu dinâmico)
  - Settings → aba **Templates** (criar/editar/excluir)
  - Padrões: Daily Note, Reunião, Ideia, Checklist (`{{date}}`)
- **Auto-save de abas “Sem título”** em `userData/untitled-notes/untitled-YYYYMMDD-HHmmss.md`
  - Restaura rascunhos com a sessão; **Salvar como** promove e remove o draft
- **Overflow de abas** — botão **…** no TabBar com lista completa (título + dirty)
- **Drag & drop** de `.txt` / `.md` do Finder/Explorer → abre em nova aba

#### Auto-update (mesma linha 1.2)

- Atalho **Cmd/Ctrl+Shift+U** → Verificar atualizações
- Instalação custom no macOS sem Developer ID (`ditto` + `xattr`)
- Documentação em **docs/AUTO_UPDATE.md**

### Fixed

- Auto-update: `setFeedURL` GitHub + `channel: latest`
- macOS: install após download sem falhar só em signature (fallback ZIP)

### Changed

- Auto-save também cobre rascunhos untitled (não só arquivos no disco)
- Versão **1.1.0 → 1.2.0**

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
