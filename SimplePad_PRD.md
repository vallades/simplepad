# SimplePad

> **Nota (2026-07):** este PRD é o documento **original de produto**. O estado implementado atual é a **v1.4.1** — ver [README.md](./README.md), [docs/PROJECT_OVERVIEW.md](./docs/PROJECT_OVERVIEW.md), [docs/PROJETO.md](./docs/PROJETO.md) e [CHANGELOG.md](./CHANGELOG.md). - PRD Completo

**Nome do Produto:** SimplePad  
**Descrição:** Editor de texto multiplataforma simples e leve com abas, inspirado no Bloco de Notas e TextEdit  
**Stack Principal:** Electron + Vite + React + TypeScript + Monaco Editor  
**Versão do PRD:** 1.0  
**Data:** 13 de Julho de 2026

---

## 1. Visão Geral do Produto

SimplePad é um editor de texto **extremamente simples**, multiplataforma (Windows, macOS e Linux), com visual minimalista inspirado no Bloco de Notas clássico e TextEdit.

O objetivo é oferecer uma experiência **leve, rápida e sem distrações**, permitindo trabalhar com múltiplas notas em abas, editar texto puro ou Markdown simples, salvar automaticamente o estado da sessão e exportar em formatos `.txt` e `.md`.

**Diferenciais para destaque:**

- Leveza e baixo consumo de recursos
- Persistência de sessão excelente (nunca perde o trabalho)
- Editor profissional com Monaco Editor (mesmo do VS Code)
- Arquitetura limpa e preparada para crescimento
- Qualidade de código alta desde o dia 1 (testes, TypeScript strict, segurança Electron)
- Fácil de distribuir e manter

---

## 2. Objetivos do Produto

- Criar um editor minimalista de alta qualidade que as pessoas queiram usar no dia a dia
- Oferecer persistência de sessão robusta e confiável
- Ser rápido para abrir e leve no consumo de RAM
- Ter uma base sólida e escalável para funcionalidades futuras (preview Markdown, integração com IA, etc.)
- Ser fácil de manter, testar e evoluir

---

## 3. Público-Alvo / Personas

- Usuários que acham o VS Code pesado demais e o Bloco de Notas limitado
- Pessoas que trabalham com várias notas/ideias simultaneamente (desenvolvedores, escritores, estudantes, pesquisadores)
- Usuários que gostam de Markdown mas querem algo mais leve que Obsidian ou Typora
- Quem valoriza simplicidade + poder de abas + persistência

---

## 4. Stack Técnica Recomendada

- **Electron** (v35 ou superior)
- **Vite** + **React** + **TypeScript** (template oficial `electron-vite`)
- **Monaco Editor** (editor principal)
- **Zustand** (gerenciamento de estado leve)
- **Tailwind CSS** (estilização minimalista)
- **electron-store** (persistência de sessão)
- **electron-builder** (empacotamento e distribuição)
- **electron-updater** (atualizações automáticas - Fase 2+)
- **Vitest** + React Testing Library (testes unitários)
- **ESLint + Prettier + husky** (qualidade de código)

**Comando inicial recomendado:**

```bash
npm create @quick-start/electron simplepad --template react-ts
```

---

## 5. Roadmap e Validadores de Sucesso

### Fase 0 – Setup do Projeto (1-2 dias)

**Entregáveis:**

- Projeto criado com template `electron-vite` React + TS
- ESLint, Prettier e TypeScript strict configurados
- Estrutura de pastas organizada
- Monaco Editor instalado e renderizando
- Hot reload funcionando

**Validadores de Sucesso:**

- O app abre em menos de 3 segundos em máquina média
- Hot reload funciona no renderer
- Build de produção gera executável funcional
- TypeScript compila sem erros com strict mode

### Fase 1 – MVP Core (Prioridade Máxima)

**Funcionalidades incluídas:**

