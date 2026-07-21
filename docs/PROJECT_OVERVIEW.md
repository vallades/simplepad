# SimplePad — Project Overview (v2.4)

Visão da linha **v2.4 “Sidebar polish + wiki links”**.  
Histórico: [PROJETO.md](./PROJETO.md).

## Versão

| Campo     | Valor                                            |
| --------- | ------------------------------------------------ |
| **Atual** | **2.4.0**                                        |
| Anterior  | 2.3.0 (Outline / Search / Timeline reais)        |
| Foco      | Polimento Activity Bar + `[[links]]` e backlinks |
| Tag       | `v2.4.0`                                         |

## Wiki links

Sintaxe: `[[Nome da Nota]]` ou `[[Nome|rótulo]]`.

| Superfície | Ação                                                         |
| ---------- | ------------------------------------------------------------ |
| Editor     | Destaque + **Ctrl/Cmd+clique**                               |
| Preview    | Link clicável                                                |
| Existe     | Abre em **aba** (nova se não estiver aberta)                 |
| Não existe | **Nova aba** com `# Título` (+ `.md` no workspace se aberto) |
| Backlinks  | Settings: **Outline** ou **painel Activity Bar**             |

## Activity Bar polish

- Ícone explorador: `FolderTree`
- Hover com lift/scale e fundo azul suave
- Indicador lateral azul (3px) no item ativo
- Refresh da árvore ao salvar/criar
- DnD de arquivos no explorador

## Como testar

```bash
git checkout feature/v2.4-sidebar-polish-links
npm install && npm test && npm run lint && npm run typecheck
npm run dev
```

1. Markdown: `[[Outra Nota]]` + Ctrl/Cmd+clique → nova aba / foca se aberta
2. Link inexistente → cria aba (e arquivo se workspace)
3. Preview → clique no link
4. Settings → Backlinks em painel separado → ícone Link na Activity Bar
5. Hover na Activity Bar

## Release

```bash
git tag -a v2.4.0 -m "SimplePad v2.4.0 - Sidebar polish and internal links"
git push origin v2.4.0
```
