# Plano: design system da HUD

Status: **em planejamento** (fase 0). Acompanhar o progresso na seção 6.

Objetivo: ter um conjunto pequeno de peças de interface, com regras escritas de tamanho e espaçamento, para a HUD
parar de quebrar quando um painel, botão ou ícone muda de tamanho.

Regra de ouro: **poucas peças com arte, o resto em CSS.** Não mudar comportamento do jogo, só aparência.

## 1. Situação atual

- Molduras 9-slice em `public/assets/ui` (`panel.png`, `panel_light.png`, `slot.png`, 60x60, `slice` de 9),
  geradas por `scripts/build_ui_frames.py` a partir de `art/pixellab/raw/ui`.
- Todo o CSS da HUD está em `src/app/index.css` (~940 linhas), com tokens só para cores (`--gold`, `--plate`...).
- Componentes da HUD em `src/features/farm/components` (Hud, SideMenu, MusicPlayer, DayClock, BuildingPanel) e
  em `src/features/profile`. Ícones em `src/shared/ui/icons.tsx`.

Problemas conhecidos:

1. A borda do `panel_light.png` tem 8 camadas de cor em 9px (contorno, laranja, amarelo, ferrugem, marrom, bege).
   Pesada, irregular e difícil de encaixar.
2. Não há regra de tamanho: a moldura ocupa 18px (2x) mas a borda CSS é 12px, então cada componente precisa
   lembrar do padding. O botão de música (40px) deixava 16px de miolo para um ícone de 26px.
3. Valores soltos (`border: 9px`, `12px`, `font-size: 13px`...) repetidos em várias classes.
4. Telas pequenas sobrescrevem tamanhos peça por peça (bloco "Celular" do CSS).

## 2. Direção visual

O jogo é uma fazenda de dia e uma sobrevivência contra zumbis à noite. A HUD segue **interior escuro e quente com
moldura metálica dourada fina e slots afundados**, que serve aos dois momentos do jogo.

Referências de estilo: molduras douradas ornamentadas (painéis), UI de crafting escura (componentes internos) e
barra de itens escura de bronze (barra de atalhos). Ver seção 3.

Princípios:

- **Borda fina: 8px de arte** (hoje 9px), em 1x ou 2x conforme o componente. A moldura em si é de ~3 a 4px (contorno
  escuro, dourado com luz em cima e sombra embaixo); o resto é respiro.
- **Poucas camadas, de tons vizinhos:** ~4 a 6 anéis. Uma moldura chapada é simples demais, e 8 camadas com degradê
  pesam e dificultam o encaixe.
- **Interior escuro quente** (marrom-café ou ameixa escura, não azul-marinho). Texto claro sobre escuro, então os
  tokens de texto passam a ser claros (hoje `--ink` é marrom escuro).
- **Dourado é a cor de interface; vermelho é a cor de alerta** (dano, perigo, recurso em falta).
- **Slots afundados e lisos**, com borda de 1px mais clara, para os itens coloridos se destacarem.
- **Sem enfeites de canto, coroas ou ornamentos** nas molduras: dão trabalho e atrapalham o 9-slice. O ornamento,
  se existir, é opcional e só em peças de título.
- **Escopo de arte enxuto:** só 3 molduras precisam de arte (painel, slot, botão). O resto é CSS na mesma paleta.
- **Peças feitas para variar:** `ProgressBar` e `Slot` nascem com variantes (progresso, vida, energia, dano), porque
  vida, energia e inventário fazem parte do jogo e não são "depois do MVP" no desenho do sistema.
- **Ciclo dia e noite:** a HUD pode ganhar um tom mais frio à noite, mas só depois que a base existir.

### Paleta

Dourado e escuros medidos nas referências; o escuro foi esquentado (marrom em vez de azul-marinho). O dourado é um
bege-dourado sóbrio (tokens `--frame-*`). O amarelo vivo atual (`--gold`, `#f2b234`) fica só para destaques
(selecionado, moeda).

| Papel | Token | Hex |
|---|---|---|
| Contorno | `--frame-outline` | `#2a1a0e` |
| Dourado, luz | `--frame-gold-light` | `#fbd594` |
| Dourado, base | `--frame-gold` | `#c89e61` |
| Dourado, sombra | `--frame-gold-dark` | `#6c4620` |
| Interior do painel | `--panel-bg` | `#2b2118` |
| Slot afundado | `--slot-bg` | `#1d160f` |
| Borda do slot (luz de 1px) | `--slot-edge` | `#4a3a28` |
| Texto principal | `--text` | `#f3e6c8` |
| Texto secundário | `--text-muted` | `#b8a888` |
| Alerta | `--danger` | `#d9482b` |

