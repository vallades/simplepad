# SimplePad v1.0.1

Patch focado em **auto-update**, estabilidade do **CI** e documentação.

## Novidades para o usuário

- Ao abrir o app **instalado**, se houver versão nova no GitHub:
  - aviso de download automático
  - diálogo **Reiniciar agora** / **Depois**
- Verificação manual: **Ajuda → Verificar atualizações…**
- Re-check diário se o app permanecer aberto

## Para quem publica releases

Guia completo: [AUTO_UPDATE.md](./AUTO_UPDATE.md)

```bash
# Bump package.json version → commit → tag → push tag
git tag -a v1.0.2 -m "SimplePad v1.0.2"
git push origin v1.0.2
```

## Correções de CI

- Windows: build não falha mais por redirect PowerShell (`D:\dev\null`)
- main: builds longos (macOS) não são cancelados por concurrency
- macOS Release: secrets de assinatura vazios não quebram o packaging

## Download

Assets desta release (Actions + instaladores).

Quem está na **v1.0.0** instalada deve receber o aviso de update para **1.0.1** automaticamente (app packaged).

### macOS: “app is damaged”

Não é o arquivo corrompido — é o Gatekeeper (app ainda sem notarização Apple). No Terminal:

```bash
xattr -cr /Applications/SimplePad.app
```

Depois abra o app normalmente. Detalhes: [DISTRIBUTION.md](./DISTRIBUTION.md).

---

**SimplePad** — Simples por design. Poderoso por escolha.
