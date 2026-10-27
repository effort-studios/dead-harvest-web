# Design system do Dead Harvest

Regras para tudo ter cara de "feito pela mesma mão". Antes de criar um objeto novo, leia isto.

## Estilo

**Pixel art de fazenda aconchegante**, gerada na [PixelLab](https://pixellab.ai) e montada por scripts
(`scripts/`). Cores saturadas, contorno escuro de uma cor, sombreamento médio, luz vinda da esquerda e de cima.
Nada é desenhado por código no mapa, exceto a cerca (precisa encaixar exatamente na aresta do tile) e as
marcações da interface (seleção, prévia de construção, balões).

## Escala e projeção

- Isométrica 2:1. No **mundo**, cada tile é um losango de 96 × 48 unidades; no **desenho**, de 64 × 32 pixels.
  Logo, **1 pixel da arte = 1,5 unidade do mundo** (`PX` em `render/sprites.ts`). Todo sprite do mapa usa essa
  escala, para os pixels terem o mesmo tamanho na tela. Não amplie um sprite à parte: gere no tamanho certo.
- A célula (linha `r`, coluna `c`) fica em `x = ORIGEM_X + (c - r) * 48` e `y = ORIGEM_Y + (c + r) * 24`.
  Os itens são desenhados do fundo para a frente, ordenados por `r + c`.
- Os sprites são desenhados com `imageSmoothingEnabled = false` (canvas) e `image-rendering: pixelated` (CSS).

## Tamanho de cada coisa (pixels da arte)

| Coisa | Canvas na PixelLab | Ocupa |
|---|---|---|
| Tile de chão | 64 × 64 (losango 64 × 32 no meio) | 1 célula |
| Celeiro | 200 × 200 | 3 × 3 |
| Máquina grande (moinho, laticínios...) | 128 × 144 a 128 × 176 | 2 × 2 |
| Máquina pequena (prensa, forno...), poço | 64 × 80 | 1 × 1 |
| Árvore | 96 × 112 | 1 × 1 |
| Fardo, palete, arbusto, pedra, saco | 40 a 64 | 1 × 1 |
| Planta (3 estágios) | 64 × 64 | 1 × 1 |
| Animais | 32 (galinha) a 56 (vaca) | — |
| Fazendeiro | 48 × 48 (folha em células de 64) | — |
| Ícone da interface | 32 × 32 | — |

## Ferramentas da PixelLab por tipo

| Tipo | Ferramenta | Observação |
|---|---|---|
| Chão (grama, terra) | `create_tiles_pro` (isometric, tile 64, ângulo 30, profundidade 0) | grama sem a beirada escura de baixo (o build tira) |
| Prédios, máquinas, objetos, animais | `create_map_object` (view `high top-down`, `single color outline`, `medium shading`) | descreva "isometric ..., corner facing viewer, cozy farm game, bright colors" |
| Plantas e ícones | `create_1_direction_object` com `item_descriptions` (16 por vez em 64 px, 64 por vez em 32 px) | sai um lote coerente; escolha os quadros |
| Fazendeiro | `create_character` (v3, 48 px) + `animate_character` | andar e abaixar por template; enxada em v3 |
| Molduras da interface | `create_ui_asset` | vêm com cada pixel em 3 × 3; o build reduz |

O registro do que foi gerado (ids) está em `art/pixellab/ledger.tsv`; as imagens originais, em `art/pixellab/raw`.

### Prédios: o moinho é a referência

Todos os prédios seguem o acabamento do moinho (`raw/mill.png`): textura de material desenhada pixel a pixel
(pedra, tábuas, telhas gastas), contorno marrom escuro, brilhos suaves, **sem base de grama ou terra embaixo**.
Para fazer um prédio novo: gere com `create_map_object` e depois redesenhe com `edit_image_pro_flash`
(`method: reference`, referência = recorte do moinho que caiba no canvas: `raw/restyle/mill_ref_big.png` para
2x2 e 3x3, `mill_ref_small.png` para 1x1), pedindo para **manter a forma e as cores originais** e só trocar o
acabamento. Sem "mantenha as cores", ele puxa tudo para o marrom do moinho. O resultado vai para `raw/restyle`.

## Animação

- Sprites animados são tiras (`<nome>_anim.png`) com os quadros lado a lado; `<nome>.png` é o quadro parado,
  usado nos ícones. O atlas guarda `frames` e `fps`; `drawSprite` escolhe o quadro pelo relógio, e `phase`
  desencontra cópias do mesmo sprite (os animais não pastam em sincronia).
- Sem fazendeiro andando, a cena é redesenhada a 8 quadros por segundo (`SCENE_FPS`); com ele, a cada frame.
- Gere com `animate_image` usando o sprite parado como primeiro **e** último quadro: o loop fecha sozinho, e o
  último quadro (igual ao primeiro) fica de fora. Serve para movimentos que vão e voltam (animais pastando,
  óleo borbulhando).
- O que o modelo não acerta é montado no build, a partir do sprite:
  - **Giro (moinho):** o modelo só gira as pás 45° e, pedindo para fechar o ciclo, ele volta para trás. O build
    separa a torre das pás (cor mais comum de cada pixel entre os quadros) e continua o giro espelhando as pás
    em torno do eixo (`MILL_HUB`), em ordem reversa. Com 4 pás, 90° é uma volta inteira: o giro é contínuo.
  - **Fumaça (cozinha):** o modelo soltava a fumaça do telhado. O build desenha baforadas saindo de `CHIMNEY`,
    subindo, crescendo e sumindo em pontilhado.
  - **Fogo (forno):** em chamas pequenas o modelo só muda o brilho. O build desenha línguas de fogo dentro da
    boca (`OVEN_MOUTH`), do vermelho na base ao amarelo na ponta, com alturas que sobem e descem.
- Animados hoje: moinho (pás), cozinha (fumaça), tacho (óleo e fogo), forno (fogo), galinha (bica o chão),
  vaca e ovelha (pastam).

## Como acrescentar ou trocar uma arte

1. Gere com a ferramenta da tabela, com a mesma descrição de estilo e o tamanho da tabela de tamanhos.
2. Salve o PNG em `art/pixellab/raw` e registre no `SPRITES`/`CROPS`/`ICONS` de `scripts/build_world_sprites.py`.
3. Rode `python3 scripts/build_world_sprites.py`: ele limpa restos soltos, recorta, acha o ponto de apoio no chão
   (meio do losango da base, ou o pé) e grava `public/assets/world`, `public/assets/icons` e
   `src/features/farm/render/worldAtlas.json`.
4. No jogo, desenhe com `drawSprite(ctx, nome, x, y)`, com (x, y) no centro da célula.
5. Teste ao lado da grama, da terra e de um objeto existente.

Outros builds: `scripts/build_farmer_sheet.py` (folha do fazendeiro), `scripts/build_ui_frames.py` (molduras),
`scripts/draw_fence.py` (cerca) e `scripts/build_avatar_layers.py` (camadas do retrato).

## Interface

- Molduras 9-slice em pixel art (`public/assets/ui`): `panel.png` (dourada), `panel_light.png` (dourada com
  miolo creme, para janelas) e `slot.png` (madeira com miolo creme). A borda da arte tem 9 pixels: 2x nos painéis,
  1x nos botões e slots (o ícone de 32 px fica exato no miolo).
- Ícones dos itens e da HUD: `PixelIcon` (`shared/ui/icons.tsx`). Prédios e animais usam o próprio sprite do mapa.
  Ícones de comando (salvar, olho, fechar) continuam em SVG.
- Fonte: Duality (`public/assets/fonts/duality.otf`).

## Fazendeiro e avatar

O fazendeiro é desenhado de macacão azul, pele clara e cabelo castanho; a roupa, a pele e a cor do cabelo do
avatar entram recolorindo esses pixels em tempo de execução (`render/farmerSprite.ts`, mesma troca por
luminosidade do retrato em `profile/render/avatarLayers.ts`). Chapéu, barba e penteado aparecem só no retrato.

## O que ainda falta padronizar

- Grama, plantas e árvores não se mexem (vento); não há sprites de dia/noite.
- O "pegar" do fazendeiro usa só o abaixar (o quadro do meio da animação gerada saiu quebrado).
