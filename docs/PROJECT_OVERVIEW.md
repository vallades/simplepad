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

| Superfície      | Ação                                       |
| --------------- | ------------------------------------------ |
| Editor (Monaco) | Destaque + **Ctrl/Cmd+clique**             |
| Preview         | Link clicável                              |
| Outline sidebar | Seção **Links para esta nota** (backlinks) |

Resolução: aba aberta → arquivo no workspace → criar `Nome.md` (se workspace ativo).

## Activity Bar polish

- Ícone explorador: `FolderTree`
- Hover com leve lift/scale e fundo azul suave
- Indicador lateral azul (3px) no item ativo
- Refresh da árvore ao salvar/criar (já via `explorerEvents`)
- DnD de arquivos no explorador (já implementado)

## Como testar

```bash
git checkout feature/v2.4-sidebar-polish-links
npm install && npm test && npm run lint && npm run typecheck
npm run dev
```

1. Em Markdown: digite `[[Outra Nota]]` — destaque no editor
2. Ctrl/Cmd+clique → abre/cria a nota
3. Preview com Split — clique no link
4. Em outra aba, `[[Outra Nota]]` → Outline mostra backlink
5. Activity Bar: hover e indicador ativo

## Release

```bash
git tag -a v2.4.0 -m "SimplePad v2.4.0 - Sidebar polish and internal links"
git push origin v2.4.0
```
