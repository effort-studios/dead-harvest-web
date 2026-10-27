# Dead Harvest no Electron (POC)

- `npm run electron:dev` — Vite + janela do Electron com hot reload
- `npm run electron:start` — builda e abre o app empacotado localmente
- `npm run electron:build` — gera `release/Dead Harvest <versão>.exe` (portable, Windows)

O app precisa da API rodando (`VITE_API_URL`, por padrão `http://localhost:3333`, é embutida no build).
Como o app roda em `app://game` (outro "site" que a API), a API precisa de:

    WEB_URL=http://localhost:5173,app://game
    COOKIE_SAMESITE=none
