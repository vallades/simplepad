# Distribuição, code signing e auto-update

Guia operacional para publicar o **SimplePad v1.0**.

## Builds

Pré-requisitos: Node 20+, npm 10+.

```bash
# Dependências
npm install

# Qualidade
npm test && npm run typecheck && npm run lint

# Build de produção (out/)
npm run build

# Instaladores (plataforma atual)
npm run dist

# Por SO
npm run dist:mac
npm run dist:win
npm run dist:linux

# Todas as plataformas (requer ambiente com tools multi-OS ou CI)
npm run dist:all
```

Artefatos em `dist/`.

| SO      | Targets               | Exemplos de artefato                          |
| ------- | --------------------- | --------------------------------------------- |
| Windows | NSIS + portable       | `simplepad-1.0.0-setup.exe`, `…-portable.exe` |
| macOS   | DMG + ZIP (universal) | `simplepad-1.0.0-mac.dmg`                     |
| Linux   | AppImage + deb        | `simplepad-1.0.0-linux.AppImage`              |

> **Nota de tamanho:** Electron + Monaco fazem o instalador tipicamente **> 70 MB**. A meta de 70 MB é difícil de atingir sem remover Monaco ou usar runtime compartilhável. Otimizações já aplicadas: `compression: maximum`, chunks lazy, exclusão de testes/docs do asar.

## Code signing

### Windows

1. Obter certificado Authenticode (EV recomendado para SmartScreen).
2. Exportar `.pfx` e definir:

```bash
export CSC_LINK=/caminho/cert.pfx
export CSC_KEY_PASSWORD=********
npm run dist:win
```

Ou via Azure Trusted Signing / CI secrets.

### macOS — signing + notarization

1. Conta Apple Developer, certificado **Developer ID Application**.
2. App-specific password em [appleid.apple.com](https://appleid.apple.com).
3. Variáveis:

```bash
export CSC_LINK=/caminho/Certificates.p12
export CSC_KEY_PASSWORD=********
export APPLE_ID=seu@email.com
export APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
export APPLE_TEAM_ID=XXXXXXXXXX
```

4. Em `electron-builder.yml`, mude:

```yaml
mac:
  notarize: true
```

5. Build:

```bash
npm run dist:mac
```

`build/entitlements.mac.plist` já inclui flags JIT necessárias ao V8/Monaco.

### Linux

Signing de AppImage/deb é opcional (GPG). Muitos canais distribuem sem assinatura.

## Auto-update (GitHub Releases)

Configurado via:

- `electron-builder.yml` → `publish.provider: github`
- `src/main/updater.ts` → `electron-updater`
- Menu **Ajuda → Verificar atualizações…**
- Em dev: `forceDevUpdateConfig` + `dev-app-update.yml`

### Publicar um release

```bash
# 1. Bump version in package.json if needed
# 2. Build + publish (token com scope repo)
export GH_TOKEN=ghp_xxxxxxxx
npm run build
npx electron-builder --mac --win --linux --publish always
```

Ou use GitHub Actions com `softprops/action-gh-release` / `samuelmeuli/action-electron-builder`.

O feed de updates é o **GitHub Releases** do repositório `vallades/simplepad`. Cada release deve conter os artefatos gerados pelo electron-builder **e** os arquivos `latest*.yml` / `latest-mac.yml` etc. (gerados automaticamente no publish).

### Testar updater em desenvolvimento

1. Ajuste `dev-app-update.yml` para um feed genérico acessível.
2. Rode `npm run dev` — o updater usa `forceDevUpdateConfig`.
3. Menu **Ajuda → Verificar atualizações…** — espere toasts de checking / error / available.

Sem um feed real, o erro de rede/404 é **esperado**.

## Smoke checklist por plataforma

- [ ] App abre &lt; 5s em máquina média
- [ ] Abrir / salvar `.md` e `.txt`
- [ ] Preview Split View + export HTML/PDF
- [ ] Auto-save e sessão após restart
- [ ] Modo Distração Zero (F11) entra e sai (Esc)
- [ ] Verificar atualizações (toast)
- [ ] Instalador roda e cria atalho

## Limitações conhecidas

| Item                  | Detalhe                                                      |
| --------------------- | ------------------------------------------------------------ |
| `sandbox: false`      | Workers do Monaco no renderer                                |
| Tamanho do instalador | Dominado por Electron + Monaco                               |
| Notarize default      | `notarize: false` até credenciais estarem prontas            |
| Update em dev         | Requer feed configurado; caso contrário mostra erro amigável |
