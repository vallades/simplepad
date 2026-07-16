# SimplePad — Visão geral do projeto

Documento de contexto: o que foi construído, decisões técnicas, limitações, oportunidades de melhoria e ideias de futuro.

| Campo            | Valor                                                                                                                      |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Produto**      | SimplePad — editor de texto multiplataforma minimalista com abas                                                           |
| **Versão atual** | **1.0.1** (patch: auto-update UX + CI)                                                                                     |
| **Licença**      | MIT                                                                                                                        |
| **Repositório**  | https://github.com/vallades/simplepad                                                                                      |
| **Release**      | https://github.com/vallades/simplepad/releases/tag/v1.0.1                                                                  |
| **Stack**        | Electron · Vite · React 19 · TypeScript · Monaco · Zustand · Tailwind · electron-store · react-markdown · electron-updater |
| **Inspiração**   | Bloco de Notas / TextEdit — simples por design                                                                             |

Documentos relacionados: [README](../README.md) · [CHANGELOG](../CHANGELOG.md) · [DISTRIBUTION](./DISTRIBUTION.md) · [AUTO_UPDATE](./AUTO_UPDATE.md) · [PRD original](../SimplePad_PRD.md) · [Notas v1.0.0](./RELEASE_NOTES_v1.0.0.md) · [Notas v1.0.1](./RELEASE_NOTES_v1.0.1.md)

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

O desenvolvimento seguiu o roadmap do PRD, com polimento e distribuição além do MVP.

### Fase 0 — Fundação

- Scaffold **electron-vite** (React + TypeScript)
- ESLint, Prettier, Husky + lint-staged, Vitest
- Tailwind CSS v4
- Estrutura `main` / `preload` / `renderer` / `shared`
- Scripts de dev, build, dist

### Fase 1 — MVP Core

| Capacidade | Detalhe                                                             |
| ---------- | ------------------------------------------------------------------- |
| Abas       | Zustand: criar, fechar, trocar, reordenar (drag & drop), dirty `*`  |
| Monaco     | Uma instância, modelo por aba, undo/redo isolado, fallback textarea |
| Sessão     | `SessionManager` + `electron-store` → restaura abas, cursor, scroll |
| Arquivos   | Abrir / Salvar / Salvar como (diálogos nativos, UTF-8)              |
| Menu       | Arquivo, Editar, Exibir + atalhos                                   |
| Quit       | Confirmação com alterações não salvas + flush de sessão             |

**Polimento da Fase 1:**

- `window.confirm` → `dialog.showMessageBox`
- Toasts para erros de I/O e sessão
- Arquivos recentes (máx. 10) no menu Arquivo

### Fase 2 — Experiência

| Capacidade   | Detalhe                                                             |
| ------------ | ------------------------------------------------------------------- |
| Settings     | Fonte monoespaçada, tamanho, tema (sistema/claro/escuro), auto-save |
| Persistência | `preferences.json` (settings + recentes)                            |
| Auto-save    | Intervalo, troca de aba, blur (só abas com path no disco)           |
| Status bar   | Ln/Col, palavras/caracteres, Salvo/Não salvo, encoding UTF-8        |

### Fase 3 — Preview e export

| Capacidade          | Detalhe                                                  |
| ------------------- | -------------------------------------------------------- |
| Split View          | Editor \| Preview (`react-markdown` + `remark-gfm`)      |
| Performance preview | Debounce ~120 ms, scroll ratio editor → preview          |
| Markdown mode       | Auto por extensão + toggle manual                        |
| Export              | HTML (documento standalone) e PDF (`printToPDF` no main) |

### Fechamento v1.0 e distribuição

| Capacidade  | Detalhe                                                                  |
| ----------- | ------------------------------------------------------------------------ |
| Modo foco   | Distração zero (F11 / Esc): fullscreen, chrome oculto                    |
| Auto-update | `electron-updater` + menu Ajuda → Verificar atualizações                 |
| Builder     | Win NSIS+portable, mac DMG+ZIP, Linux AppImage+deb                       |
| CI/CD       | GitHub Actions: lint, testes, coverage, matrix de build, Release em tags |
| UX macOS    | `app.setName('SimplePad')`, padding traffic lights (`hiddenInset`)       |
| Docs        | README, CHANGELOG, LICENSE, DISTRIBUTION, notas de release               |

