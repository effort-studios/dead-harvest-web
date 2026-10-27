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
Organizada por feature (o que o jogador vê), não por tipo de arquivo. O alias `@/` aponta para `src/`
(por exemplo `@/features/farm/model/state`).

```
src/
  app/                 # App.tsx, main.tsx, index.css e session.ts (junta as features)
  shared/
    api/http.ts        # único lugar que usa fetch: request(), post() e ApiError
    ui/icons.tsx       # ícones genéricos (moeda, fechar, olho, fazendeiro...)
  features/
    auth/              # entrar e sair: AuthScreen e api de conta
    profile/           # quem é o jogador: avatar, camadas do retrato, perfil, store do usuário
    farm/              # o jogo
      model/           # regras puras: state, crops, trees, daycycle, types
      render/          # desenho do canvas (draw, props, soil, grass, sprites...)
      components/      # GameCanvas, Hud, SideMenu, DayClock e os ícones do jogo
      api.ts           # catálogo, estado e ações do jogo
      store.ts         # estado do jogo (Zustand) e a fila de ações para o servidor
```

Regra de dependência: `shared` não importa de feature; `profile` só de `shared`; `auth` e `farm` de `shared` e
`profile`; só `app` conhece todas. Por isso as ações que cruzam features passam pelo `app`: o
[session.ts](src/app/session.ts) cuida de entrar (carregar o jogo e então mostrá-lo), sair (esperar as
ações a caminho, deslogar e limpar tudo) e de voltar ao login quando o servidor responde `401` no meio do jogo.
Os componentes de `auth` e `profile` recebem essas ações por props (`onLogin`, `onRegister`, `onLogout`).

## Como funciona o save
Não existe save no navegador: o servidor é a fonte da verdade. Ao abrir, o jogo pede `GET /auth/me`; com sessão
(cookie `dh_session`) carrega o catálogo (`GET /game/catalog`) e o estado (`GET /game/state`), senão mostra o login.
Cada ação do jogador vai para a API, uma de cada vez, e a tela mostra uma previsão até a resposta trazer o estado
de verdade (`features/farm/store.ts`). O formato (`SaveData`) está em `src/features/farm/model/types.ts` e deve
ser igual ao da API.

## Créditos
Interface: [UI Pack – Adventure](https://kenney.nl/assets/ui-pack-adventure) por Kenney, CC0 (`public/assets/ui/License.txt`). Fonte: Fredoka (Google Fonts, carregada pela internet).
Arte do mundo (grama, terra, cerca, objetos, plantas) e ícones: desenhados para o jogo. Regras de estilo em [DESIGN.md](DESIGN.md).

## Controles
- Arrastar com o mouse (ou o dedo) move o mapa; a página nunca rola.
- Clicar num tile da plantação: arar -> plantar -> colher (só colhe se estiver madura).
- **Shift + clique**: faz a ação em toda a linha do tile (só nos tiles no mesmo estado que o clicado). **Ctrl + clique**: o mesmo na coluna.
- Teclas 1 a 9 (ou clique na barra): escolhe a semente ou o adubo. Com o adubo, clicar na terra arada aduba.
- Tudo que se colhe vai para o **Armazém** (menu lateral): venda lá ou use nas máquinas.
- **Planta**: passe o mouse em cima para ver quanto falta para amadurecer.
- **Adubo e regador**: escolha na barra e clique na terra arada ou na planta (+30% cada, somam). O regador (Loja) tem 10 cargas; encha no poço.
- **Construir**: na Loja, escolha o prédio e clique num dos seus terrenos onde ele vai ficar (em chão sem arar) (a prévia fica verde onde pode; Esc cancela). Clique num prédio para abrir o painel dele; coletar manda o fazendeiro buscar. Arraste um prédio para mudar de lugar.
