# Contribuindo com o SimplePad

Obrigado por ajudar a manter o SimplePad **simples por design**.

## Como contribuir

1. Faça fork e clone do repositório
2. `npm install`
3. Crie uma branch: `git checkout -b feat/minha-ideia`
4. Desenvolva e rode qualidade localmente:

```bash
npm test
npm run lint
npm run typecheck
npm run dev   # validar UI
```

5. Abra um **Pull Request** para `main`
6. Aguarde o CI (**CI Success**) ficar verde

A branch `main` usa **branch protection**: merges via PR + check `CI Success`.

## Templates

- **Issues:** escolha _Relatório de bug_ ou _Pedido de funcionalidade_
- **PRs:** o template preenche descrição, tipo e checklist automaticamente

Arquivos em `.github/ISSUE_TEMPLATE/` e `.github/pull_request_template.md`.

## Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

```text
feat: ...
fix: ...
docs: ...
chore: ...
ci: ...
test: ...
```

## Princípios

- UI minimalista — evite chrome e opções demais (sidebar e Preview são opt-in)
- Preferir arquivos locais e offline-first (workspaces = pastas locais)
- TypeScript strict; não enfraquecer a segurança do Electron
- Listagens de FS no main devem validar path **dentro** do workspace root
- Testes para lógica pura (utils, stores, sanitize, workspace registry)

## Workspaces (v2+)

- Dados por pasta: `userData/workspaces/<id>/` (session, preferences, templates, untitled)
- Registry global: `userData/workspaces-registry.json`
- Snippets permanecem globais
- Explorer: listagem **lazy** (um diretório por IPC); não varrer a árvore inteira no open

## Docs úteis

- [docs/PROJETO.md](./docs/PROJETO.md) — visão completa, arquitetura e roadmap
- [docs/PROJECT_OVERVIEW.md](./docs/PROJECT_OVERVIEW.md) — overview atual (**v1.4.1**)
- [docs/AUTO_UPDATE.md](./docs/AUTO_UPDATE.md) — releases e updater
- [docs/DISTRIBUTION.md](./docs/DISTRIBUTION.md) — build e assinatura
- [CHANGELOG.md](./CHANGELOG.md) — histórico de versões
- [README.md](./README.md) — entrada do repositório

## Releases

1. Atualize `package.json` + `CHANGELOG.md`
2. Merge em `main` via PR (CI verde)
3. Tag `vX.Y.Z` e push — o workflow **Release** gera instaladores

## Dúvidas

Abra uma issue com o template adequado. Em caso de macOS “app damaged”, veja o README (`xattr -cr`).
