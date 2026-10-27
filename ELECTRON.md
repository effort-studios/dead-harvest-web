# Dead Harvest no Electron (POC)

- `npm run electron:dev` — Vite + janela do Electron com hot reload
- `npm run electron:start` — builda e abre o app empacotado localmente
- `npm run electron:build` — gera `release/Dead Harvest.exe` (portable, Windows)

O app precisa da API rodando (`VITE_API_URL`, por padrão `http://localhost:3333`, é embutida no build).
Como o app roda em `app://game` (outro "site" que a API), a API precisa de:

    WEB_URL=http://localhost:5173,app://game
    COOKIE_SAMESITE=none

Se o app fechar na hora ao rodar de um terminal do VS Code, a variável `ELECTRON_RUN_AS_NODE=1` está definida
no ambiente (faz o Electron rodar como Node puro). Limpe-a (`Remove-Item Env:ELECTRON_RUN_AS_NODE`) ou abra o `.exe` pelo Explorer.
