# Plano: organização do front por features

Status: **concluído** na branch `refactor/features` (as seis fases, incluindo a divisão do store).

Branch: `refactor/features` (a `main` não é tocada).

Regra de ouro: **só mover e dividir arquivos; não mudar comportamento.** A única fase que mexe em lógica
(a divisão do store) é a última, é opcional e só acontece com aprovação separada.

## 1. Situação atual

Organizado por **tipo de arquivo**, ~3.700 linhas, sem testes:

```
src/
  api/client.ts        # toda chamada HTTP (conta + jogo) e a classe ApiError
  game/                # avatar, crops, trees, daycycle, state, types
  render/              # desenho do canvas + montagem das camadas do avatar
  store/gameStore.ts   # estado global (zustand): login, perfil E jogo juntos
  ui/                  # 11 componentes: login, perfil, HUD, canvas, ícones...
```

Pontos que o plano precisa respeitar:

1. **`gameStore.ts` mistura conta e jogo.** Além disso guarda estado de módulo (`queue`, `pending`,
   `clockOffset`), que coordena as ações indo ao servidor uma de cada vez. Mexer nele é onde mora o risco.
2. **`game/crops.ts`, `trees.ts`, `daycycle.ts` e `state.ts` têm estado global mutável**, alimentado pelo
   catálogo da API (`setCrops`, `setTrees`, `setDayLength`, `setPlotPrice`). Mover os arquivos é seguro desde que
   exista uma única instância de cada módulo; **não vou mudar esse desenho.**
3. **`Icons.tsx` (347 linhas) mistura ícones genéricos e de domínio** (`CropIcon` importa o tipo `CropId`).
4. **Referências a caminhos fora do código:** `index.html` (`/src/main.tsx`), `README.md`, `DESIGN.md`
   (`src/render/style.ts`) e `PROGRESS.md`. Os assets em `public/assets/avatar` e as pastas `art/` e `scripts/`
   não são tocados.
5. O `README.md` está desatualizado (ainda fala de `POST /players` e `localStorage`). Corrijo na fase de docs.

## 2. Estrutura final

```
src/
  app/
    App.tsx · main.tsx · index.css
  shared/
    api/http.ts                 # API_URL, request(), post(), ApiError (único lugar que usa fetch)
    ui/icons.tsx                # só os genéricos: Coin, Close, Eye, EyeOff, Farmer, Save
  features/
    profile/                    # quem é o jogador
      model/avatar.ts           # opções, rótulos e tipo Avatar
      model/user.ts             # tipo User
      render/avatarLayers.ts    # camadas do retrato
      components/Avatar.tsx · ProfileEditor.tsx · ProfileMenu.tsx
      api.ts                    # updateProfile
    auth/                       # entrar e sair
      components/AuthScreen.tsx
      api.ts                    # fetchMe, login, register, logout, forgotPassword, resetPassword
    farm/                       # o jogo
      model/                    # state, crops, trees, daycycle, types
      render/                   # draw, props, soil, grass, sprites, cropSvgs, style
      components/               # GameCanvas, Hud, SideMenu, DayClock, icons.tsx (domínio)
      api.ts                    # fetchCatalog, loadState, till, plant, harvest, buySeed...
  store/gameStore.ts            # provisório: continua único até a fase 6
```

### Para onde vai cada arquivo

| Hoje | Depois |
|---|---|
| `App.tsx`, `main.tsx`, `index.css` | `app/` |
| `api/client.ts` | dividido: `shared/api/http.ts` + `api.ts` de cada feature (e some no fim) |
| `game/avatar.ts` | `features/profile/model/avatar.ts` |
| `game/{state,crops,trees,daycycle,types}.ts` | `features/farm/model/` |
| `render/avatarLayers.ts` | `features/profile/render/` |
| `render/{draw,props,soil,grass,sprites,cropSvgs,style}.ts` | `features/farm/render/` |
| `ui/AuthScreen.tsx` | `features/auth/components/` |
| `ui/{Avatar,ProfileEditor,ProfileMenu}.tsx` | `features/profile/components/` |
| `ui/{GameCanvas,Hud,SideMenu,DayClock}.tsx` | `features/farm/components/` |
| `ui/Icons.tsx` | dividido: genéricos em `shared/ui/icons.tsx`; Sun/Moon/LateNight/Sunrise/Sunset, Shop, Bulb, Plot, Crop*, Fruit* em `features/farm/components/icons.tsx` |
| `store/gameStore.ts` | fica (provisório); dividido só na fase 6 |

