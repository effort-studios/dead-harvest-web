# PROGRESS – dead-harvest-web

## Status do MVP
- [x] 2. Projeto Vite conectado à API (criar convidado, carregar e salvar) — confirmado pelo usuário
- [x] 3. Grade 10x10; clicar num tile alterna arar/plantar/colher (confirmado pelo print do usuário: dinheiro e sementes mudaram)
- [ ] 4. 2 ou 3 tipos de planta (crescimento e preços) — código pronto, falta confirmar no navegador
- [ ] 5. Dinheiro e loja de sementes — código pronto (Loja no menu lateral), falta confirmar no navegador
- [ ] 6. Ciclo dia/noite (tela escurece)
- [ ] 7. Zumbis nas bordas pisoteiam plantações; clicar afasta
- [ ] 8. Salvamento automático

## Em andamento
Item 5. Falta o usuário testar: abrir o menu lateral (🛒), comprar sementes (botão desabilitado sem dinheiro), plantar com elas; testar Dicas, Conta (Novo jogo com confirmação) e Sobre.

## Decisões
| Data | Decisão | Motivo |
|---|---|---|
| 2026-10-20 | Node 22 para o front | npm 10.8 (Node 20) deu erro `edgesOut` ao instalar o template; Node 22 funcionou |
| 2026-10-20 | Estado do jogo (`SaveData`) dentro do store Zustand | um só lugar para a UI, o canvas e o save lerem |
| 2026-10-20 | Guard `started` no App | StrictMode roda o effect 2x em dev e criaria 2 jogadores |
| 2026-10-20 | Prévia visual do usuário usada só como referência de layout do HUD | MVP continua visão de cima, formas simples, sem sprites/personagem; vida, energia, missões, minimapa e isométrico ficam para depois do MVP |
| 2026-10-20 | Visual isométrico com o pacote Isometric Miniature Farm (Kenney, CC0) em public/assets/iso-farm; Tiny Town removido | usuário quer a cara da prévia isométrica. O pacote tem milho (jovem/maduro), terra, cerca, feno, sacos; NÃO tem grama (desenhada com losangos), árvores, casa pronta, personagem nem zumbis |
| 2026-10-20 | Canvas com o tamanho da janela + câmera (pan por arrasto) + zoom automático; HUD em HTML por cima | requisito: sem barras de rolagem, 100% da janela, HUD fixa. Câmera num ref para o arrasto não re-renderizar o React; clique vs arrasto separados por limiar de 5px |
| 2026-10-20 | HUD só com o que existe no jogo (jogador, dinheiro, dia, barra de 9 slots, salvar) | vida, energia, missões e minimapa não têm dados no jogo ainda; não inventei valores falsos |
| 2026-10-20 | Plantas em src/game/crops.ts: tomate (10 ticks, semente 3, venda 6), milho (20, 5, 12), abóbora (40, 10, 30) | tempos curtos para testar; quanto mais demora, mais lucra. Colher só com a planta madura; plantar gasta 1 semente da selecionada |
| 2026-10-20 | Milho usa sprites do pacote; tomate e abóbora são desenhados com formas no canvas | o pacote isométrico só tem milho |
| 2026-10-20 | Ação em massa: Shift+clique = linha, Ctrl+clique = coluna (`clickLine` em state.ts) | no isométrico a "linha" pode ir para dois lados na tela; só age nos tiles no mesmo estado do clicado e para quando as sementes acabam |
| 2026-10-20 | Menu lateral discreto (Loja, Dicas, Conta, Sobre), painel sem fundo bloqueando o mapa | junta a loja e as dicas num lugar só; dá para comprar e plantar com o menu aberto. Sem seções vazias (Configurações e Missões só quando existirem) |
| 2026-10-20 | "Novo jogo" cria jogador convidado novo e mantém o antigo no banco | mais seguro que apagar; sem rota de DELETE na API |
| 2026-10-21 | HUD refeita com o UI Pack – Adventure (Kenney, CC0): molduras 9-patch via CSS border-image, círculos para retrato/menu, botões creme e vermelho; fonte Fredoka (Google Fonts) | usuário achou a HUD de CSS puro genérica ("cara de IA"). Fonte vem da internet: sem rede cai em system-ui |
| 2026-10-21 | Ícones desenhados em SVG por nós (src/ui/Icons.tsx): moeda, sol, lua, loja, dicas, fazendeiro, info, salvar, fechar, milho, tomate, abóbora. Kenney Game Icons e emojis removidos | usuário não gostou dos glifos do Kenney nem dos emojis; um conjunto único no estilo do UI Pack (contorno marrom grosso, cores chapadas) |
| 2026-10-20 | Relógio do jogo: setInterval de 1s no App que chama `tick` (função pura) | 1 tick por segundo, como combinado; cresce até maduro e para |