- Sistema completo de abas (criar, fechar, reordenar com drag & drop, Ctrl+Tab / Ctrl+Shift+Tab)
- Editor Monaco com suporte a texto puro e highlighting básico de Markdown
- Persistência completa de sessão (restaura abas, conteúdo, cursor e scroll ao reiniciar)
- Salvar e Salvar como (diálogos nativos) nos formatos .txt e .md
- Abrir arquivos .txt e .md em novas abas
- Menu nativo clássico (Arquivo, Editar, Exibir)
- Atalhos de teclado principais
- Dirty state com indicador `*` nas abas
- Status bar básica (linha:coluna, contagem de palavras)

**Validadores de Sucesso (testáveis):**

- Criar 5 abas novas, digitar conteúdo diferente em cada uma e reiniciar o app → todas as 5 abas são restauradas com conteúdo, título e posição do cursor corretos em menos de 2 segundos.
- Salvar uma aba como `.md` e reabrir o arquivo preserva o conteúdo 100% corretamente.
- Tentar fechar uma aba modificada sem salvar → aparece diálogo de confirmação nativo.
- Consumo de RAM com 8 abas abertas fica abaixo de 150MB em máquina média.
- Todos os atalhos principais funcionam corretamente.
- Build final roda sem erros nas três plataformas.

### Fase 2 – Polimento e Experiência do Usuário (v0.9)

**Funcionalidades:**

- Auto-save configurável (intervalo + ao trocar de aba)
- Barra de status completa + word/character count
- Tema claro/escuro automático (seguindo o sistema operacional)
- Janela de Configurações (fonte, tamanho da fonte, auto-save, etc.)
- Lista de arquivos recentes
- Melhor tratamento centralizado de erros e logging

**Validadores de Sucesso:**

- Auto-save funciona corretamente (salva a cada X segundos ou ao trocar de aba).
- Mudar o tema do sistema operacional reflete automaticamente no SimplePad.
- O app passa em testes básicos de acessibilidade (navegação por teclado).
- Lista de recentes funciona e abre os arquivos corretamente.

### Fase 3 – v1.0 (Lançamento)

**Funcionalidades:**

- Split view Editor | Preview Markdown ao vivo (usando react-markdown + marked)
- Exportar nota atual para PDF ou HTML (básico)
- Otimizações de performance e redução de tamanho do instalador
- Preparação para distribuição (code signing notes)

**Validadores de Sucesso:**

- Split view funciona de forma fluida sem travamentos.
- Exportar para PDF gera arquivo válido.
- Tamanho do instalador final fica abaixo de 80MB (após otimizações).
- Auto-update básico funciona (quando implementado).

---

## 6. Prompts Prontos para o Grok Build

### Prompt 1 – Criação e Setup Inicial do Projeto

```
Crie um projeto Electron usando o template oficial electron-vite com React + TypeScript. Configure ESLint, Prettier, TypeScript no modo strict e husky para pre-commit. Instale as dependências: @monaco-editor/react, zustand, tailwindcss, electron-store. Crie a estrutura de pastas recomendada para um editor de texto com abas (main, preload, renderer/components, renderer/store, etc.). Adicione um README.md inicial explicando como rodar o projeto.
```

### Prompt 2 – Sistema de Abas e Gerenciamento de Estado

```
Implemente um sistema completo de abas usando React + Zustand. Cada aba deve conter: id (uuid), title, content, isDirty (boolean), isMarkdown (boolean), cursorPosition, scrollPosition. Implemente as seguintes ações: createNewTab(), closeTab(id), switchTab(id), reorderTabs(), markAsDirty(id), updateTabContent(id, content), updateCursorPosition(id, position). Adicione suporte a Ctrl+Tab e Ctrl+Shift+Tab para alternar abas. Inclua drag & drop para reordenar as abas usando react-dnd ou HTML5 drag API.
```

### Prompt 3 – Integração com Monaco Editor

```
Integre o Monaco Editor (@monaco-editor/react) no SimplePad. Crie um componente Editor.tsx reutilizável que suporte múltiplas abas. Gerencie corretamente os modelos do Monaco para evitar memory leaks ao fechar abas. Implemente syntax highlighting básico para Markdown. Permita que o usuário configure fonte e tamanho da fonte via settings. Adicione suporte a temas claro/escuro do Monaco sincronizado com o tema do app.
```

