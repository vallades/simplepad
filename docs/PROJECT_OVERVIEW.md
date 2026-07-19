# SimplePad — Project Overview (v1.7)

Visão da linha **v1.7 “YAML Frontmatter / Properties”**.  
Histórico: [PROJETO.md](./PROJETO.md).

## Versão

| Campo     | Valor                                    |
| --------- | ---------------------------------------- |
| **Atual** | **1.7.0**                                |
| Anterior  | 1.5.0 (Mermaid avançado)                 |
| Foco      | Frontmatter YAML + Properties no Preview |

## O que entra na v1.7

1. Bloco YAML no topo das notas Markdown (`---`)
2. **Properties** no Preview (toggle, persistido)
3. Editor **sem** o YAML editável — body only; save preserva o frontmatter
4. Tags como badges; outros campos key/value

## Como testar

```bash
git checkout feature/v1.7-properties
npm install
npm test && npm run lint && npm run typecheck
npm run dev
```

1. Markdown + Preview
2. Cole frontmatter + body
3. Confirme Properties no topo do Preview
4. Editor não mostra `---`
5. Salvar / reabrir → YAML intacto

## Release

```bash
git tag -a v1.7.0 -m "SimplePad v1.7.0 - YAML Frontmatter e Properties"
git push origin v1.7.0
```
