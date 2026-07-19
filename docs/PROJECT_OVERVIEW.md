# SimplePad — Project Overview (v1.2)

Documento de visão da linha **v1.2 “Produtividade”**.  
Histórico completo e arquitetura detalhada: [PROJETO.md](./PROJETO.md).

## Versão

| Campo            | Valor                                                                    |
| ---------------- | ------------------------------------------------------------------------ |
| Atual            | **1.2.0**                                                                |
| Anterior estável | 1.1.0                                                                    |
| Foco             | Templates, rascunhos untitled, overflow de abas, drag & drop de arquivos |

## O que entra na v1.2

1. **Templates de notas** — `userData/templates/`; menu Arquivo; Settings → Templates; defaults (Daily, Reunião, Ideia, Checklist)
2. **Auto-save untitled** — `userData/untitled-notes/untitled-YYYYMMDD-HHmmss.md`; promove no Salvar como; restaura na sessão
3. **Overflow de abas** — botão **…** com dropdown de todas as abas
4. **Drag & drop** — soltar `.txt`/`.md` na janela abre em nova aba
5. **Auto-update** — feed GitHub + contorno de signature no Mac (builds sem Developer ID)

## Como testar (antes do merge)

```bash
git checkout feature/v1.2-productivity
npm install
npm test && npm run lint && npm run typecheck
npm run dev
```

Checklist manual:

- [ ] Arquivo → Nova nota a partir de template → Daily Note
- [ ] Settings → Templates → editar / novo / excluir
- [ ] Digitar em “Sem título” com auto-save on → arquivo em `untitled-notes/`
- [ ] Salvar como → draft removido; título vira nome do arquivo
- [ ] Abrir 7+ abas → **…** lista todas; clique troca
- [ ] Arrastar `.md` do Finder para a janela → nova aba

## userData relevante

| Pasta / arquivo            | Uso                       |
| -------------------------- | ------------------------- |
| `session.json`             | Abas e conteúdo da sessão |
| `preferences.json`         | Settings + recentes       |
| `templates/templates.json` | Templates de notas        |
| `untitled-notes/*.md`      | Rascunhos auto-salvos     |

## Release

```bash
# Após merge em main (se a tag v1.2.0 ainda não existir no remoto com estes assets):
git tag -a v1.2.0 -m "SimplePad v1.2.0 - Produtividade"
git push origin v1.2.0
```

> Se `v1.2.0` já existir no remoto com o pacote anterior, publique **v1.2.1** com o mesmo conteúdo de produtividade.

## Links

- [AUTO_UPDATE.md](./AUTO_UPDATE.md)
- [DISTRIBUTION.md](./DISTRIBUTION.md)
- [CHANGELOG.md](../CHANGELOG.md)
