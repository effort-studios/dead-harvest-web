# shared/ui: design system da HUD

Peças reutilizáveis de interface. Regra de dependência: `app → features → shared`. Nada aqui importa de
`@/features/*` nem de `@/app/*` (o lint barra). Plano e fases: `PLANO-DESIGN-SYSTEM.md`.

- Tokens (cores, espaçamento, fontes, ícones, molduras, z-index): `tokens.css`. Os componentes só usam `var(--...)`.
- Um componente por pasta: `Nome/Nome.tsx` + `Nome/Nome.module.css`. Exportados em `index.ts`.
- Ícones genéricos em `icons/`. Ícones de domínio (que conhecem culturas, itens...) ficam na feature.

## Molduras e tamanho mínimo

As molduras são 9-slice em `public/assets/ui`, ampliadas sem borrar (`image-rendering: pixelated`). A arte ocupa
`--frame-art` pixels em 1x e o dobro em 2x. A borda CSS reserva só uma parte; o resto da moldura invade o padding.

| Moldura | Escala | Arte | Borda CSS | Padding mínimo | Miolo mínimo |
|---|---|---|---|---|---|
| Painel (`panel`, `panel_light`) | 2x | `--frame-panel-art` | `--frame-panel-border` | `--frame-panel-pad` | 24 x 24px |
| Botão, botão de ícone | 1x | `--frame-small-art` | `--frame-small-border` | `--frame-small-pad` | 18px de altura |
| Slot | 1x | `--frame-small-art` | `--frame-small-border` | `--frame-small-pad` | 24 x 24px |

Valores de hoje (arte de 9px): painel com arte de 18px, borda de 12px e padding mínimo de 6px; botão e slot com 9px.
Quando a arte nova de 8px entrar (fase 2), só `--frame-art` muda, e o resto sai das fórmulas.

Regras de encaixe:

1. **Padding do painel ≥ `--frame-panel-pad`.** Abaixo disso o conteúdo fica por baixo da moldura.
2. **Largura e altura mínimas do componente = 2 x borda + miolo mínimo.** Ex.: botão de ícone de 26px precisa de
   26 + 2 x 9 = 44px. Um botão de 40px (como o de música era) estrangula o ícone.
3. **Em tela compacta, mudar a borda e a arte juntas** (`border-width` e `border-image-width`), nunca só uma.
4. **Ícone dentro de moldura é bloco centralizado** (`display: block`), sem o respiro de linha de texto.
