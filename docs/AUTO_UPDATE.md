# Auto-update — como publicar e testar

O SimplePad **avisa e baixa** atualizações no app **instalado** (build packaged).  
Isso **não** acontece a cada push na `main` — só quando existe uma **GitHub Release** com versão **maior** que a instalada e arquivos `latest*.yml`.

---

## Diagnóstico rápido (por que “não detecta”?)

| Sintoma                                                          | Causa real no SimplePad                                                                                         |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| “Release existe” mas sem update                                  | Só **v1.0.0** tem Release publicada com assets. Tags `v1.0.1` / `v1.1.0` **sem** Release/assets **não contam**. |
| App em 1.1.0, feed em 1.0.0                                      | `electron-updater` só atualiza se `feed.version > app.getVersion()`.                                            |
| Só `npm run dev`                                                 | Auto-check no launch fica **desligado**; use **Ajuda → Verificar atualizações…**.                               |
| Release sem `latest-mac.yml` / `latest.yml` / `latest-linux.yml` | Updater não consegue ler o canal `latest`.                                                                      |
| macOS só com `.dmg`                                              | Update no Mac precisa do **`.zip`** (já configurado no builder).                                                |

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
                                                           toast "disponível — baixando"
                                                           autoDownload: true
                                                      →  5. Diálogo: Reiniciar agora?
                                                           ou instala ao sair
```

| O quê                  | Onde                                                                    |
| ---------------------- | ----------------------------------------------------------------------- |
| Verificação automática | ~8s após abrir (packaged) + 1× por dia                                  |
| Verificação manual     | **Ajuda → Verificar atualizações…** (`Cmd/Ctrl+Shift+U`)                |
| Download               | Automático (`autoDownload: true`)                                       |
| Instalação             | Diálogo “Reiniciar agora” ou no próximo quit (`autoInstallOnAppQuit`)   |
| Feed                   | GitHub Releases + `latest.yml` / `latest-mac.yml` / `latest-linux.yml`  |
| Config main            | `src/main/updater.ts` (`setFeedURL`, `channel: 'latest'`, electron-log) |
| Publish builder        | `electron-builder.yml` → `publish.provider: github`                     |

---

## O que **não** dispara update

- Push na `main` sozinho → só roda o **CI**.
- Tag git **sem** workflow Release / sem assets.
- `npm run dev` → sem auto-check no launch (manual ainda funciona com `forceDevUpdateConfig`).
- Versão da Release **≤** versão instalada.

---

## Passo a passo: lançar a próxima versão (ex.: 1.2.0)

### 1. Atualize a versão

Em `package.json`:

```json
"version": "1.2.0"
```

Atualize o `CHANGELOG.md`.

### 2. Commit e tag

```bash
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore(release): v1.2.0"
git push origin main

git tag -a v1.2.0 -m "SimplePad v1.2.0"
git push origin v1.2.0
```

### 3. Workflow Release

O push da tag `v*` dispara [`.github/workflows/release.yml`](../.github/workflows/release.yml):

- Build Linux / Windows / macOS
- Upload dos instaladores + `latest*.yml` na **GitHub Release**

Ou: **Actions → Release → Run workflow**.

### 4. Confira a Release

https://github.com/vallades/simplepad/releases

Mínimo obrigatório:

| Plataforma | Artefatos                                       |
| ---------- | ----------------------------------------------- |
| Windows    | `*.exe` + **`latest.yml`**                      |
| macOS      | `*.dmg` + **`*.zip`** + **`latest-mac.yml`**    |
| Linux      | `*.AppImage` / `*.deb` + **`latest-linux.yml`** |

Sem os `latest*.yml`, o **electron-updater** não encontra a versão.

### 5. Teste no app instalado (produção)

1. Instale a versão **anterior** (ex.: **v1.0.0**).
2. Publique a versão **nova** (ex.: **v1.2.0**) com assets + yml.
3. Abra o SimplePad **instalado** (não `npm run dev`).
4. Em ~8s: toast de download → diálogo de reinício.
5. Ou: **Ajuda → Verificar atualizações…**.

---

## Como testar localmente (dev e packaged)

### A) Dev (`npm run dev`) — só verificação do feed

1. Confirme que o feed remoto tem versão **>** `package.json`:

   ```bash
   # package.json atual (ex.: 1.1.0)
   curl -sL https://github.com/vallades/simplepad/releases/latest/download/latest-mac.yml | head -5
   ```

2. Se o feed for **menor** (ex. só 1.0.0 publicado), o check corretamente responde “já está na mais recente”. Para forçar detecção **sem** publicar:

   - Temporariamente baixe `"version"` em `package.json` para `0.9.0`, **ou**
   - Publique uma Release de teste com versão maior (recomendado).

3. Rode:

   ```bash
   npm run dev
   ```

4. **Ajuda → Verificar atualizações…** (ou `Cmd/Ctrl+Shift+U`).
5. Veja logs no terminal e em `userData/logs` (`[updater] event:…`).

`dev-app-update.yml` usa o mesmo provider GitHub que produção.

### B) Release de teste `v1.2.0-test` (recomendado)

**Importante:** tags com sufixo `-test` costumam ser tratadas como **prerelease** pelo semver. O app usa `allowPrerelease: false`, então:

- Ou publique a release como **release normal** (não prerelease) com versão **maior** estável, ex. `1.2.0`, **ou**
- Temporariamente teste com `allowPrerelease: true` (não deixe assim em main).

Fluxo limpo:

```bash
# 1. Bump real
# package.json → "1.2.0"