---

## 3. Arquitetura técnica

```
simplepad/
├── src/
│   ├── main/           # Processo principal Electron
│   │   ├── index.ts           # Janela, lifecycle, nome do app
│   │   ├── ipc.ts             # Handlers IPC tipados
│   │   ├── menu.ts            # Menu nativo
│   │   ├── sessionManager.ts  # session.json
│   │   ├── preferencesManager.ts
│   │   ├── fileManager.ts
│   │   ├── exportManager.ts   # HTML write + PDF printToPDF
│   │   ├── updater.ts         # electron-updater
│   │   └── quitController.ts
│   ├── preload/        # contextBridge → window.api
│   ├── shared/         # Contratos sessão/settings (main + renderer)
│   └── renderer/       # React UI
│       ├── components/ # Editor, Preview, TabBar, StatusBar, Settings, Toasts
│       ├── store/      # tabs, settings, toast, ui (split/focus)
│       ├── services/   # file, session, auto-save, export, update
│       ├── monaco/     # setup lazy + model registry
│       └── utils/
├── .github/workflows/
│   ├── ci.yml          # push/PR main
│   └── release.yml     # tags v* + workflow_dispatch
├── docs/
└── electron-builder.yml
```

### Fluxo de dados (resumo)

1. **Renderer** edita via Monaco → Zustand (`useTabsStore`).
2. Sessão debounced → IPC → **main** grava `session.json`.
3. Arquivos / export / diálogos / update → IPC → **main** (fs, dialog, printToPDF, autoUpdater).
4. Preferências → `preferences.json` no main; tema/fonte aplicados no renderer.
5. Preview Markdown só monta com split ativo (lazy).

### Dados no disco (userData)

| Arquivo            | Conteúdo                                  |
| ------------------ | ----------------------------------------- |
| `session.json`     | Abas, conteúdo, cursor, scroll, aba ativa |
| `preferences.json` | Settings + lista de recentes              |
| Logs               | `electron-log` sob userData               |

Caminhos típicos: macOS `~/Library/Application Support/simplepad/`, Windows `%APPDATA%/simplepad/`, Linux `~/.config/simplepad/`.

---

## 4. Funcionalidades entregues (checklist)

### Editor e abas

- [x] Múltiplas abas, reordenação, dirty state
- [x] Atalhos: nova, fechar, abrir, salvar, salvar como, trocar abas
- [x] Monaco com modelo por aba
- [x] Fallback se Monaco falhar
- [x] Sessão restaurada ao reiniciar

### Arquivos e feedback

- [x] Diálogos nativos open/save
- [x] Recentes (10)
- [x] Confirmações nativas (aba dirty / sair)
- [x] Toasts de erro/info/sucesso

### Markdown e export

- [x] Split preview GFM
- [x] Toggle Markdown
- [x] Export HTML / PDF

### UX e tema

- [x] Tema sistema / claro / escuro
- [x] Fonte e tamanho configuráveis
- [x] Auto-save configurável
- [x] Modo distração zero
- [x] Status bar rica

### Distribuição e qualidade

- [x] Instaladores 3 plataformas
- [x] Auto-update (feed GitHub Releases)
- [x] CI + Release workflows
- [x] Testes unitários (Vitest) + coverage
- [x] TypeScript strict + ESLint

---

## 5. Problemas encontrados e como foram resolvidos