## Problemas conhecidos
- Sem sementes não dá para plantar até a loja (item 5); jogadores antigos só têm milho (o save inicial novo traz as 3 sementes: limpe `deadHarvestPlayerId` do localStorage para criar jogador novo).
- Se a aba ficar em segundo plano o navegador desacelera o setInterval e as plantas crescem mais devagar.
- Fluxo no navegador ainda não testado (só o CORS foi verificado por curl).
- Falha ao salvar só mostra a mensagem de erro no HUD; sem nova tentativa.

## Próximos passos
1. Confirmar os itens 4 e 5 no navegador
2. Ciclo dia/noite (item 6)
3. Zumbis (item 7)

## Histórico
- 2026-10-21 – HUD: painel do jogador e menu lateral numa coluna só (flex, com espaço), painel aberto ao lado do 1º botão; breakpoints 900px (largura) e 640px (altura) para não sobrepor Salvar/barra de itens.
- 2026-10-21 – Enquadramento dos ícones: centralizados como bloco nas molduras (menu 54px, slots a 90%, retrato e fechar).
- 2026-10-21 – Conjunto próprio de 12 ícones SVG no lugar de emojis/Game Icons; ícones das plantas nos slots e na loja agora são SVG (CropIcon do canvas removido); retrato maior com o fazendeiro.
- 2026-10-21 – Emojis trocados por ícones: Icon (máscara), CoinIcon/SunIcon (SVG), CropIcon (canvas) nos slots e na loja. Removido o sprite do saco.
- 2026-10-21 – HUD e menu com molduras do UI Pack Adventure e fonte Fredoka; faixa do menu lateral sem moldura.
- 2026-10-20 – Item 5 + menu lateral: buySeed (função pura), Loja/Dicas/Conta/Sobre, Novo jogo, dica de Shift/Ctrl saiu da HUD para o menu Dicas.
- 2026-10-20 – Ação em massa por linha (Shift) e coluna (Ctrl), com destaque da linha inteira no hover e dica na HUD.
- 2026-10-20 – Terra arada recortada no losango do topo (clip) para ficar na mesma altura da grama.
- 2026-10-20 – Quantidade da semente movida para o canto superior direito do slot (colidia com o nome).
- 2026-10-20 – Item 4: 3 plantas (crops.ts), crescimento por tick, colheita só quando madura, seleção de semente na barra de itens (teclas 1-3), migração de `wheat` para `corn` ao carregar.
- 2026-10-20 – Terra sem arar volta a ser grama (antes ficava igual à arada) e contorno branco no tile sob o mouse.
- 2026-10-20 – Migração para isométrico (sprites Kenney Isometric Miniature Farm, projeção 2:1, clique com conta inversa), HUD nova com molduras de madeira e 9 slots, pan por arrasto sem barras de rolagem, layout responsivo.
- 2026-10-20 – Mundo widescreen 28x16 e canvas em largura total da janela (floresta nas laterais).
- 2026-10-20 – Visual com sprites Kenney Tiny Town: cenário (grama, casa, cerca, árvores), terra e brotinho, HUD com moldura de madeira, moeda e slots. Mundo 14x16 tiles com a plantação 10x10 dentro.
- 2026-10-20 – Item 3: lógica pura `clickTile` (game/state.ts), desenho da grade no canvas (render/draw.ts), GameCanvas, HUD reorganizado (dinheiro, dia, barra de itens). Removido botão de teste.
- 2026-10-20 – Criado o projeto Vite + React + TS + Zustand; api client, store (init/save), HUD mínimo. CORS verificado por curl.
