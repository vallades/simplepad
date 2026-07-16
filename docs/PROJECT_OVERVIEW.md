# SimplePad — Project Overview (v1.1)

Documento de visão da linha **v1.1 “Polimento e Confiança”**.  
Histórico completo e arquitetura detalhada: [PROJETO.md](./PROJETO.md).

## Versão

| Campo               | Valor                                                     |
| ------------------- | --------------------------------------------------------- |
| Atual (branch v1.1) | **1.1.0**                                                 |
| Anterior estável    | 1.0.1                                                     |
| Foco                | UX (split, busca), confiança (docs signing), contribuição |

## O que entra na v1.1

1. **Split redimensionável** — divisor arrastável; razão e orientação (lado a lado / empilhado) nas preferências
2. **Find & Replace** — UI/menu (Monaco); Ir para linha (Ctrl/Cmd+G); busca em todas as abas
3. **Code signing documentado** — guia Windows + macOS; workflow pronto para secrets (sem forçar assinatura)
4. **Getting Started + screenshots** — placeholders e estrutura em `docs/screenshots/`
5. **Templates de contribuição** — issues, PR, `CONTRIBUTING.md`

## Como testar (antes do merge)

```bash
git checkout feature/v1.1-polish
npm install
npm test && npm run lint && npm run typecheck
npm run dev
```

Checklist manual:

- [ ] Preview on → arrastar divisor → reabrir app mantém razão
- [ ] Settings → layout empilhado / lado a lado
- [ ] Ctrl/Cmd+F, replace, Ctrl/Cmd+G
- [ ] Ctrl/Cmd+Shift+F → resultados por aba → clique salta
- [ ] Tema claro/escuro e fonte ainda se aplicam

## Release

```bash
# Após merge em main:
git tag -a v1.1.0 -m "SimplePad v1.1.0 - Polimento e Confiança"
git push origin v1.1.0
```

## Links

- [AUTO_UPDATE.md](./AUTO_UPDATE.md)
- [DISTRIBUTION.md](./DISTRIBUTION.md)
- [CHANGELOG.md](../CHANGELOG.md)
