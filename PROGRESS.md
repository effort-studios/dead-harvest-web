# PROGRESS – dead-harvest-web

## Status do MVP
- [x] 2. Projeto Vite conectado à API (criar convidado, carregar e salvar) — confirmado pelo usuário
- [x] 3. Grade 10x10; clicar num tile alterna arar/plantar/colher (confirmado pelo print do usuário: dinheiro e sementes mudaram)
- [ ] 4. 2 ou 3 tipos de planta (crescimento e preços) — código pronto, falta confirmar no navegador
- [ ] 5. Dinheiro e loja de sementes — código pronto (Loja no menu lateral), falta confirmar no navegador
- [x] 6. Ciclo dia/noite (filtro de cor no mapa: amanhecer, dia, entardecer, noite) — falta confirmação do usuário
- [ ] 7. Zumbis nas bordas pisoteiam plantações; clicar afasta
- [x] 8. Estado no servidor: cada clique/compra/venda vira uma ação na API; o front não salva nada

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
| 2026-10-21 | Plantas do mapa: 3 estágios (broto, crescendo, madura). Milho = sprites do pacote (cornYoung, cornYoungDouble, corn); tomate e abóbora = SVG próprio (src/render/cropSvgs.ts) com gradientes, sombra e folhas | as elipses do canvas pareciam "feitas no Paint". Os SVGs foram renderizados e conferidos numa folha antes de integrar |
| 2026-10-20 | Ação em massa: Shift+clique = linha, Ctrl+clique = coluna (`clickLine` em state.ts) | no isométrico a "linha" pode ir para dois lados na tela; só age nos tiles no mesmo estado do clicado e para quando as sementes acabam |
| 2026-10-20 | Menu lateral discreto (Loja, Dicas, Conta, Sobre), painel sem fundo bloqueando o mapa | junta a loja e as dicas num lugar só; dá para comprar e plantar com o menu aberto. Sem seções vazias (Configurações e Missões só quando existirem) |
| 2026-10-20 | "Novo jogo" cria jogador convidado novo e mantém o antigo no banco | mais seguro que apagar; sem rota de DELETE na API |
| 2026-10-21 | HUD refeita com o UI Pack – Adventure (Kenney, CC0): molduras 9-patch via CSS border-image, círculos para retrato/menu, botões creme e vermelho; fonte Fredoka (Google Fonts) | usuário achou a HUD de CSS puro genérica ("cara de IA"). Fonte vem da internet: sem rede cai em system-ui |
| 2026-10-21 | Ícones desenhados em SVG por nós (src/ui/Icons.tsx): moeda, sol, lua, loja, dicas, fazendeiro, info, salvar, fechar, milho, tomate, abóbora. Kenney Game Icons e emojis removidos | usuário não gostou dos glifos do Kenney nem dos emojis; um conjunto único no estilo do UI Pack (contorno marrom grosso, cores chapadas) |
| 2026-10-21 | Grama com textura procedural (src/render/grass.ts): fundo escuro + ~560 tufos de folhas com degradê (base escura, ponta clara), pintados de trás para frente, em padrão repetível sem emenda | a 1ª versão (base lisa com riscos finos) ficou "chapada"; a 2ª segue a técnica de uma referência do usuário (tufos sobrepostos), sem copiar a imagem. Gerada por código com semente fixa; conferida renderizada fora do navegador |
| 2026-10-21 | Terra arada desenhada por código (src/render/soil.ts): sulcos com degradê que emendam entre tiles, torrões, pedrinhas, contorno suave e tufos de grama nas bordas expostas. Sprite 3D de terra do pacote removido | o sprite do Kenney (textura fotográfica/granulada) destoava da grama cartoon. Terra é desenhada numa 1ª passada (chão), antes das plantas e cercas |
| 2026-10-21 | Design system do mundo (DESIGN.md + render/style.ts) e objetos redesenhados no mesmo estilo: cerca, fardos, plataforma, saco, arbusto, pedra, árvore (render/props.ts) e milho em SVG (3 estágios). Pacote Isometric Miniature Farm (Kenney) removido do projeto | cerca e objetos 3D do Kenney destoavam da grama/terra cartoon. Agora só o UI Pack do Kenney permanece (molduras da interface). Conferido numa cena de teste fora do navegador |
| 2026-10-22 | Plantas com tempos longos (tomate 1min30s ... melancia 12min) e 7 tipos (novos: cenoura, batata, morango, melancia) | evitar o "vício" de plantar e colher sem parar; sprites SVG nos 3 estágios e ícones próprios |
| 2026-10-22 | Árvores frutíferas (game/trees.ts): clicar colhe 3 frutas (vão para o inventário), repõe após 1h REAL. O save guarda `trees` (id -> ms da última coleta, Date.now) | funciona também com o jogo fechado; frutas vendidas na aba "Vender frutas" da loja |
| 2026-10-22 | Dia de 5 min, 4 fases de 75s: amanhecer, manhã, tarde, noite (game/daycycle.ts), `time` no save (coluna nova na API). Overlay `.sky-tint` (multiply) só sobre o mapa, cor interpolada por keyframes; HUD mostra a fase | pedido: noite escura, entardecer e amanhecer graduais. Dia sobe quando o tempo passa de 300 |
| 2026-10-22 | Select de sementes próprio (SeedSelect), lista no fluxo da página, sem rolagem interna | a versão flutuante era cortada pelo painel e tinha 2 barras de rolagem |
| 2026-10-20 | Relógio do jogo: setInterval de 1s no App que chama `tick` (função pura) | 1 tick por segundo, como combinado; cresce até maduro e para |
| 2026-10-22 | Compra de terreno: item "Terreno" na Loja liga o modo de compra (`buyingPlot` no store), o mapa destaca as posições livres ao lado dos terrenos que o jogador já tem e ele escolhe onde comprar | jogador escolhe a posição; Esc ou "Cancelar" sai do modo. Funções puras `freeSlots` e `buyPlot` em state.ts |
| 2026-10-22 | Preço do terreno: 1000 no primeiro, +50% a cada compra, arredondado (`plotPrice`) | escalonado para o dinheiro continuar importando. Calculado só no front; a API não valida |
| 2026-10-22 | Terrenos 10x10 colados (`PLOT_STEP` = `GRID_SIZE`); cerca só no lado sem terreno vizinho; terra arada emenda entre terrenos | a cerca estende o terreno em vez de separar. Cenário (árvore, fardo, pedra) que cairia em cima de um terreno novo some |
| 2026-10-22 | Save usa `plots: [{ x, y, grid }]` no lugar de `grid`; (x, y) é a posição do terreno na malha e pode ser negativo | formato definido na API (PR de mesmo nome). Câmera, hit-test e textura da terra aceitam coordenadas globais negativas |