| Problema                                  | Causa                                        | Solução                                                         |
| ----------------------------------------- | -------------------------------------------- | --------------------------------------------------------------- |
| Título sob os traffic lights (macOS)      | `titleBarStyle: hiddenInset` sem padding     | Classe `mac-titlebar-pad` (~78px) só no Darwin                  |
| Menu “Electron” em dev                    | Nome do binário Electron                     | `app.setName('SimplePad')` + `productName` + label fixo no menu |
| Release mac falha: `simplepad not a file` | `CSC_LINK=""` injetado pelo Actions          | Só exportar secrets de assinatura se não-vazios                 |
| Job “canceled” após DMG OK                | `cancel-in-progress: true` em push em `main` | Cancelar só em PRs; builds longos em main terminam              |
| Instalador > 70 MB                        | Electron + Monaco                            | Documentado como limitação; chunks lazy reduzem shell inicial   |
| `sandbox: false` no renderer              | Workers Monaco                               | Documentado; PDF export usa janela sandboxed                    |

---

## 6. Métricas e qualidade (estado v1.0)

| Área               | Estado aproximado                                                                     |
| ------------------ | ------------------------------------------------------------------------------------- |
| Testes             | Dezenas de testes unitários (store, sanitize, export, auto-save, update bridge, etc.) |
| Coverage           | Relatório via `npm run test:coverage` (CI artifact); foco em stores/utils/services    |
| Bundle renderer    | Monaco e markdown em chunks separados; Editor/Preview com `React.lazy`                |
| Instaladores       | ~95–115 MB por artefato (típico Electron desktop)                                     |
| App unpackaged mac | Ordem de ~300 MB+ (runtime Electron)                                                  |

---

## 7. Oportunidades de melhoria

Priorizadas por impacto vs. esforço (orientativo).

### 7.1 Alta prioridade (confiança e distribuição)

| Melhoria                                                                  | Por quê                                                                   |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Code signing + notarização macOS**                                      | Gatekeeper; builds “oficiais” sem aviso de desenvolvedor não identificado |
| **Assinatura Windows (Authenticode)**                                     | SmartScreen menos agressivo                                               |
| **Branch protection**                                                     | Exigir job “CI Success” em PRs                                            |
| **Templates de issue/PR**                                                 | Onboarding de contribuidores                                              |
| **Screenshots reais**                                                     | README / landing; pasta `docs/screenshots/` já prevista                   |
| **Smoke E2E** (Playwright/Spectron-like ou manual checklist automatizado) | CI hoje é unitário + package, não UI real no app                          |

### 7.2 Performance e tamanho

| Melhoria                                                                    | Por quê                                                                   |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Tree-shake / workers Monaco**                                             | `ts.worker` e outros workers pesam muito; plaintext+markdown talvez baste |
| **Não empacotar linguagens desnecessárias do Monaco**                       | Menor download e RAM                                                      |
| **Avaliar editor mais leve** (CodeMirror 6, textarea rich) para “modo lite” | Meta de instalador menor                                                  |
| **Lazy ainda mais agressivo** no first paint                                | Abrir app antes de carregar Monaco                                        |

### 7.3 Segurança

| Melhoria                                    | Por quê                                       |
| ------------------------------------------- | --------------------------------------------- |
| **`sandbox: true` com workers sandboxados** | Melhor postura de segurança Electron          |
| **CSP no renderer**                         | Mitigar XSS se no futuro houver HTML embutido |
| **Validação estrita de paths no main**      | Abrir/salvar só em paths esperados            |

### 7.4 UX e produto

| Melhoria                                         | Por quê                                               |
| ------------------------------------------------ | ----------------------------------------------------- |
| **Divisor redimensionável** no split             | Usuários com monitores largos / estreitos             |
| **Layout preview vertical** (editor em cima)     | Preferência documentada como “futura” no PRD          |
| **Find in file / replace** nativo além do Monaco | Fluxo notepad clássico                                |
| **Encoding configurável**                        | Hoje UTF-8 fixo                                       |
| **Auto-save de untitled** (temp file)            | Hoje só path real                                     |
| **Acessibilidade**                               | Foco no modal Settings, anúncios de toasts, contraste |
| **i18n** (pt-BR / en)                            | Menus e strings hardcoded em português                |

### 7.5 Engenharia

