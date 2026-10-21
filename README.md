# dead-harvest-web

Frontend do **Dead Harvest**: Vite + React + TypeScript, Zustand para o estado e Canvas 2D para o mundo (a partir do item 3).

## Pré-requisitos
- Node.js 22 (com o npm 10.8 do Node 20 a instalação do template falhou; no 22 funcionou)
- A [dead-harvest-api](../dead-harvest-api) rodando

## Como rodar
```bash
npm install
cp .env.example .env     # VITE_API_URL aponta para a API (nunca commite o .env)
npm run dev              # http://localhost:5173
```
A `WEB_URL` do `.env` da API precisa ser `http://localhost:5173` (senão o CORS bloqueia).

## Estrutura
- `src/api` – chamadas HTTP à API
- `src/game` – tipos e lógica do jogo (funções puras sobre o estado)
- `src/render` – desenho no canvas
- `src/store` – estado global (Zustand)
- `src/ui` – componentes React (HUD)

## Como funciona o save
Ao abrir, o jogo lê o `deadHarvestPlayerId` do localStorage. Se não existe (ou a API responde 404), cria um jogador convidado via `POST /players` e guarda o id. Depois carrega o save com `GET /saves/:id`. O formato (`SaveData`) está em `src/game/types.ts` e deve ser igual ao da API.

## Créditos
Sprites: [Isometric Miniature Farm](https://kenney.nl/assets/isometric-miniature-farm) por Kenney, licença CC0 (veja `public/assets/iso-farm/License.txt`).

## Controles
- Arrastar com o mouse (ou o dedo) move o mapa; a página nunca rola.
- Clicar num tile da plantação: arar -> plantar -> colher.
