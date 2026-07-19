# Distribuição, code signing e auto-update

Guia operacional para publicar o **SimplePad** (v1.4.x e posteriores).

**Versão de referência:** ver `package.json` (ex.: **1.4.1**).  
Fluxo de auto-update detalhado: [AUTO_UPDATE.md](./AUTO_UPDATE.md).

## Builds

Pré-requisitos: Node 20+ (recomendado **22**), npm 10+.

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

### CI/CD (GitHub Actions)

| Workflow                        | Trigger            | Saída                                                |
| ------------------------------- | ------------------ | ---------------------------------------------------- |
| `.github/workflows/ci.yml`      | push/PR `main`     | Lint, testes, instaladores como **Artifacts**        |
| `.github/workflows/release.yml` | tag `v*` ou manual | **GitHub Release** com `.dmg` / `.exe` / `.AppImage` |

Secrets de assinatura (opcional): `CSC_LINK`, `CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`.

| SO      | Targets         | Exemplos de artefato (padrão de nome)        |
| ------- | --------------- | -------------------------------------------- |
| Windows | NSIS + portable | `simplepad-*-setup.exe`, `*-portable.exe`    |
| macOS   | DMG + **ZIP**   | `simplepad-*-mac.dmg`, `SimplePad-*-mac.zip` |
| Linux   | AppImage + deb  | `simplepad-*-linux.AppImage`, `*.deb`        |

O **ZIP macOS** é obrigatório para `electron-updater` (Squirrel.Mac).

> **Nota de tamanho:** Electron + Monaco fazem o instalador tipicamente **> 70 MB**. A meta de 70 MB é difícil de atingir sem remover Monaco ou usar runtime compartilhável. Otimizações já aplicadas: `compression: maximum`, chunks lazy, exclusão de testes/docs do asar.

## Code signing (guia completo)

**Estado atual do CI:** builds **não assinados** por padrão. O workflow de Release **aceita** secrets se configurados, mas **não exige** assinatura para publicar.

### Secrets no GitHub Actions (Release)

Em **Settings → Secrets and variables → Actions**, crie (quando tiver certificados):

| Secret                        | Plataforma | Descrição                                                                 |
| ----------------------------- | ---------- | ------------------------------------------------------------------------- |
| `CSC_LINK`                    | Win + mac  | Caminho local **ou** base64 do `.p12` / `.pfx` (muitos usam base64 no CI) |
| `CSC_KEY_PASSWORD`            | Win + mac  | Senha do certificado                                                      |
| `APPLE_ID`                    | macOS      | E-mail da conta Apple Developer                                           |
| `APPLE_APP_SPECIFIC_PASSWORD` | macOS      | Senha de app (appleid.apple.com)                                          |
| `APPLE_TEAM_ID`               | macOS      | Team ID (developer.apple.com → Membership)                                |

O job de package em `.github/workflows/release.yml` só exporta essas variáveis **se não estiverem vazias** (evita o erro `simplepad not a file` no macOS).

**Ainda não ativamos** `notarize: true` nem forçamos assinatura no pipeline — apenas deixamos o caminho pronto. Quando for assinar de verdade:

1. Preencha os secrets acima.
2. Em `electron-builder.yml`, sob `mac:`, use `notarize: true` (requer Apple IDs válidos).
3. Re-rode o workflow **Release** com uma tag nova.

### Windows (Authenticode)

1. Comprar/obter certificado **Code Signing** (OV ou EV; EV reduz atrito SmartScreen).
2. Exportar `.pfx` com chave privada.
3. Local:

```bash
export CSC_LINK=/caminho/cert.pfx          # ou file://...
export CSC_KEY_PASSWORD='********'
npm run dist:win
```

4. **CI:** codifique o `.pfx` em base64 e coloque em `CSC_LINK` (documentação electron-builder: base64 é suportado).
5. Alternativa moderna: **Azure Trusted Signing** (config específica; ver docs electron-builder).

Sem certificado, o instalador funciona, mas o Windows pode mostrar “Windows protegeu o PC”.

### Custo Apple (resumo)

| Item                          | Precisa pagar?                                |
| ----------------------------- | --------------------------------------------- |
| Desenvolver / `npm run dev`   | Não                                           |
| Distribuir DMG sem assinatura | Não (Gatekeeper pede `xattr` / “Abrir”)       |
| **Developer ID + notarizar**  | **Sim — Apple Developer Program ~US$ 99/ano** |

### macOS — “app is damaged” (usuários finais)

Mensagem típica após baixar o `.dmg` / `.zip` da GitHub Release:

> “SimplePad.app” is damaged and can’t be opened. You should move it to the Trash.

**Causa:** atributo de quarentena (`com.apple.quarantine`) + app **não notarizado**. O macOS rotula como “danificado” mesmo com o binário íntegro.

**Contorno (usuário):**

```bash
xattr -cr /Applications/SimplePad.app
open /Applications/SimplePad.app
```

Ou botão direito → **Abrir**. Ou Privacidade e Segurança → permitir o app.

**Correção real (publicador):** assinar com **Developer ID Application** e **notarizar** (abaixo). Enquanto `notarize: false` e não houver secrets no CI, esse aviso continua esperado.

### macOS — auto-update falha com “signature”

Sintoma: update **baixa**, ao instalar/reiniciar aparece erro de **code signature** / o app não troca de versão.

**Causa:** Squirrel.Mac (usado pelo `electron-updater` no Mac) exige o **mesmo Developer ID** no app instalado e no ZIP da Release. Builds ad-hoc do CI **não** satisfazem isso.

**Contorno no app (sem pagar a Apple):** o SimplePad detecta ausência de Developer ID e oferece **instalação via ZIP** (`ditto` + `xattr -cr` + reabrir). Ver [AUTO_UPDATE.md](./AUTO_UPDATE.md).

**Contorno manual:** baixar o `.dmg` da Release, substituir em `/Applications`, rodar `xattr -cr`.

**Correção real:** Developer ID + notarização no CI (tabela de secrets abaixo).

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
