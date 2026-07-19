# Screenshots (v1.4)

Coloque capturas reais do app nesta pasta e referencie no [README](../../README.md).

## Lista sugerida (v1.4.x)

| Arquivo                | Conteúdo sugerido                                           |
| ---------------------- | ----------------------------------------------------------- |
| `main-tabs.png`        | Interface com abas, badge MD opcional e status bar          |
| `split-view.png`       | **Editor \| Preview \| Outline** (TOC à direita do Preview) |
| `settings.png`         | Configurações: Geral + aba Templates + toggles Markdown     |
| `preview-markdown.png` | Preview com headings, math (`$…$`) ou mermaid               |
| `format-toggle.png`    | Status Bar Plain Text / Markdown (opcional)                 |
| `search-tabs.png`      | Modal “Buscar em todas as abas” (opcional)                  |

## Como capturar

```bash
npm run dev
# ou abra o app da Release v1.4.1+
```

1. Tema claro **e** escuro se possível.
2. Resolução ~1280×800 ou retina.
3. PNG ou WebP (&lt; 500 KB se der).
4. Para o split: Markdown + Preview + Outline visível (`⌘⇧O` se oculto).

## Placeholders

Enquanto não houver PNGs reais, o README usa SVG de referência em `placeholder-*.svg` (se existirem).

Exemplo no README:

```markdown
![Split com Outline](docs/screenshots/split-view.png)
```
