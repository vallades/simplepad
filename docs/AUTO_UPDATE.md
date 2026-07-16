# Auto-update — como publicar uma nova versão para os usuários

O SimplePad **já avisa e baixa** atualizações sozinho no app **instalado** (não no `npm run dev`).  
Isso **não** acontece a cada push na `main` — só quando você publica uma **nova versão** no GitHub Releases.

---

## Visão geral

```
Você                          GitHub                         App do usuário
────                          ──────                         ─────────────
1. Sobe versão no package.json
2. git tag v1.0.1 + push  →  Actions "Release" gera
                             .exe / .dmg / .AppImage
                             + latest.yml (feed)
                                                      →  3. Ao abrir o app (packaged):
                                                           electron-updater consulta
                                                           o release mais recente
                                                      →  4. Se version > atual:
                                                           toast "Nova versão — baixando"
                                                           download automático
                                                      →  5. Diálogo: Reiniciar agora?
                                                           ou instala ao sair do app
```

| O quê                  | Onde                                                                            |
| ---------------------- | ------------------------------------------------------------------------------- |
| Verificação automática | ~8s após abrir o app + 1× por dia se ficar aberto                               |
| Verificação manual     | Menu **Ajuda → Verificar atualizações…**                                        |
| Download               | Automático (`autoDownload: true`)                                               |
| Instalação             | Diálogo “Reiniciar agora” ou no próximo quit (`autoInstallOnAppQuit`)           |
| Feed                   | GitHub Releases + arquivos `latest.yml` / `latest-mac.yml` / `latest-linux.yml` |

---

## O que **não** dispara update

- Push na `main` sozinho → só roda o **CI** (testes/build).
- `npm run dev` → auto-check **desligado** (só checagem manual / feed de dev).
- App sem ser o instalador da Release (build solto sem versionamento coerente).

---

## Passo a passo: lançar a próxima versão (ex.: 1.0.2)

### 1. Atualize a versão

Em `package.json`:

```json
"version": "1.0.2"
```

Atualize o `CHANGELOG.md` com as mudanças.

### 2. Commit e tag

```bash
git add package.json package-lock.json CHANGELOG.md
git commit -m "chore(release): v1.0.2"
git push origin main

git tag -a v1.0.2 -m "SimplePad v1.0.2"
git push origin v1.0.2
```

### 3. Workflow Release

O push da tag `v*` dispara [`.github/workflows/release.yml`](../.github/workflows/release.yml):

- Build em Linux / Windows / macOS
- Upload dos instaladores + `latest*.yml` na **GitHub Release**

Ou dispare manualmente: **Actions → Release → Run workflow**.

### 4. Confira a Release

https://github.com/vallades/simplepad/releases

Deve conter, no mínimo:

- Instaladores (`.exe`, `.dmg` / `.zip`, `.AppImage` / `.deb`)
- `latest.yml` (Windows)
- `latest-mac.yml` (macOS)
- `latest-linux.yml` (Linux)

Sem os `latest*.yml`, o **electron-updater** não encontra a versão.

### 5. Teste no app instalado

1. Instale a versão anterior (ex.: **v1.0.0**) a partir da release.
2. Publique a versão nova (ex.: **v1.0.1** / **v1.0.2**) como acima.
3. Abra o SimplePad **instalado** (não `npm run dev`).
4. Em ~8s: se houver update → toast de download → diálogo de reinício.
5. Ou: **Ajuda → Verificar atualizações…**

---

## Configuração já feita no código

| Peça                                 | Arquivo                                             |
| ------------------------------------ | --------------------------------------------------- |
| `electron-updater` + check no launch | `src/main/updater.ts`                               |
| Publish GitHub                       | `electron-builder.yml` → `publish.provider: github` |
| Toasts no renderer                   | `src/renderer/services/updateBridge.ts`             |
| Menu Ajuda                           | `src/main/menu.ts`                                  |
| CI/CD release                        | `.github/workflows/release.yml`                     |

`appId` / `productName` devem permanecer estáveis entre versões (`com.simplepad.app`), senão o SO trata como outro app.

---

## Assinatura de código (recomendado depois)

Sem assinatura:

- **macOS:** Gatekeeper pode bloquear o update/instalador
- **Windows:** SmartScreen pode assustar o usuário

Secrets para o workflow (quando for assinar): ver [DISTRIBUTION.md](./DISTRIBUTION.md).

---

## Troubleshooting

| Sintoma                      | Causa comum                                         |
| ---------------------------- | --------------------------------------------------- |
| Nunca avisa update           | App aberto via `npm run dev` / não é build packaged |
| Erro ao verificar            | Release sem `latest*.yml` ou rede/firewall          |
| Versão “não encontrada”      | `package.json` da release nova ≤ versão instalada   |
| Update baixa mas não instala | Usuário clicou “Depois” e ainda não saiu do app     |
| macOS falha no Release CI    | Secrets `CSC_*` vazios — já tratado no workflow     |

---

## Resumo em uma frase

**Sobe a versão → tag `vX.Y.Z` → Actions publica a Release → o app instalado detecta, baixa e pede para reiniciar.**