## Problemas conhecidos
- Sem sementes não dá para plantar até a loja (item 5); jogadores antigos só têm milho (o save inicial novo traz as 3 sementes: limpe `deadHarvestPlayerId` do localStorage para criar jogador novo).
- Se a aba ficar em segundo plano o navegador desacelera o setInterval e as plantas crescem mais devagar.
- Fluxo no navegador ainda não testado (só o CORS foi verificado por curl).
- Ação recusada pelo servidor mostra o motivo no HUD por 4s e a tela volta para o estado do servidor; sem conexão, o sync de 30s acerta depois.

## Próximos passos
1. Confirmar os itens 4 e 5 no navegador
2. Ciclo dia/noite (item 6)
3. Zumbis (item 7)

## Histórico
- 2026-10-22 – Servidor como fonte da verdade: a store manda cada ação para a API (`/game/till`, `plant`, `harvest`, `seeds/buy`, `fruits/sell`, `plots/buy`, `trees/:id/harvest`), mostra uma previsão na hora e troca pelo estado que volta; pedidos em fila, um por vez. Preços, tempos e árvores vêm de `GET /game/catalog` (`setCrops`, `setTrees`, `setPlotPrice`). Removidos o salvamento automático, `putSave` e `migrateSave`. Relógio acertado pelo `serverTime`; sync a cada 30s e ao voltar para a aba. Chapéu de flor e camisa amarela removidos do avatar.
- 2026-10-22 – Compra de terreno: `plots` no `SaveData`, Loja > Terreno com escolha da posição no mapa, preço +50% por compra, terrenos colados com cerca só no perímetro. Corrigido índice negativo da textura de terra em terrenos comprados para cima/esquerda. Depende da API (migration `plots`).
- 2026-10-22 – Avatar com camadas desenhadas (art/avatar-source → scripts/build_avatar_layers.py → public/assets/avatar): alinha as peças pela cabeça e pelas orelhas, extrai a barba por diferença, gera máscaras de pele/íris. O front (render/avatarLayers.ts) empilha as camadas e recolore pele, cabelo e olhos por paleta mantendo a luminosidade. Novas peças: olhos, estilo e cor do cabelo. Falta desenho da flor (não aparece) e a camiseta listrada é provisória (verde recolorida).
- 2026-10-22 – (substituído) Retrato do avatar em pixel art gerada por código (render/pixelAvatar.ts): grade 40x40, máscaras com 4 tons em faixas + contorno de 1px, olhos/boca/sobrancelhas pixel a pixel; exibido em múltiplos inteiros (80px no HUD, 160px no editor). O mapa continua vetorial.
- 2026-10-22 – Avatar editável (game/avatar.ts, ui/Avatar.tsx em SVG: pele, rosto, chapéu, barba, roupa) e menu no painel do jogador (ui/ProfileMenu.tsx: editar perfil, sair; ui/ProfileEditor.tsx). A seção "Conta" do menu lateral saiu. Peças e ids iguais aos da API.
- 2026-10-22 – Login obrigatório (sem convidados): tela de login/cadastro/recuperação de senha (ui/AuthScreen.tsx), sessão por cookie httpOnly (credentials: include), painel Conta com Sair; store com `user` no lugar de `playerId`. A API usa o mesmo host da página (porta 3333).
- 2026-10-22 – Barra de itens só mostra o que o jogador tem (`ownedSeeds`); teclas 1-9 seguem a posição na barra; se a semente acaba, seleciona outra (`pickSeed`). Slots livres ficam para as ferramentas.
- 2026-10-22 – Zoom com a roda do mouse (0.5x a 3x, em direção ao cursor; listener não-passivo no canvas).
- 2026-10-22 – Relógio do dia refeito (ui/DayClock.tsx): cúpula de céu com sol/lua num arco + placas com dia, fase e hora (clockTime em daycycle.ts).
- 2026-10-22 – Loja com select, compra x1/x5/x10 e aba de venda; 4 plantas novas; tempos maiores; frutas nas árvores; ciclo dia/noite.
- 2026-10-21 – Design system (DESIGN.md, style.ts); props desenhados por código (isoBox, cerca, árvore...), milho em SVG, 22 objetos de cenário em volta da plantação; removido o pacote Isometric Miniature Farm (sprites.ts agora só carrega as plantas).
- 2026-10-21 – Terra arada nova (procedural, combina com a grama), bordas com tufos; desenho em 2 passadas (chão, depois objetos). Conferida numa cena de teste fora do navegador.
- 2026-10-21 – Grama refeita com tufos de folhas sobrepostos e degradê (referência do usuário), no lugar da textura chapada.
- 2026-10-21 – Nova textura de grama (padrão repetido no mundo todo, acompanha o pan); removido o desenho por losangos.
- 2026-10-21 – Plantas redesenhadas: sprites SVG de tomate e abóbora em 3 estágios, milho com estágio intermediário; removido o desenho por elipses do canvas (drawCropShape).
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
