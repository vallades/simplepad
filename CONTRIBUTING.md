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

- UI minimalista — evite chrome e opções demais
- Preferir arquivos locais e offline-first
- TypeScript strict; não enfraquecer a segurança do Electron
- Testes para lógica pura (utils, stores, sanitize)

## Docs úteis

- [docs/PROJETO.md](./docs/PROJETO.md) — visão do projeto
- [docs/AUTO_UPDATE.md](./docs/AUTO_UPDATE.md) — releases e updater
- [docs/DISTRIBUTION.md](./docs/DISTRIBUTION.md) — build e assinatura
- [docs/PROJECT_OVERVIEW.md](./docs/PROJECT_OVERVIEW.md) — overview v1.1

## Dúvidas

Abra uma issue com o template adequado. Em caso de macOS “app damaged”, veja o README (`xattr -cr`).