| Melhoria                                                           | Por quê                                    |
| ------------------------------------------------------------------ | ------------------------------------------ |
| **Coverage gates** no CI                                           | Evitar regressão silenciosa                |
| **Changelog automático** (conventional-changelog / release-please) | Menos trabalho em cada release             |
| **Dependabot / Renovate**                                          | Electron e Monaco atualizam com frequência |
| **Snapshot de tamanho de artefato** no CI                          | Alerta se o DMG/exe crescer demais         |

---

## 8. Futuras funcionalidades (roadmap sugerido)

### v1.1 — Polimento e confiança

- Assinatura + notarização documentada e aplicada em CI
- Screenshots e página de “Getting started”
- Divisor redimensionável no Split View
- Find/replace exposto na UI/status
- Templates de contribuição

### v1.2 — Produtividade

- Busca em todas as abas abertas
- “Ir para linha”
- Snippets leves ou templates de nota
- Lista de abas (overflow quando muitas abas)
- Arrastar arquivo do Finder/Explorer para abrir

### v1.3 — Markdown avançado

- Preview com math (KaTeX) opcional
- Diagramas (Mermaid) opcional
- Export PDF com opções (margens, tema print)
- Outline (TOC) da nota markdown

### v2.0 — Expansão (avaliar fit ao “minimalismo”)

- Workspace / pasta de notas (ainda local-first)
- Sync opcional (iCloud / folder sync — **sem** virar SaaS por padrão)
- Extensões / plugins leves
- Versão web “view-only” ou PWA do preview

> Qualquer feature v2 deve ser filtrada pelo princípio: **não virar IDE nem app de notas na nuvem sem opção offline-first.**

---

## 9. Atalhos atuais (referência)

| Atalho                   | Ação                 |
| ------------------------ | -------------------- |
| `Ctrl/Cmd+N`             | Nova aba             |
| `Ctrl/Cmd+O`             | Abrir                |
| `Ctrl/Cmd+S` / `Shift+S` | Salvar / Salvar como |
| `Ctrl/Cmd+W`             | Fechar aba           |
| `Ctrl/Cmd+,`             | Configurações        |
| `Ctrl/Cmd+Shift+P`       | Toggle Preview       |
| `Ctrl/Cmd+Shift+M`       | Toggle Markdown      |
| `Ctrl/Cmd+Tab`           | Alternar abas        |
| `F11`                    | Modo distração zero  |
| `Esc`                    | Sair do modo foco    |

---

## 10. Como rodar e distribuir (lembrete)

```bash
npm install
npm run dev                 # desenvolvimento
npm test && npm run lint && npm run typecheck
npm run dist:mac            # ou dist:win / dist:linux
```

CI: push/PR em `main` → `.github/workflows/ci.yml`  
Release: tag `v*` → `.github/workflows/release.yml`

Detalhes de assinatura e publish: [DISTRIBUTION.md](./DISTRIBUTION.md).

---

## 11. Riscos conhecidos

1. **Tamanho do instalador** — Electron + Monaco; difícil &lt; 70 MB sem troca de stack.
2. **Gatekeeper / SmartScreen** sem signing — fricção no first run.
3. **Auto-update** depende de assets + `latest*.yml` corretos no GitHub Release.
4. **Monaco workers** — `sandbox: false` no renderer até estratégia alternativa.
5. **Cancelamento de CI** — mitigado em main; PRs ainda cancelam runs antigos (desejável).

---

## 12. Conclusão

A **v1.0.0** entrega o ciclo completo do PRD: MVP utilizável, experiência de configurações e auto-save, preview Markdown com export, distribuição multi-OS, CI/CD e documentação.

O produto está **pronto para uso real** e para um primeiro ciclo de feedback de usuários. O melhor ROI pós-lançamento é:

1. Assinatura de builds (confiança do SO)
2. Screenshots e onboarding visual
3. Redução de peso do editor / workers
4. Features pequenas de produtividade (find, splitter, overflow de abas)

sem abandonar o espírito **“simples por design”**.

---

_Documento gerado a partir do histórico de implementação do SimplePad (Fases 0–3, polish v1.0 e CI/CD). Atualizar quando houver release major/minor relevante._
