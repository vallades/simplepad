import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer'),
        '@shared': resolve('src/shared')
      }
    },
    plugins: [react(), tailwindcss()],
    optimizeDeps: {
      // Pre-bundle Monaco so Vite/Electron don't choke on its CJS/ESM mix at runtime
      include: ['monaco-editor', '@monaco-editor/react']
    },
    build: {
      // Slightly smaller production assets
      minify: 'esbuild',
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Keep Monaco in its own async chunk (lazy-loaded via Editor)
            if (id.includes('monaco-editor') || id.includes('@monaco-editor')) {
              return 'monaco-editor'
            }
            // Markdown preview / export graph
            if (
              id.includes('node_modules/react-markdown') ||
              id.includes('node_modules/remark') ||
              id.includes('node_modules/rehype') ||
              id.includes('node_modules/mdast') ||
              id.includes('node_modules/micromark') ||
              id.includes('node_modules/unist') ||
              id.includes('node_modules/hast') ||
              id.includes('node_modules/vfile') ||
              id.includes('node_modules/property-information') ||
              id.includes('node_modules/devlop') ||
              id.includes('node_modules/comma-separated-tokens') ||
              id.includes('node_modules/space-separated-tokens') ||
              id.includes('node_modules/decode-named-character-reference') ||
              id.includes('node_modules/character-entities') ||
              id.includes('node_modules/ccount') ||
              id.includes('node_modules/trim-lines') ||
              id.includes('node_modules/markdown-table') ||
              id.includes('node_modules/escape-string-regexp') ||
              id.includes('node_modules/style-to-object') ||
              id.includes('node_modules/inline-style-parser') ||
              id.includes('node_modules/estree-util') ||
              id.includes('node_modules/unified') ||
              id.includes('node_modules/bail') ||
              id.includes('node_modules/trough') ||
              id.includes('node_modules/extend') ||
              id.includes('node_modules/is-plain-obj')
            ) {
              return 'markdown'
            }
            if (id.includes('node_modules/katex')) {
              return 'katex'
            }
            if (id.includes('node_modules/mermaid')) {
              return 'mermaid'
            }
            return undefined
          }
        }
      }
    },
    worker: {
      format: 'es'
    }
  }
})
