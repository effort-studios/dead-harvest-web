# PROGRESS – dead-harvest-web

## Status do MVP
- [x] 2. Projeto Vite conectado à API (criar convidado, carregar e salvar) — confirmado pelo usuário
- [ ] 3. Grade 10x10; clicar num tile alterna arar/plantar/colher — código pronto, falta confirmar no navegador
- [ ] 4. 2 ou 3 tipos de planta (crescimento e preços)
- [ ] 5. Dinheiro e loja de sementes
- [ ] 6. Ciclo dia/noite (tela escurece)
- [ ] 7. Zumbis nas bordas pisoteiam plantações; clicar afasta
- [ ] 8. Salvamento automático

## Em andamento
Item 3. Falta o usuário testar: clicar na grama ara, na terra arada planta (gasta 1 semente), na planta colhe (+10 provisório).

## Decisões
| Data | Decisão | Motivo |
|---|---|---|
| 2026-10-20 | Node 22 para o front | npm 10.8 (Node 20) deu erro `edgesOut` ao instalar o template; Node 22 funcionou |
| 2026-10-20 | Estado do jogo (`SaveData`) dentro do store Zustand | um só lugar para a UI, o canvas e o save lerem |
| 2026-10-20 | Guard `started` no App | StrictMode roda o effect 2x em dev e criaria 2 jogadores |
| 2026-10-20 | Prévia visual do usuário usada só como referência de layout do HUD | MVP continua visão de cima, formas simples, sem sprites/personagem; vida, energia, missões, minimapa e isométrico ficam para depois do MVP |
| 2026-10-20 | Sprites do pacote Tiny Town (Kenney, CC0) em public/assets/tiny-town | usuário achou o visual de formas simples longe da prévia; pacote top-down 16x16 ampliado 3x. Não tem plantas maduras nem zumbis: esses serão desenhados com formas ou outro pacote |
| 2026-10-20 | Colheita dá +10 fixo; plantar gasta 1 semente | provisório até o item 4 (preços por planta) e item 5 (loja); sem sementes não dá para plantar |

## Problemas conhecidos
- Sem sementes (acabam após 3 plantios) não dá para plantar até a loja (item 5).
- Fluxo no navegador ainda não testado (só o CORS foi verificado por curl).
- Falha ao salvar só mostra a mensagem de erro no HUD; sem nova tentativa.

## Próximos passos
1. Confirmar o item 3 no navegador
2. Tipos de planta com crescimento por tick e preços (item 4)
3. Loja de sementes (item 5)

## Histórico
- 2026-10-20 – Visual com sprites Kenney Tiny Town: cenário (grama, casa, cerca, árvores), terra e brotinho, HUD com moldura de madeira, moeda e slots. Mundo 14x16 tiles com a plantação 10x10 dentro.
- 2026-10-20 – Item 3: lógica pura `clickTile` (game/state.ts), desenho da grade no canvas (render/draw.ts), GameCanvas, HUD reorganizado (dinheiro, dia, barra de itens). Removido botão de teste.
- 2026-10-20 – Criado o projeto Vite + React + TS + Zustand; api client, store (init/save), HUD mínimo. CORS verificado por curl.
