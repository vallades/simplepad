# SimplePad — Project Overview (v1.4)

Documento de visão da linha **v1.4 “Formato Markdown antes de salvar”**.  
Histórico completo: [PROJETO.md](./PROJETO.md).

## Versão

| Campo            | Valor                                               |
| ---------------- | --------------------------------------------------- |
| Atual            | **1.4.0**                                           |
| Anterior estável | 1.3.0                                               |
| Foco             | Alternar Plain Text ↔ Markdown e extensão ao salvar |

## O que entra na v1.4

1. **Nova aba = Plain Text** (opção Settings para padrão Markdown)
2. **Toggle de formato** — Status Bar + clique direito na aba
3. **Markdown on** → linguagem Monaco + Preview (se configurado) + preview reativo
4. **Salvar como** → `.md` se Markdown, `.txt` se Plain Text
5. **Arquivos .md** abrem sempre em Markdown

## Como testar

```bash
git checkout feature/v1.4.0-markdown-format
npm install
npm test && npm run lint && npm run typecheck
npm run dev
```

Checklist:

- [ ] Nova aba → Status Bar mostra **Plain Text**
- [ ] Clique no toggle → **Markdown**, Preview liga, digite `# título` e veja render
- [ ] Clique direito na aba → “Alterar formato para Plain Text”
- [ ] Salvar como em Markdown → nome termina em `.md`
- [ ] Salvar como em Plain Text → `.txt`
- [ ] Abrir arquivo `.md` → já em Markdown
- [ ] Settings → “Nova aba padrão: Markdown”

## Release

```bash
git tag -a v1.4.0 -m "SimplePad v1.4.0 - Formato Markdown antes de salvar"
git push origin v1.4.0
```

## Links

- [CHANGELOG.md](../CHANGELOG.md)
- [AUTO_UPDATE.md](./AUTO_UPDATE.md)
