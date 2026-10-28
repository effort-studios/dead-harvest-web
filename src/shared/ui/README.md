# shared/ui: design system da HUD

Peças reutilizáveis de interface. Regra de dependência: `app → features → shared`. Nada aqui importa de
`@/features/*` nem de `@/app/*` (o lint barra). Plano e fases: `PLANO-DESIGN-SYSTEM.md`.

- Tokens (cores, espaçamento, fontes, ícones, molduras, z-index): `tokens.css`. Os componentes só usam `var(--...)`.
- Um componente por pasta: `Nome/Nome.tsx` + `Nome/Nome.module.css`. Exportados em `index.ts`.
- Ícones genéricos em `icons/`. Ícones de domínio (que conhecem culturas, itens...) ficam na feature.

## Molduras e tamanho mínimo

As molduras são 9-slice em `public/assets/ui/v2`, geradas na PixelLab e montadas por
`scripts/build_ui_frames_dark.py`. Cada peça é desenhada em tamanho real da arte e ampliada sem borrar
(`image-rendering: pixelated`). `--px` (em `tokens.css`) é o tamanho de um pixel da arte na tela. A borda de uma
peça na tela é `slice x --px`.

| Peça | Arquivo | `slice` | Borda na tela (`--px: 2px`) | Usada em |
|---|---|---|---|---|
| Painel | `panel.png` | 5 | 10px | `Panel` |
| Placa | `plate.png` | 4 | 8px | `Plate`, `Input`, `Select`, `Tabs`, `Tooltip` |
| Barra | `bar.png` | 5 | 10px (altura fixa de 22px) | `ProgressBar` |
| Slot | `slot.png`, `slot_selected.png` | 2 | 4px | `Slot` |
| Botão | `button.png`, `button_pressed.png`, `button_danger.png` | 3 | 6px | `Button`, `IconButton`, aba ativa |

Regras de encaixe:

1. **Borda CSS e `border-image-width` são a mesma medida** (`slice x --px`), então o conteúdo nunca fica por baixo da
   moldura. A exceção é a barra, que tem a borda de layout fina de propósito (o preenchimento fica dentro).
2. **Tamanho mínimo do miolo:** a moldura ocupa `2 x slice x --px` em cada eixo. Um botão de ícone de 26px dentro de
   um botão de 40px sobra com 40 - 12 = 28px: cabe. Um botão de 30px não caberia.
3. **Mudar a escala é mudar `--px`** (por exemplo, 1px em telas pequenas): todas as molduras acompanham.
4. **Ícone dentro de moldura é bloco centralizado** (`display: block`), sem o respiro de linha de texto.
5. **Estados:** hover é `filter: brightness`, apertado troca para a imagem `_pressed`, desabilitado é
   `grayscale`. Nada de cor solta nos componentes: tudo vem de `tokens.css`.
