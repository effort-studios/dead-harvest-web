# dead-harvest-web

Frontend do **Dead Harvest**: Vite + React + TypeScript, Zustand para o estado e Canvas 2D para o mundo.

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

Arte (mundo, fazendeiro, ícones e molduras da interface): pixel art gerada na [PixelLab](https://pixellab.ai) e montada pelos scripts em `scripts/` (originais em `art/pixellab`). Fonte: Duality (`public/assets/fonts/duality.otf`). Regras de estilo em [DESIGN.md](DESIGN.md).

## Controles

- Arrastar com o mouse (ou o dedo) move o mapa; a página nunca rola. Roda do mouse ou pinça com dois dedos dá zoom.
- **Clicar no chão ou num tile** abre um menu com o que dá para fazer ali: arar, desfazer a aragem, plantar, regar, adubar, colher e **Mover para cá**. Os botões **Linha** e **Coluna** do menu repetem a ação na linha/coluna inteira. Esc fecha o menu.
- **Shift + clique**: faz a ação direto em toda a linha do tile (só nos tiles no mesmo estado que o clicado), sem menu. **Ctrl + clique**: o mesmo na coluna.
- **Alt + clique**: o fazendeiro só anda até a célula, sem agir.
- Teclas 1 a 9 (ou clique na barra): escolhe a semente ou o adubo. Com o adubo, clicar na terra arada aduba.
- Tudo que se colhe vai para o **Armazém** (menu lateral): venda lá ou use nas máquinas.
- **Planta** e **árvore**: passe o mouse em cima para ver quanto falta para amadurecer.
- **Adubo e regador**: escolha na barra e clique na terra arada ou na planta (+30% cada, somam). O regador (Loja) tem 10 cargas; encha no poço.
- **Construir**: na Loja, escolha o prédio e clique num dos seus terrenos onde ele vai ficar (em chão sem arar) (a prévia fica verde onde pode; Esc cancela). Clique num prédio para abrir o painel dele; coletar manda o fazendeiro buscar. Arraste um prédio para mudar de lugar.
- **Celular**: o HUD fica compacto e os gestos de toque (arrastar, pinça, toque) fazem o mesmo que o mouse.
- **Música**: o player no canto toca uma playlist lofi do YouTube em loop, com pausar, anterior/próxima, volume e link para a faixa atual. Volume e pausa ficam salvos no navegador.