### Prompt 4 – Persistência de Sessão

```
Crie um serviço SessionManager.ts que use electron-store para salvar e restaurar o estado completo das abas. Ao fechar o app (before-quit), salve todas as abas abertas (incluindo conteúdo, título, isDirty, isMarkdown, cursor e scroll). Ao iniciar o app, restaure todas as abas automaticamente. Garanta que o app funcione corretamente mesmo se o arquivo de sessão estiver corrompido (fallback para aba vazia).
```

### Prompt 5 – Manipulação de Arquivos (Open / Save)

```
Implemente as funcionalidades de Abrir Arquivo, Salvar e Salvar Como usando os diálogos nativos do Electron (dialog.showOpenDialog e dialog.showSaveDialog). Suporte a filtros para .txt, .md e Todos os arquivos. Ao salvar uma aba, atualize o título da aba com o nome do arquivo e remova o estado dirty. Ao abrir um arquivo, crie uma nova aba com o conteúdo e marque como não-dirty. Adicione suporte a múltiplos arquivos na seleção de "Abrir".
```

### Prompt 6 – Menu Nativo e Atalhos de Teclado

```
Crie um menu nativo clássico usando Electron Menu API com as seguintes seções: Arquivo (Nova Aba, Abrir..., Salvar, Salvar como..., Fechar Aba, Sair), Editar (Desfazer, Refazer, Recortar, Copiar, Colar, Selecionar Tudo, Localizar), Exibir (Zoom In, Zoom Out, Reset Zoom, Alternar Tema). Implemente atalhos globais para as principais ações (Ctrl+N, Ctrl+S, Ctrl+Shift+S, Ctrl+W, Ctrl+Tab, etc.). Conecte os itens do menu às funções do Zustand store.
```

### Prompt 7 – Testes Unitários

```
Configure Vitest + React Testing Library no projeto SimplePad. Escreva testes unitários para:
- SessionManager (saveSession, loadSession, handle corrupted data)
- Tab model e lógica de dirty state
- File utilities (getFileExtension, sanitizeFilename)
- useTabsStore (createTab, closeTab, updateContent)
Alcance no mínimo 70% de cobertura de código nas partes críticas do negócio. Adicione script de teste no package.json.
```

### Prompt 8 – Build, Empacotamento e Distribuição

```
Configure o electron-builder no SimplePad para gerar instaladores para Windows (.exe), macOS (.dmg) e Linux (.AppImage e .deb). Adicione suporte básico a auto-update usando electron-updater. Otimize o build para reduzir o tamanho final do aplicativo (tree-shaking, lazy loading do Monaco quando possível). Adicione instruções no README sobre code signing e notarization.
```

### Prompt 9 – Componentes de UI e Estilo Minimalista

```
Crie os componentes de UI principais com visual extremamente simples e minimalista (estilo Notepad):
- TabBar.tsx (abas com close button, dirty indicator e drag & drop)
- StatusBar.tsx (linha:coluna, word count, encoding, tipo do arquivo)
- SettingsModal.tsx (configurações básicas)
Use Tailwind CSS mantendo o visual clean, com bastante espaço em branco e tipografia clara. Siga o sistema de temas do usuário (claro/escuro).
```

---

## 7. Estratégia de Testes

- **Testes Unitários**: Vitest + React Testing Library (foco em lógica de negócio)
- **Cobertura mínima**:
  - MVP: 70%
  - Partes críticas (SessionManager, file handling): 85%+
- **Testes E2E** (a partir da Fase 2): Playwright para fluxos principais (criar abas → digitar → reiniciar → verificar restauração)
- **Linting e Formatação**: ESLint + Prettier com regras strict
- **Type Safety**: TypeScript strict mode + noImplicitAny
- **Pre-commit hooks**: Husky + lint-staged

---

## 8. Melhores Práticas de Mercado (para destacar o app)

### Segurança no Electron (obrigatório)

