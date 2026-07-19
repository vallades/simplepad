# Auto-update — como publicar e testar

O SimplePad **avisa e baixa** atualizações no app **instalado** (build packaged).  
Isso **não** acontece a cada push na `main` — só quando existe uma **GitHub Release** com versão **maior** que a instalada e arquivos `latest*.yml`.

**Versão estável de referência do repositório:** ver `package.json` (hoje **2.0.0**).

---

## Diagnóstico rápido (por que “não detecta”?)

| Sintoma                                                          | Causa comum                                                                 |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------- |
| “Release existe” mas sem update                                  | Tag git **sem** assets / sem `latest*.yml`, ou Release draft                |
| App em X.Y.Z, feed em versão ≤ X.Y.Z                             | `electron-updater` só atualiza se `feed.version > app.getVersion()`         |
| Só `npm run dev`                                                 | Auto-check no launch **desligado**; use **Ajuda → Verificar atualizações…** |
| Release sem `latest-mac.yml` / `latest.yml` / `latest-linux.yml` | Updater não lê o canal `latest`                                             |
| macOS só com `.dmg`                                              | Update no Mac precisa do **`.zip`** (já no builder)                         |
| macOS: baixa e falha com signature                               | Builds sem Developer ID — app usa instalador custom (ditto + xattr)         |

Verifique o feed público:

```bash
curl -sL https://github.com/vallades/simplepad/releases/latest/download/latest-mac.yml
# version: X.Y.Z  ← precisa ser > versão instalada
```

Logs do app (macOS):

```bash
open ~/Library/Logs/simplepad/main.log
# ou
tail -f ~/Library/Application\ Support/simplepad/logs/main.log
```

Procure por linhas `[updater]`.

---

## Visão geral

```
Você                          GitHub                         App do usuário
────                          ──────                         ─────────────
1. Sobe versão no package.json
2. git tag vX.Y.Z + push  →  Actions "Release" gera
                             .exe / .dmg / .zip / .AppImage
                             + latest.yml / latest-mac.yml
                               / latest-linux.yml
                                                      →  3. Ao abrir o app (packaged):
                                                           setFeedURL(github) + channel latest
                                                           consulta o release mais recente
                                                      →  4. Se version > atual:
                                                           toast + autoDownload
                                                      →  5. Reiniciar / quitAndInstall
                                                           (Mac unsigned: ditto + xattr)
```

| O quê                  | Onde                                                     |
| ---------------------- | -------------------------------------------------------- |
| Verificação automática | ~8s após abrir (packaged) + 1× por dia                   |
| Verificação manual     | **Ajuda → Verificar atualizações…** (`Cmd/Ctrl+Shift+U`) |
| Download               | Automático (`autoDownload: true`)                        |
| Feed                   | GitHub Releases + `latest*.yml`                          |
| Config main            | `src/main/updater.ts`                                    |
| Publish builder        | `electron-builder.yml` → `publish.provider: github`      |

---

## O que **não** dispara update

- Push na `main` sozinho → só **CI**.
- Tag git **sem** workflow Release / sem assets.
- `npm run dev` → sem auto-check no launch.
- Versão da Release **≤** versão instalada.

---

## Passo a passo: lançar a próxima versão

### 1. Atualize a versão

Em `package.json` (ex.: `1.4.2`) e `CHANGELOG.md`.

### 2. Commit e tag

```bash
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore(release): v1.4.2"
git push origin main

git tag -a v1.4.2 -m "SimplePad v1.4.2"
git push origin v1.4.2
```

### 3. Workflow Release

Push da tag `v*` → [`.github/workflows/release.yml`](../.github/workflows/release.yml):

- Build Linux / Windows / macOS
- Upload dos instaladores + `latest*.yml` na **GitHub Release**

Ou: **Actions → Release → Run workflow**.

### 4. Confira a Release

https://github.com/vallades/simplepad/releases

Mínimo:

| Plataforma | Artefatos                                    |
| ---------- | -------------------------------------------- |
| Windows    | `*.exe` + **`latest.yml`**                   |
| macOS      | `*.dmg` + **`*.zip`** + **`latest-mac.yml`** |
| Linux      | AppImage/deb + **`latest-linux.yml`**        |

### 5. Teste no app instalado

1. Instale uma versão **anterior**.
2. Publique a versão **nova**.
3. Abra o app **packaged** (não `npm run dev`).
4. Aguarde ~8s ou use **Ajuda → Verificar atualizações…**.

---

## Teste em desenvolvimento

```bash
npm run dev
# Ajuda → Verificar atualizações…
```

O `dev-app-update.yml` aponta para o mesmo provider GitHub.  
Com `package.json` **≥** feed público, o resultado esperado é “já está na mais recente”.

---

## macOS: signature / baixa mas não instala

Squirrel.Mac exige o **mesmo Developer ID** no app e no ZIP. Builds ad-hoc do CI falham na instalação nativa.

O SimplePad, **sem** Developer ID:

1. Detecta com `codesign`
2. Oferece instalação via ZIP (`ditto` + `xattr -cr`)
3. Ou download manual da Release

**Correção definitiva:** Apple Developer Program (~US$ 99/ano) + secrets `CSC_*` / `APPLE_*` + notarização.  
Ver [DISTRIBUTION.md](./DISTRIBUTION.md).

Log do instalador customizado:

```bash
open ~/Library/Logs/simplepad/update-install.log
```

---

## Configuração no código

| Peça                                       | Arquivo                                 |
| ------------------------------------------ | --------------------------------------- |
| Updater + feed GitHub + Mac custom install | `src/main/updater.ts`                   |
| Publish                                    | `electron-builder.yml`                  |
| Feed de dev                                | `dev-app-update.yml`                    |
| Menu Ajuda                                 | `src/main/menu.ts`                      |
| Toasts                                     | `src/renderer/services/updateBridge.ts` |
| CI Release                                 | `.github/workflows/release.yml`         |

---

## Troubleshooting

| Sintoma                      | Ação                                     |
| ---------------------------- | ---------------------------------------- |
| Nunca avisa                  | Packaged? Versão do feed &gt; instalada? |
| Erro ao verificar            | `latest*.yml` na Release? Rede?          |
| Tag nova sem update          | Release publicada com assets?            |
| Mac: signature               | Use “Instalar via ZIP” ou assine o app   |
| Update baixa mas não instala | “Depois” clicado; reinicie o app         |

---

## Resumo

**Sobe a versão → tag `vX.Y.Z` → Actions publica a Release com `latest*.yml` → app packaged detecta, baixa e instala.**
