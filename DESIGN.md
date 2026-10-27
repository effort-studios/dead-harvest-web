# Design system do Dead Harvest

Regras para tudo ter cara de "feito pela mesma mão". Antes de criar um objeto novo, leia isto.
Os valores de cor e contorno dos objetos estão em [src/features/farm/render/style.ts](src/features/farm/render/style.ts).

## Princípios

1. **Cartoon limpo, sem textura fotográfica.** Cores chapadas com degradê suave. Nada de ruído granulado, nada de render 3D.
2. **Luz vem da esquerda e de cima.** Faces e superfícies voltadas para a esquerda/topo são mais claras; a direita/baixo, mais escuras.
3. **Degradê de baixo para cima.** Folhas e plantas são escuras na base e claras na ponta. Objetos de madeira vão do tom médio ao escuro, de cima para baixo.
4. **Terreno não tem contorno; objetos têm.** Grama e terra são "chão". Tudo que fica em pé (cerca, fardo, árvore, planta) leva contorno marrom bem escuro e fino.
5. **Todo objeto tem sombra no chão:** uma elipse suave, deslocada para a direita.
6. **Formas arredondadas.** Cantos e pontas levemente arredondados (`lineJoin: round`), nada de cantos vivos.
7. **Detalhe pequeno ajuda:** um brilho (traço claro e fino no lado da luz), pregos, nervuras de folha, cordas. Pouco, e sempre discreto.

## Projeção

Isométrica 2:1. Cada tile é um losango de 96 × 48 unidades do mundo. A célula (linha `r`, coluna `c`)
fica em `x = ORIGEM_X + (c - r) * 48` e `y = ORIGEM_Y + (c + r) * 24`.
Os itens são desenhados do fundo para a frente, ordenados por `r + c`.

## Paleta (objetos)

| Material | Claro | Médio | Escuro |
|---|---|---|---|
| Contorno | `#3b2412` | | |
| Madeira | `#d6a064` | `#b4753f` | `#7e4a27` |
| Feno | `#f7da7c` | `#e3b34a` | `#b8872a` (corda `#8f5a2a`) |
| Juta (saco) | `#ead0a0` | `#cfa96c` | `#a37b43` |
| Pedra | `#d4cfc3` | `#aaa498` | `#7c776d` |
| Folhas | `#92df62` | `#51ae4a` | `#2a7a3a` |

Terreno: grama de `#1f6a34` (fundo) a `#96de5c` (pontas); terra de `#64401f` (vale do sulco) a `#c58a54` (topo do sulco).

## Receitas por elemento

| Elemento | Onde | Como é feito |
|---|---|---|
| Grama | `render/grass.ts` | Textura procedural: fundo escuro + ~560 tufos de folhas com degradê, de trás para frente. Repetida sem emenda. |
| Terra arada | `render/soil.ts` | Sulcos com degradê que emendam entre tiles, torrões, pedrinhas. Bordas com contorno suave e tufos de grama. |
| Cerca, fardo, plataforma, saco, arbusto, pedra, árvore | `render/props.ts` | Desenhados em canvas com `isoBox` (caixa isométrica) ou formas livres. Contorno + degradê + sombra. |
| Celeiro, máquinas, animais, balões | `render/buildings.ts` | Mesmas regras dos objetos: `isoBox`, `gableRoof` (telhado de duas águas) e `cylinder` com contorno, degradê e sombra; desenhados num tamanho só e ampliados (`MACHINE_SCALE`, `BARN_SCALE`) para cada prédio ter o tamanho dele no mapa; paleta dos prédios em `style.ts` (`BARN_RED`, `TRIM`, `ROOF`, `METAL`, `COPPER`, `BRICK`, `CLAY`, `FIRE`). |
| Ícones dos itens, máquinas e animais | `components/itemIcons.tsx` | SVG 32x32 no estilo dos outros ícones; produtos usam um modelo (pote, garrafa, saco, prato...) pintado com a cor do produto. |
| Plantas (milho, tomate, abóbora) | `render/cropSvgs.ts` | SVG com 3 estágios: broto, crescendo, madura. Sombra, nervuras, brilho. |
| Interface | `index.css`, `public/assets/ui` | Molduras 9-patch do UI Pack Adventure (Kenney, CC0) + ícones SVG próprios em `ui/Icons.tsx`. Fonte Fredoka. |

## Como criar um objeto novo

1. Desenhe a sombra (`shadow`) primeiro.
2. Preencha com degradê usando os tons do material (claro no topo/esquerda).
3. Aplique o contorno (`outline`) em cada forma.
4. Acrescente 1 ou 2 detalhes pequenos (brilho, prego, nervura).
5. Teste ao lado da grama, da terra e de um objeto existente. Se ele "salta aos olhos", falta contorno, sombra ou degradê.

## O que ainda falta padronizar

- As cores da grama, da terra e das plantas estão escritas direto nos arquivos, não em `style.ts`.
- As cores da interface (CSS) não usam variáveis; estão repetidas em `index.css`.
- Não há ainda regras de animação (vento na grama, balanço das plantas) nem de iluminação do ciclo dia/noite.