- Context Isolation ativado
- Sandbox ativado
- Preload script seguro com contextBridge
- Comunicação IPC validada e tipada
- Nunca usar `nodeIntegration: true`
- Validação de caminhos de arquivo

### Performance

- Lazy loading do Monaco Editor
- Uso eficiente de Zustand (selectors granulares)
- Gerenciamento correto de modelos do Monaco (dispose ao fechar abas)
- Evitar re-renders desnecessários

### Empacotamento e Distribuição

- electron-builder com targets específicos por plataforma
- Suporte a auto-update (electron-updater)
- Instruções claras de code signing e notarization no macOS
- Redução de tamanho do instalador (remover dependências desnecessárias)

### Qualidade e Manutenibilidade

- Arquitetura limpa (separação clara entre main, preload e renderer)
- Tratamento centralizado de erros + logging profissional (electron-log)
- Documentação excelente (README com screenshots, comandos e roadmap)
- Conventional Commits
- Preparação para internacionalização (i18n-ready)

### Experiência do Usuário

- Tema automático do sistema
- Atalhos de teclado completos e consistentes
- Diálogos nativos do sistema operacional
- Feedback visual claro (dirty state, loading, erros)
- Acessibilidade básica (navegação por teclado + ARIA labels)

---

## 9. Estrutura de Pastas Recomendada

```
simplepad/
├── src/
│   ├── main/
│   │   ├── index.ts                 # Entry point do Electron
│   │   ├── menu.ts                  # Menu nativo
│   │   ├── sessionManager.ts        # Persistência de sessão
│   │   ├── fileManager.ts           # Lógica de abrir/salvar arquivos
│   │   └── ipc.ts                   # Handlers IPC
│   ├── preload/
│   │   └── index.ts                 # Context bridge seguro
│   └── renderer/
│       ├── components/
│       │   ├── TabBar.tsx
│       │   ├── Editor.tsx           # Wrapper do Monaco
│       │   ├── StatusBar.tsx
│       │   ├── SettingsModal.tsx
│       │   └── ConfirmDialog.tsx
│       ├── store/
│       │   └── useTabsStore.ts      # Zustand store
│       ├── utils/
│       │   ├── fileUtils.ts
│       │   └── monacoUtils.ts
│       ├── App.tsx
│       └── main.tsx
├── electron.vite.config.ts
├── electron-builder.yml
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── .eslintrc.cjs
├── .prettierrc
├── husky/
└── README.md
```

---

## 10. Métricas de Sucesso do Produto

- Tempo de abertura do app < 3 segundos
- RAM com 10 abas < 180MB
- Tamanho do instalador final < 80MB (após otimizações)
- Taxa de retenção de usuários (meta futura)
- Feedback positivo sobre simplicidade e confiabilidade da persistência de sessão

---

## 11. Riscos e Mitigações

| Risco                          | Probabilidade | Impacto | Mitigação                                             |
| ------------------------------ | ------------- | ------- | ----------------------------------------------------- |
| Tamanho grande do instalador   | Média         | Alto    | Otimização com electron-builder + lazy loading        |
| Vazamento de memória no Monaco | Média         | Médio   | Dispose correto de modelos + testes                   |
| Problemas de segurança         | Baixa         | Alto    | Seguir rigorosamente as melhores práticas de Electron |
| Dificuldade em code signing    | Média         | Médio   | Documentar o processo claramente no README            |

---

## 12. Próximos Passos Recomendados

1. Executar o comando de criação do projeto com o template `electron-vite`
2. Aplicar o **Prompt 1** no Grok Build
3. Seguir a sequência dos prompts (2 → 3 → 4 → 5 → 6 → 9)
4. Implementar testes (Prompt 7)
5. Configurar build (Prompt 8)
6. Validar todos os critérios de sucesso da Fase 1
7. Partir para Fase 2

---

**SimplePad** — Simples por design. Poderoso por escolha.

---

_Documento gerado automaticamente para uso com Grok Build. Pode ser atualizado conforme o desenvolvimento avança._