### Regra de dependência

```
shared  ←  profile  ←  auth
   ↑          ↑
   └──────── farm        app → tudo
```

- `shared` não importa de nenhuma feature.
- `profile` só importa de `shared` (por isso o tipo `User` vive em `profile`).
- `auth` importa de `shared` e `profile`; `farm` importa de `shared` e `profile` (o `Hud` mostra o `ProfileMenu`).
- Cada feature importa de outra só o que é público (componentes e tipos), nunca arquivos internos.
- **Exceção provisória:** todas leem o `store/gameStore.ts`, único e compartilhado, até a fase 6. Isso é a
  "dívida" que a fase 6 paga: hoje `profile` (via `ProfileMenu`, que mostra o dinheiro) e `farm` dependem um do outro
  pelo store.

## 3. Como trabalhar (para não embolar)

1. **Uma fase por vez**, na ordem abaixo; não começo a seguinte antes de o checkpoint da atual passar.
2. Os arquivos são movidos com `git mv` (o histórico acompanha) e só então os imports são ajustados.
3. **Checkpoint de cada fase:** `npx tsc -b` limpo, `npx oxlint` sem avisos novos em relação ao baseline,
   `npm run build` ok, e um commit.
4. **Fase 0** guarda uma cópia do `src/` fora do repo e o resultado do `tsc`/`oxlint` atuais como baseline.
5. Nas fases 4 e 6, e no fim, **teste de fluxo no navegador** (lista na seção 5), porque não há testes de tela.

## 4. Fases

| Fase | Conteúdo | Risco |
|---|---|---|
| 0 | branch, baseline (`tsc`, `oxlint`, `build`) e cópia de segurança do `src/` | nenhum |
| 1 | `shared/` (`http.ts` extraído do `client.ts`, ícones genéricos) e `app/` (atualiza `index.html`) | baixo |
| 2 | `profile/` (avatar, camadas, `Avatar`, `ProfileEditor`, `ProfileMenu`, `updateProfile`, tipo `User`) | baixo |
| 3 | `auth/` (`AuthScreen`, `api.ts` de conta) | baixo |
| 4 | `farm/`: primeiro `model/` + `render/` + `api.ts` (um commit), depois `components/` e os ícones de domínio (outro commit) | médio: é onde há mais arquivos e o canvas |
| 5 | docs: README (estrutura e seção "Como funciona" corrigida), `DESIGN.md`, `PROGRESS.md`; remove o `client.ts` vazio | nenhum |
| 6 | dividir o store (feito junto, por decisão do dono do projeto) | alto: toca lógica; verificado no navegador |

### Detalhes das fases

- **Fase 1:** o `client.ts` passa a importar `request`, `post` e `ApiError` de `shared/api/http.ts`; as funções
  de cada feature saem dele nas fases seguintes, então a árvore compila a cada passo. `Icons.tsx` é dividido pelo
  critério "importa algum tipo do jogo ou é do relógio/loja? vai para `farm`".
- **Fase 4:** o caminho dos assets (`/assets/avatar/…`) e o `index.html` não mudam. Os módulos com estado global
  (`crops`, `trees`, `daycycle`, `state`) só trocam de pasta; nenhum import novo cria uma segunda instância.