### Moldura (8px de arte)

Cinco anéis visíveis, da borda para dentro. A luz fica só em cima e à esquerda; a sombra, só embaixo e à direita.
Cantos chanfrados de 1 a 2px, sem enfeites.

| Anel | Largura | Cor |
|---|---|---|
| 1. Contorno | 1px | `--frame-outline` |
| 2. Luz | 1px | `--frame-gold-light` |
| 3. Base | 2px | `--frame-gold` |
| 4. Sombra | 1px | `--frame-gold-dark` |
| 5. Contorno interno | 1px | `--frame-outline` |
| Respiro até o interior | 2px | `--panel-bg` |

### Prompt do grupo 1 (painéis, PixelLab)

Ferramenta: `create_ui_asset`, `elements: ["panel", "window"]`, 3 imagens de referência como `style_image_base64`,
`palette` com os hex da tabela acima, `no_background: true`.

```
Pixel art game UI panel frame, thin metallic gold border with a dark warm brown interior.
Border built from 5 flat rings, outside to inside: 1px dark outline, 1px light gold highlight
(only on the top and left edges), 2px gold base, 1px dark brown shadow (only on the bottom and
right edges), 1px inner dark outline. Solid flat interior, no gradient, no texture, no noise.
Slightly chamfered corners (1-2px), perfectly symmetrical, no ornaments, no corner flourishes,
no crown, no filigree. Clean hard pixels, limited palette, readable at small sizes, built to be
used as a 9-slice frame. Mood: worn metal and old wood, survival farm game.
```

Variantes a pedir no mesmo estilo: painel normal e painel inativo (mesma estrutura, dourado trocado por bronze
`#9e8976`). Se a primeira geração vier ornamentada ou com degradê, repetir com "plain, no decoration" no início.

## 3. Referências

**Escolhidas** (as imagens não entram no repositório; vão direto para a PixelLab como referência de estilo):
- Molduras douradas ornamentadas: moldura dos painéis (borda fina dourada com luz e sombra, interior escuro).
- UI de crafting escura: aba, campo de busca, rolagem, passo de quantidade, linha de ingrediente, slot afundado.
- Barra de itens escura de bronze: barra de atalhos com slots repetidos e quase sem moldura própria.

**Complementares** (kits de terceiros, só para consulta de estrutura; a arte do jogo é gerada, não copiada).
Nenhuma página informa a espessura da borda em pixels: medir no preview. Se algum arquivo for usado, conferir a
licença.