git commit -am "chore(release): v1.2.0"
git tag -a v1.2.0 -m "SimplePad v1.2.0"
git push origin main --tags

# 2. Espere o workflow Release terminar e confira assets:
#    latest.yml, latest-mac.yml, latest-linux.yml + instaladores

# 3. Instale a build ANTIGA (1.0.0) e abra o app packaged
# 4. Ajuda → Verificar atualizações…
```

### C) Packaged local sem publicar no GitHub

1. Build local:

   ```bash
   npm run build
   npx electron-builder --mac --publish never   # ou --win / --linux
   ```

2. Sirva a pasta `dist/` com um HTTP estático e aponte um `dev-app-update.yml` **generic**:

   ```yaml
   provider: generic
   url: http://127.0.0.1:8080/
   ```

3. Garanta `latest-mac.yml` (ou `latest.yml`) com `version:` **maior** que a do app em teste.
4. Rode o `.app` / instalador gerado e force o check.

---

## Configuração no código

| Peça                                                             | Arquivo                                 |
| ---------------------------------------------------------------- | --------------------------------------- |
| `setFeedURL(github)` + `channel: latest` + `autoDownload` + logs | `src/main/updater.ts`                   |
| Publish GitHub + zip mac                                         | `electron-builder.yml`                  |
| Feed de dev                                                      | `dev-app-update.yml`                    |
| Menu Ajuda                                                       | `src/main/menu.ts`                      |
| Toasts                                                           | `src/renderer/services/updateBridge.ts` |
| CI/CD release                                                    | `.github/workflows/release.yml`         |

`appId` / `productName` devem permanecer estáveis (`com.simplepad.app`).

Eventos e toasts:

| Evento updater         | Toast                                   |
| ---------------------- | --------------------------------------- |
| `checking-for-update`  | “Verificando…” (só manual)              |
| `update-available`     | “Nova versão X — baixando…”             |
| `download-progress`    | 25% / 50% / 75% / 100%                  |
| `update-downloaded`    | “Versão X baixada…” + diálogo reiniciar |
| `update-not-available` | “Já está na mais recente” (só manual)   |
| `error`                | Mensagem de erro (só manual se silent)  |

---

## Assinatura de código

Sem assinatura:

- **macOS:** Gatekeeper pode bloquear update/instalador
- **Windows:** SmartScreen pode assustar o usuário

Ver [DISTRIBUTION.md](./DISTRIBUTION.md).

---

## Troubleshooting

| Sintoma                                | Causa / ação                                                 |
| -------------------------------------- | ------------------------------------------------------------ |
| Nunca avisa                            | App via `npm run dev` ou versão do feed ≤ instalada          |
| Erro ao verificar                      | Release sem `latest*.yml`, rede, ou rate limit da API GitHub |
| “Já está na mais recente” com tag nova | Tag **sem** Release publicada, ou Release draft/prerelease   |
| Mac baixa e falha                      | Falta o `.zip` na Release; só `.dmg` não serve para updater  |
| Update baixa mas não instala           | Usuário clicou “Depois” — instala no próximo quit            |
| Logs vazios                            | Confirme `electron-log` em `userData/logs` / `Library/Logs`  |

---

## Resumo em uma frase

**Versão no package.json > versão instalada → tag `vX.Y.Z` → Actions publica Release com `latest*.yml` → app packaged detecta, baixa e pede reinício.**
