# Branch protection — `main`

Regras recomendadas para a branch **`main`** do SimplePad.  
O job agregador do CI se chama **`CI Success`** (definido em [workflows/ci.yml](./workflows/ci.yml)).

> Estas regras **só se aplicam** se o repositório for **público** (branch protection gratuito) **ou** se a conta/organização tiver plano que inclua branch protection em repositórios privados (GitHub Free em repos privados tem limitações — em private, use “Rulesets” se disponível no seu plano).

---

## Passo a passo no GitHub (UI)

### 1. Abra as configurações da branch

1. No repositório: https://github.com/vallades/simplepad
2. Clique em **Settings** (aba do repositório; precisa ser admin/owner).
3. No menu esquerdo: **Code and automation** → **Branches**  
   (URL direta: `https://github.com/vallades/simplepad/settings/branches`)

### 2. Adicione uma regra para `main`

1. Em **Branch protection rules**, clique **Add branch protection rule**  
   (ou **Add rule** / **Add classic branch protection rule**, conforme a UI).
2. Em **Branch name pattern**, digite exatamente:

   ```text
   main
   ```

### 3. Marque as opções abaixo

Na mesma tela, configure:

| #   | Opção na UI (inglês)                                                   | Valor recomendado                                            |
| --- | ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| 1   | **Require a pull request before merging**                              | ✅ Ativado                                                   |
| 2   | → **Require approvals**                                                | ✅ **1** (ou 0 se for repo solo e não quiser bloquear)       |
| 3   | → **Dismiss stale pull request approvals when new commits are pushed** | ✅ Recomendado                                               |
| 4   | **Require status checks to pass before merging**                       | ✅ Ativado                                                   |
| 5   | → **Require branches to be up to date before merging**                 | ✅ Recomendado                                               |
| 6   | → **Status checks that are required** → busque e selecione             | **`CI Success`**                                             |
| 7   | **Require conversation resolution before merging**                     | ✅ Ativado                                                   |
| 8   | **Do not allow bypassing the above settings**                          | ⬜ **Desmarcado** se você quiser **admins poderem bypassar** |
| 9   | **Allow force pushes**                                                 | ⬜ **Desmarcado** (force push bloqueado)                     |
| 10  | **Allow deletions**                                                    | ⬜ **Desmarcado** (não apagar `main`)                        |

#### Sobre “admins bypass”

- **Permitir admin bypass (recomendado para você sozinho):**
  - Deixe **desmarcado** “Do not allow bypassing the above settings”, **ou**
  - Em algumas UIs existe **“Allow specified actors to bypass…”** / não marque “Include administrators” em checks obrigatórios.
- Em **classic rules**, a caixa antiga era **“Include administrators”** dentro de status checks / PR:
  - **Include administrators** desmarcado → admins podem bypassar (merge direto / sem check).
  - **Include administrators** marcado → regras valem também para admin.

Use a combinação que na sua UI signifique: **regras valem para o time; você (admin) ainda pode emergências.**

#### Status check `CI Success`

1. Ative **Require status checks to pass before merging**.
2. No campo de busca de checks, digite: `CI Success`
3. Se **não aparecer** a lista:
   - Faça um push/PR em `main` e espere o workflow **CI** rodar com sucesso uma vez.
   - O GitHub só lista checks que **já rodaram** no repositório.
4. Selecione exatamente o job:

   ```text
   CI Success
   ```

   (Nome do job em `ci.yml`: `name: CI Success`.)

### 4. Salvar

1. Role até o fim da página.
2. Clique **Create** ou **Save changes**.

### 5. Validar

1. Abra um PR de teste para `main`.
2. Confirme que o merge fica bloqueado até:
   - PR (e aprovação, se exigida)
   - **CI Success** verde
   - Conversas resolvidas
3. Confirme que force push em `main` é rejeitado:

   ```bash
   git push --force origin main   # deve falhar com protected branch
   ```

---

## Alternativa: Repository Rulesets (UI nova)

Em alguns repositórios a Apple/GitHub mostra **Rules → Rulesets** em vez de (ou além de) classic branch protection:

1. **Settings → Rules → Rulesets → New ruleset → New branch ruleset**
2. **Target branches** → include `main`
3. Ative:
   - Restrict deletions
   - Block force pushes
   - Require a pull request before merging (1 approval)
   - Require status checks → **CI Success**
   - Require conversation resolution
4. Em **Bypass list**, adicione sua conta (admin) se quiser bypass.
5. **Create**.

---

## Via GitHub CLI (`gh`) — opcional

Se tiver `gh` autenticado como admin:

```bash
# Classic branch protection (API)
gh api repos/vallades/simplepad/branches/main/protection \
  --method PUT \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["CI Success"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "required_conversation_resolution": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
EOF
```

- `enforce_admins: false` → **admins podem bypassar**.
- `contexts: ["CI Success"]` → exige o job agregador do CI.
- Se a API retornar erro de plano/permissão, use a UI.

Ver regra atual:

```bash
gh api repos/vallades/simplepad/branches/main/protection
```

Remover (só se necessário):

```bash
gh api repos/vallades/simplepad/branches/main/protection --method DELETE
```

---

## Resumo das regras (SimplePad)

| Regra                   | Valor                               |
| ----------------------- | ----------------------------------- |
| Branch                  | `main`                              |
| Require PR before merge | Sim                                 |
| Approvals               | 1 (opcional em solo: 0)             |
| Required status check   | **`CI Success`**                    |
| Branches up to date     | Sim                                 |
| Conversation resolution | Sim                                 |
| Force push              | Bloqueado                           |
| Deletions               | Bloqueadas                          |
| Admin bypass            | Permitido (`enforce_admins: false`) |

---

## Fluxo de trabalho depois da proteção

```text
feature branch → PR para main → CI Success verde → review → merge
```

- **Não** faça `git push origin main` direto no dia a dia (exceto emergência com bypass).
- Releases: `git tag vX.Y.Z` + `git push origin vX.Y.Z` (tags não são bloqueadas pela regra de `main`).

---

## Checklist pós-configuração

- [ ] Pattern `main` salvo
- [ ] PR obrigatório
- [ ] Check **CI Success** aparece e está marcado
- [ ] Force push desabilitado
- [ ] Conversas resolvidas exigidas
- [ ] Admin ainda consegue bypass em emergência
- [ ] PR de teste validou o bloqueio/desbloqueio

---

_Documento alinhado ao workflow CI do SimplePad. Atualize o nome do check se o job em `ci.yml` for renomeado._