- **Fase 6 (se aprovada):**
  - `features/auth/store.ts`: `status`, `user`, `init`, `login`, `register`, `logout`, `updateProfile`.
  - `features/farm/store.ts`: `data`, `selectedSeed`, `buyingPlot`, `sync`, `tick` e as ações do jogo, **com a fila
    de ações (`queue`/`pending`/`clockOffset`) intacta**.
  - `app/session.ts`: a orquestração (login → carregar catálogo e estado; logout → esperar a fila e limpar o jogo).
  - `ProfileMenu` passa a receber o dinheiro por prop, em vez de ler o store do jogo.
  - Esta fase tem sua própria lista de testes manuais e, se algo não bater, é revertida sem afetar as anteriores.

## 5. Verificação

Sem testes de tela, a verificação é o build mais um roteiro de fluxo, rodado nas fases 4 e 6 e no fim:

1. Abrir sem sessão: aparece o login; cadastrar uma conta nova entra no jogo.
2. Recarregar a página: a sessão continua e o estado volta igual.
3. Arar, plantar, colher (um tile, **Shift** na linha, **Ctrl** na coluna); a planta verde dá a mensagem de erro.
4. Comprar semente, vender fruta, colher árvore e comprar terreno.
5. Relógio do dia anda, o céu muda de cor e as plantas crescem.
6. Editar nome e avatar no perfil; o retrato atualiza.
7. Sair e entrar de novo; "esqueci minha senha" mostra o fluxo do código.
8. Console do navegador sem erros novos; `npm run build` e `npx oxlint` iguais ou melhores que o baseline.

Eu rodo o que for possível no navegador (API e front no ar); o que eu não conseguir confirmar visualmente eu aviso,
e vale você jogar uns minutos antes do merge.

## 6. Fora do escopo (decidir depois)

- **Usar o `code` que a API agora devolve** (`UNAUTHENTICATED`, `INSUFFICIENT_FUNDS`...) em vez de comparar
  `status === 401` e texto: seria `ApiError.code` em `shared/api/http.ts`. Pequeno e independente.
- **Testes com Vitest** só para a lógica pura (`daycycle`, `state`, `crops`), depois da reorganização.
- Não espelhar `controllers/services/repositories` no front: aqui o equivalente é pasta por feature
  (`components`, `model`, `render`, `api`).
- Trocar bibliotecas, mudar visual ou mexer no canvas.

## 7. Decisões pendentes

1. **Alias de import `@/`** (por exemplo `@/features/farm/model/state` no lugar de `../../../..`), configurado no
   `tsconfig` e no `vite.config.ts`? Recomendo **sim**: com pastas mais fundas, os caminhos relativos ficam
   frágeis.
2. **Fase 6** (dividir o store): fazer **depois** de verificar as fases 1 a 5 (recomendado) ou deixar de fora?
3. Posso criar a branch `refactor/features` e commitar por fase?

## 8. O que mudou em relação ao plano

- **Fase 6:** `auth` ficou **sem store** (só `api` e `AuthScreen`). O estado se dividiu em `features/farm/store.ts` (jogo, com a fila de ações intacta),
  `features/profile/store.ts` (usuário) e `app/session.ts` (status da tela, `init`, `login`, `register`, `logout` e a queda de sessão por 401).
  Motivo: o 401 vindo de uma ação do jogo e o `logout` (que espera a fila) precisam de uma camada acima das features, e é o `app` que pode importar todas.
  `farm/store.ts` expõe `setUnauthorizedHandler` e `flush`; `AuthScreen` e `ProfileMenu` recebem as ações por props.
- **Alias `@/`** adotado, como proposto.
- **Ferramenta:** um script próprio fez cada `git mv` e reescreveu os imports (só os dos arquivos afetados).
  As fases 1 a 5 geraram um bundle idêntico ao de antes (mesmo hash), o que confirma que foram só mudança de lugar.
- **Verificação no navegador** (API refatorada + banco de teste, em origem isolada para não tocar na sessão nem no banco de desenvolvimento): todos os fluxos da seção 5, exceto Ctrl+clique na coluna (mesmo caminho do Shift).
