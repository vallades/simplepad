# SimplePad — Project Overview (v1.3)

Documento de visão da linha **v1.3 “Markdown Avançado”**.  
Histórico completo: [PROJETO.md](./PROJETO.md).

## Versão

| Campo            | Valor                                                 |
| ---------------- | ----------------------------------------------------- |
| Atual            | **1.3.0**                                             |
| Anterior estável | 1.2.1                                                 |
| Foco             | Outline, Math (KaTeX), Mermaid, export PDF com opções |

## O que entra na v1.3

1. **Outline** — headings ATX; clique revela linha no Monaco (Markdown + Preview + setting)
2. **Math** — remark-math + rehype-katex; toggle Settings
3. **Mermaid** — fenced `mermaid` no Preview (lazy load); toggle Settings
4. **PDF export** — margens, tema, incluir outline via `printToPDF`

## Como testar

```bash
git checkout feature/v1.3-markdown-advanced
npm install
npm test && npm run lint && npm run typecheck
npm run dev
```

Checklist:

- [ ] Markdown + Preview → Outline à esquerda; clique em heading
- [ ] `$E=mc^2$` e `$$\int_0^1 x\,dx$$` com Math ligado
- [ ] Bloco mermaid flowchart com Mermaid ligado
- [ ] Exportar PDF → opções → arquivo gerado
- [ ] Desligar toggles em Settings → preview sem math/mermaid/outline

## Release

```bash
git tag -a v1.3.0 -m "SimplePad v1.3.0 - Markdown Avançado"
git push origin v1.3.0
```

## Links

- [AUTO_UPDATE.md](./AUTO_UPDATE.md)
- [DISTRIBUTION.md](./DISTRIBUTION.md)
- [CHANGELOG.md](../CHANGELOG.md)
