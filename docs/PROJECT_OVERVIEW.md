# SimplePad — Project Overview (v1.5)

Visão da linha **v1.5 “Mermaid Avançado”**.  
Histórico completo: [PROJETO.md](./PROJETO.md).

## Versão

| Campo     | Valor                                          |
| --------- | ---------------------------------------------- |
| **Atual** | **1.5.0**                                      |
| Anterior  | 1.4.1                                          |
| Foco      | Tema, export PNG/SVG, zoom/pan e erros Mermaid |

## O que entra na v1.5

1. **Tema sincronizado** — diagramas seguem claro/escuro do app
2. **Export PNG / SVG** — botões no hover de cada diagrama
3. **Zoom + pan** — scroll/botões e arrastar; reset
4. **Erros amigáveis** — mensagem + “Editar código” (reveal no Monaco)
5. **Settings Mermaid** — fonte, curva, espaçamento

## Layout Preview (inalterado)

```
Editor | Preview Markdown | Outline (TOC)
              └── blocos mermaid com toolbar no hover
```

## Como testar

```bash
git checkout feature/v1.5-mermaid-advanced
npm install
npm test && npm run lint && npm run typecheck
npm run dev
```

Checklist:

- [ ] Markdown + Preview; bloco ` ```mermaid `
- [ ] Alternar tema claro/escuro → diagrama atualiza
- [ ] Hover → zoom / pan / export PNG e SVG
- [ ] Código inválido → erro + Editar código
- [ ] Settings → desligar Mermaid / mudar fonte e curva

## Release

```bash
git tag -a v1.5.0 -m "SimplePad v1.5.0 - Mermaid Avançado"
git push origin v1.5.0
```

## Links

- [CHANGELOG.md](../CHANGELOG.md)
- [AUTO_UPDATE.md](./AUTO_UPDATE.md)
- [DISTRIBUTION.md](./DISTRIBUTION.md)