Clima madeira, fazenda e aconchegante:
- [Ui Background 9-Slices Vol. 1](https://ome6a1717.itch.io/ui-background-nine-slices): molduras de madeira
  em 9-slice, 2 cores alternativas, uso comercial permitido.
- [Alya Pixel Frames](https://kasayaa.itch.io/alya-frames): madeira aconchegante, uso pessoal e comercial.
- [Pixel UI Kit](https://gegx.itch.io/pixel-ui-kit): madeira, pedra e pergaminho, painéis em 9-slice. A página
  avisa que teve ajuda de IA.
- [Farm game UI](https://nyknck.itch.io/farm-game-ui): estilo Stardew, poucas avaliações.

Bordas simples, boas para recolorir para dourado:
- [Simple Pixel Borders](https://naughtymolegames.itch.io/pixel-ui-borders): grátis, PNGs 9-slice e tingíveis.
- [UI borders Art Deco](https://piposchpatz.itch.io/ui-borders-art-deco-pixel-art): CC BY 4.0 (exige atribuição).

Só como referência de estrutura (cores fora da paleta):
- [Fantasy RPG UI Pixel Pack](https://veyroa.itch.io/fantasy-minimal-pixel-art-gui) (CC0),
  [Free UI Nature Pack](https://qiuro.itch.io/free-uinature-pack),
  [Free Basic Pixel UI for RPG](https://free-game-assets.itch.io/free-basic-pixel-art-ui-for-rpg).

Ferramenta de CSS: [Pixel Art 9-Slicer 4-CSS](https://alanrobinsondev.itch.io/9slice-pixel-art-4css) gera o
`border-image` de arte pixelada em 1x, 2x e 3x.

Buscas úteis: `pixel art game UI pack`, `cozy farming game pixel art UI pack`,
`pixel art GUI kit wooden gold frame 9-slice`.

## 4. Inventário (o que existe hoje)

Fonte única para o mapeamento. Cada item vira uma linha em `src/shared/ui/README.md` na fase 1.

**Molduras:** painel dourado, painel creme, slot, botão pequeno (1x).

**Botões:** texto, texto pequeno, perigo, ícone da lateral, música, fechar, mostrar/ocultar senha, menu do
chão, compra (x1, x5, x10), play/pause, próxima, anterior, silenciar.

**Campos e controles:** input de texto, select, item do select, slider de volume, aba, opção selecionável do
editor de avatar.

**Informação:** placa de nome, dinheiro, dia, fase do dia e hora; card pontilhado; chip e chip em falta; barra
de progresso; tooltip da planta; aviso do topo do mapa; mensagem de erro e de aviso; barra de rolagem.

**Tipografia:** título de janela, subtítulo, texto de corpo, legenda, número em destaque, texto de erro.

**Ícones:** moeda, fechar, música, música desligada, play, pause, próxima, anterior, volume, link externo,
seta do select, retrato do avatar.

**Estados** (botões, slots, abas e opções): normal, hover, pressionado, selecionado, desabilitado.

**Futuros:** barra de vida, barra de energia, missões, minimapa, toast, janela de confirmação, inventário
completo.

### O que precisa de arte e o que fica em CSS

| Com arte nova (3 peças) | Só CSS na mesma paleta |
|---|---|
| Painel (interior escuro quente, moldura dourada; variante clara só para pequenos destaques) | Placas de texto, input, select, aba, chip, card |
| Slot | Barra de progresso, tooltip, avisos, slider, rolagem |
| Botão (inclui a variante de perigo, só com outra cor) | Tipografia e estados |

Ícones já têm arte própria e só serão gerados se faltar algum.

## 5. Estrutura do repositório

Decisão: **sem Clean Arch nem DDD completos** (pesados demais para uma HUD). Mantém-se a organização por features
que o repo já tem, e o design system vira uma camada `shared/ui`. Regra de dependência:

```
app  →  features  →  shared
```

Componentes reutilizáveis (`Button`, `Panel`, `Slot`...) **não ficam dentro de nenhuma feature**: moram em
`shared/ui` e as features importam deles (`import { Button, Panel } from '@/shared/ui'`). `shared/ui` nunca
importa de `features` nem de `app`. Ícones de domínio (como `CropIcon`, que conhece `CropId`) continuam em
`features/farm`; os genéricos (moeda, fechar, play...) ficam em `shared/ui/icons`.

```
src/
  app/
    index.css            # só o global: reset, body, canvas, #root
  shared/
    ui/
      tokens.css         # cores, espaçamento, fontes, ícones, borda (8px), z-index
      Panel/             # um componente por pasta
        Panel.tsx
        Panel.module.css
      Button/            # IconButton como variante
      Slot/  Plate/  Field/  Tabs/  Chip/  ProgressBar/  Tooltip/
      icons/             # o icons.tsx atual, só os genéricos
      index.ts           # exporta tudo
      README.md          # regra de tamanho mínimo por moldura
  features/
    ui-kit/              # página /ui-kit: é tela do app, usa só shared/ui
      UiKitPage.tsx
    farm/  auth/  profile/   # a HUD usa os componentes de shared/ui
public/assets/ui/        # PNGs das molduras
```

Escolhas:
- **CSS Modules (`*.module.css`) ao lado de cada componente.** Escopo local, sem colisão com as classes globais
  durante a migração, e o CSS acompanha o componente. O Vite já suporta, sem dependência nova.
- **Tokens em `shared/ui/tokens.css`**, importado uma vez em `app/main.tsx`. Os módulos só usam `var(--...)`.
- **Variações por prop** (`variant`, `size`) com tipos, no lugar de classes soltas.
- **Regra de lint** no `.oxlintrc.json` (`no-restricted-imports` para `src/shared/**`) proibindo importar de
  `@/features/*` e `@/app/*`, para a dependência não depender de memória.

## 6. Fases

Cada fase termina com o jogo rodando e visualmente igual ou melhor. Ao marcar a última tarefa de uma fase, parar e
revisar o resultado antes de seguir. Marcar `[x]` só depois de feito e verificado.

### Progresso

| Fase | Tema | Status |
|---|---|---|
| 0 | Decidir o visual | em andamento |
| 1 | Tokens e regras | pendente |
| 2 | Arte das molduras | pendente |
| 3 | Componentes base | pendente |
| 4 | Página `/ui-kit` | pendente |
| 5 | Migrar a HUD | pendente |
| 6 | Peças novas | pendente |

Status: `pendente`, `em andamento`, `concluída`. Atualizar a tabela junto com os checks.

### Pré-requisitos
- [x] Criar uma branch para o trabalho (ex.: `feat/design-system`), separada da `poc/electron-ci`.

---

### Fase 0: decidir o visual (sem código)

**0.1 Decisões já tomadas**
- [x] Fonte da arte: PixelLab.
- [x] Espessura da borda: 8px.
- [x] Estilo e referências escolhidos (seções 2 e 3).

**0.2 Paleta**
- [x] Definir os hex: contorno, dourado (luz, base, sombra), interior escuro, texto claro, vermelho de alerta.
- [x] Anotar a paleta neste arquivo (seção 2).

**0.3 Moldura**
- [x] Definir o número de anéis (4 a 6) e a espessura de cada um dentro dos 8px (seção 2).

**0.4 Prompt do grupo 1**
- [x] Escrever o prompt dos painéis (seção 2). Aprovar o resultado só depois de gerar, na atividade 2.1.

---

### Fase 1: tokens e regras (sem mudança visual)

**1.1 Tokens**
- [x] Criar `src/shared/ui/tokens.css` com cores (movendo o `:root` do `index.css`), espaçamento, fontes, ícones,
  escala de borda (1x/2x), z-index e sombra.
- [x] Criar tokens de texto claro sobre fundo escuro (o `--ink` atual é marrom escuro).
- [x] Importar o `tokens.css` em `app/main.tsx`.

**1.2 Estrutura de pastas**
- [x] Mover `shared/ui/icons.tsx` para `shared/ui/icons/index.tsx` (os imports `@/shared/ui/icons` continuam valendo).
- [ ] Criar `shared/ui/index.ts` (vazio por enquanto).

**1.3 Regra de dependência**
- [ ] Adicionar no `.oxlintrc.json`: `src/shared/**` não importa de `@/features/*` nem `@/app/*`.
- [ ] Conferir que a regra falha ao importar errado e passa no código atual.

**1.4 Regras de encaixe das molduras**
- [ ] Definir as variáveis por moldura (`--frame-panel-art`, `--frame-panel-pad`...).
- [ ] Documentar em `src/shared/ui/README.md` o tamanho mínimo do miolo por moldura.

**1.5 Verificação**
- [ ] `npm run build` e `npm run lint` passam; o jogo está igual a antes.

---

### Fase 2: arte das molduras

**2.1 Grupo 1: painéis**
- [ ] Gerar `panel` e `window` na PixelLab, com as referências como `style_image_base64` e a paleta fixa.
- [ ] Aprovar (4 a 6 anéis de tons vizinhos, sem faixas grossas nem degradê). Só então gastar crédito nos outros.

**2.2 Grupo 2: botões**
- [ ] Gerar `button`, `icon_button` e `tab`.
- [ ] Aprovar.

**2.3 Grupo 3: barra de itens**
- [ ] Gerar `toolbar`, de onde sai o slot.
- [ ] Aprovar.

**2.4 Grupo 4: barras**
- [ ] Gerar `health_bar`, molde da barra de progresso e da vida.
- [ ] Aprovar.

**2.5 Pipeline de arte**
- [ ] Guardar as saídas cruas em `art/pixellab/raw/ui`.
- [ ] Atualizar `scripts/build_ui_frames.py`: cortar cada peça, reduzir o 3x, limpar o miolo (liso, porque o 9-slice
  estica) e produzir `panel.png`, `slot.png` e `button.png` (e variantes).
- [ ] Ajustar `slice` e as variáveis da fase 1 em um único lugar.

**2.6 Verificação**
- [ ] Conferir as PNGs e o resultado no navegador (hard reload).

---

### Fase 3: componentes base
Cada componente: `Nome.tsx` + `Nome.module.css`, variações por prop (`variant`, `size`), estados normal, hover,
pressionado, selecionado e desabilitado, e exportado em `shared/ui/index.ts`. Substituem as classes CSS
(`.panel`, `.btn`, `.slot`...): as globais saem do `index.css` na fase 5.

**3.1 Molduras**
- [ ] `Panel`
- [ ] `Slot`

**3.2 Ações**
- [ ] `Button` (com `IconButton` como variante e variante de perigo)

**3.3 Campos e navegação**
- [ ] `Field` (input e select)
- [ ] `Tabs`

**3.4 Informação**
- [ ] `Plate`
- [ ] `Chip`
- [ ] `ProgressBar` (variantes: progresso, vida, energia, dano)
- [ ] `Tooltip`

**3.5 Verificação**
- [ ] `npm run build` e `npm run lint` passam.

---

### Fase 4: página `/ui-kit` (fica no repositório)

**4.1 Página e rota**
- [ ] Criar `features/ui-kit/UiKitPage.tsx` e registrar a rota em `app/`, acessível sem login.

**4.2 Conteúdo**
- [ ] Mostrar cada componente em todos os estados e tamanhos.
- [ ] Mostrar também no tema compacto (celular).

**4.3 Verificação visual**
- [ ] Conferir em 1920x1080, 1366x768, 900px de largura e celular em pé e deitado.
- [ ] Ajustar molduras e componentes pelo `/ui-kit` antes de seguir para a HUD.

---

### Fase 5: migrar a HUD
Um commit por atividade, de menor para maior risco. Em cada uma: trocar a classe global pelo componente, apagar do
`index.css` a classe que ficou sem uso e o trecho de sobrescrita do celular que virou variável, e conferir.

**5.1 Botão de música e botões da lateral**
- [ ] Migrar e limpar o CSS.

**5.2 Barra de itens (slots)**
- [ ] Migrar e limpar o CSS.

**5.3 Placas do jogador e do relógio**
- [ ] Migrar e limpar o CSS.

**5.4 Painéis laterais (loja, armazém, construir)**
- [ ] Migrar e limpar o CSS.

**5.5 Painel do prédio e menu do clique no chão**
- [ ] Migrar e limpar o CSS.

**5.6 Login, perfil e editor de avatar**
- [ ] Migrar e limpar o CSS.

**5.7 Fechamento**
- [ ] Revisar o `index.css`: sem classes de HUD sem uso e sem valores soltos.
- [ ] Jogo jogável (login, plantar, loja, música) sem erros no console.

---

### Fase 6: peças novas (depois do MVP)

**6.1 Combate**
- [ ] Barras de vida e energia do jogador.
- [ ] Barra de vida de zumbis e construções.
- [ ] Alerta de ataque noturno.

**6.2 Utilidades**
- [ ] Toast e janela de confirmação.
- [ ] Minimapa.
- [ ] Inventário completo.

**6.3 Só quando uma tela pedir** (todos em CSS, sem arte nova)
- [ ] Passo de quantidade (`x10`), linha de lista com estado "selecionado", tag e título de seção.

## 7. Como validar

- `npm run build` e `npm run lint` passam a cada fase.
- `/ui-kit` conferido em 1920x1080, 1366x768, 900px de largura e celular em pé e deitado.
- Capturas antes e depois de cada componente migrado, na descrição do PR.
- O jogo continua jogável (login, plantar, loja, música) sem erros no console.
- Hard reload a cada troca de PNG: o navegador guarda as imagens antigas em cache.

## 8. Riscos

- **Arte gerada por IA pode vir inconsistente entre peças.** Mitigação: mesma referência de estilo e paleta fixa
  em todas, e aprovar a moldura do painel antes de gerar o resto.
- **A saída da PixelLab não vem pronta para 9-slice.** Mitigação: o script já faz esse tratamento hoje e será
  adaptado para a folha com várias peças.
- **Mudar a espessura da borda desloca todo o layout.** Mitigação: tudo passa por variáveis da fase 1,
  ajustadas em um só lugar.
- **Licença de arte de terceiros** (ex.: CC BY exige atribuição; kit com ajuda de IA tem aviso na página).
- **Escopo.** Cada fase é independente e pode parar ali; a fase 5 é a mais longa e pode ser feita por partes.
