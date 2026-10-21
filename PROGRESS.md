# PROGRESS – dead-harvest-web

## Status do MVP
- [ ] 2. Projeto Vite conectado à API (criar convidado, carregar e salvar) — código pronto, falta confirmar no navegador
- [ ] 3. Grade 10x10; clicar num tile alterna arar/plantar/colher
- [ ] 4. 2 ou 3 tipos de planta (crescimento e preços)
- [ ] 5. Dinheiro e loja de sementes
- [ ] 6. Ciclo dia/noite (tela escurece)
- [ ] 7. Zumbis nas bordas pisoteiam plantações; clicar afasta
- [ ] 8. Salvamento automático

## Em andamento
Item 2. Falta o usuário abrir http://localhost:5173 e confirmar: carrega, "+10 (teste)", "Salvar", F5 mantém o dinheiro.

## Decisões
| Data | Decisão | Motivo |
|---|---|---|
| 2026-10-20 | Node 22 para o front | npm 10.8 (Node 20) deu erro `edgesOut` ao instalar o template; Node 22 funcionou |
| 2026-10-20 | Estado do jogo (`SaveData`) dentro do store Zustand | um só lugar para a UI, o canvas e o save lerem |
| 2026-10-20 | Guard `started` no App | StrictMode roda o effect 2x em dev e criaria 2 jogadores |
| 2026-10-20 | Botão "+10 (teste)" provisório | provar que o save persiste antes de existir jogo; sai no item 3 |

## Problemas conhecidos
- Fluxo no navegador ainda não testado (só o CORS foi verificado por curl).
- Falha ao salvar só mostra a mensagem de erro no HUD; sem nova tentativa.

## Próximos passos
1. Confirmar o item 2 no navegador
2. Grade 10x10 em canvas com clique arar/plantar/colher (item 3)
3. Tipos de planta com crescimento por tick (item 4)

## Histórico
- 2026-10-20 – Criado o projeto Vite + React + TS + Zustand; api client, store (init/save), HUD mínimo. CORS verificado por curl.
