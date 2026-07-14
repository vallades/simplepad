# SimplePad

Editor de texto multiplataforma **minimalista** com abas — inspirado no Bloco de Notas e TextEdit.

**Stack:** Electron · Vite · React · TypeScript · Monaco Editor · Zustand · Tailwind CSS · electron-store · react-markdown

> Simples por design. Poderoso por escolha.

---

## Status do projeto

| Área                                                | Status                  |
| --------------------------------------------------- | ----------------------- |
| Setup Electron + Vite + React + TS                  | Concluído               |
| Qualidade (strict, ESLint, Prettier, Husky, Vitest) | Concluído               |
| Sistema de abas (Zustand)                           | Concluído               |
| Monaco Editor (modelo por aba)                      | Concluído               |
| Persistência de sessão + preferências               | Concluído               |
| Abrir / Salvar / Salvar como                        | Concluído               |
| Menu nativo + atalhos + recentes                    | Concluído               |
| Configurações + auto-save + toasts                  | Concluído (Fase 2)      |
| Split View + Preview Markdown (GFM)                 | Concluído (Fase 3)      |
| Exportar HTML / PDF                                 | Concluído (Fase 3)      |
| Auto-update / code signing                          | Pendente (distribuição) |

Documento de produto: [SimplePad_PRD.md](./SimplePad_PRD.md)

---

## Funcionalidades

### Editor e abas

- Múltiplas abas com drag & drop, dirty state (`*`), undo/redo por aba (Monaco)
- Persistência de sessão (conteúdo, aba ativa, cursor, scroll)
- Tema claro/escuro (sistema / forçado) + fonte monoespaçada configurável

### Markdown

- **Auto-detect** por extensão (`.md` / `.markdown`) ao abrir/salvar
- **Toggle manual** na status bar ou **Exibir → Modo Markdown** (`⌘⇧M` / `Ctrl+Shift+M`)
- **Split View** Editor \| Preview (`⌘⇧P` / botão **Preview** no header)
  - Preview com GFM: tabelas, listas de tarefas, código, links, etc.
  - Debounce leve (~120 ms) no preview
  - Scroll do editor sincroniza o preview (melhor esforço)
  - Tema do preview acompanha claro/escuro do app

### Exportações

- **Arquivo → Exportar como… → HTML** / **PDF**
- Atalhos rápidos na status bar: **HTML** · **PDF**
- HTML: documento standalone com CSS minimalista
- PDF: `webContents.printToPDF` em janela oculta (main process)

### Outros

- Auto-save configurável (só abas com path no disco)
- Arquivos recentes (máx. 10)
- Diálogos nativos de confirmação + toasts de erro

### Screenshots (sugestão de pasta)

Coloque capturas em `docs/screenshots/` (criar se necessário) e referencie aqui:

| Arquivo sugerido                  | Conteúdo                  |
| --------------------------------- | ------------------------- |
| `docs/screenshots/editor.png`     | Editor full-width         |
| `docs/screenshots/split-view.png` | Split Editor \| Preview   |
| `docs/screenshots/settings.png`   | Modal de configurações    |
| `docs/screenshots/export.png`     | Diálogo exportar HTML/PDF |

Exemplo Markdown (quando as imagens existirem):

```markdown
![Split View](docs/screenshots/split-view.png)
```

---

## Requisitos

- **Node.js** 20+ (recomendado 22 LTS)
- **npm** 10+

## Começando

```bash
npm install
npm run dev
```

## Scripts

| Comando                                                 | Descrição                              |
| ------------------------------------------------------- | -------------------------------------- |
| `npm run dev`                                           | App em desenvolvimento                 |
| `npm run build`                                         | Typecheck + build de produção (`out/`) |
| `npm run test`                                          | Testes unitários (Vitest)              |
| `npm run lint`                                          | ESLint                                 |
| `npm run typecheck`                                     | TypeScript (main + renderer)           |
| `npm run dist` / `dist:mac` / `dist:win` / `dist:linux` | Instaladores                           |

---

## Atalhos

| Atalho                   | Ação                   |
| ------------------------ | ---------------------- |
| `Ctrl/Cmd+N`             | Nova aba               |
| `Ctrl/Cmd+O`             | Abrir                  |
| `Ctrl/Cmd+S` / `Shift+S` | Salvar / Salvar como   |
| `Ctrl/Cmd+W`             | Fechar aba             |
| `Ctrl/Cmd+,`             | Configurações          |
| `Ctrl/Cmd+Shift+P`       | Toggle Split / Preview |
| `Ctrl/Cmd+Shift+M`       | Toggle modo Markdown   |
| `Ctrl/Cmd+Tab`           | Alternar abas          |

---

## Arquitetura (Fase 3)

```
src/
├── main/
│   ├── exportManager.ts     # HTML write + PDF printToPDF
│   ├── menu.ts              # Exportar + Exibir Preview/Markdown
│   └── …
├── renderer/
│   ├── components/
│   │   ├── EditorWorkspace.tsx  # split container
│   │   ├── PreviewPanel.tsx     # react-markdown + GFM
│   │   ├── Editor.tsx           # Monaco (lazy)
│   │   └── StatusBar.tsx
│   ├── services/exportActions.ts
│   ├── store/useUiStore.ts      # splitPreview + scroll ratio
│   └── utils/markdownExport.ts  # HTML document builder
```

### Bundle / performance

- Monaco e `react-markdown` em **chunks separados** (`monaco-editor`, `markdown`) via `manualChunks`
- Editor e Preview carregados com `React.lazy` — preview só monta com split ativo
- Monaco só inicializa quando o Editor monta

Para medir o impacto no instalador:

```bash
npm run build
du -sh out/renderer/assets/*
npm run dist:mac   # ou dist da plataforma atual
du -sh dist/*
```

Meta do PRD: instalador &lt; ~80 MB após otimizações (Monaco ainda domina o peso).

---

## Persistência

| Dado                | Arquivo            |
| ------------------- | ------------------ |
| Sessão de abas      | `session.json`     |
| Settings + recentes | `preferences.json` |

macOS: `~/Library/Application Support/simplepad/`

---

## Qualidade

```bash
npm test
npm run typecheck
npm run lint
```

## Segurança

- `contextIsolation: true`, `nodeIntegration: false`
- **`sandbox: false` no renderer** — necessário para workers do Monaco (documentado em `src/main/index.ts`)
- Export PDF usa janela oculta **com sandbox: true**

---

## Próximos passos (distribuição)

1. CI: test + build + artefatos mac/win/linux
2. Code signing + notarization (macOS)
3. `electron-updater` + canal de releases
4. Opcional: layout de preview horizontal, tree-shake mais agressivo do Monaco
5. Screenshots reais em `docs/screenshots/`

---

## Licença

MIT
