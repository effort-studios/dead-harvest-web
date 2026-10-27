// Design system do mundo (o que é desenhado no canvas). As regras completas estão em DESIGN.md.
// Tudo que é objeto usa estes valores, para o mundo parecer feito pela mesma mão.

// Contorno: todo objeto (cerca, fardo, planta...) tem um contorno marrom bem escuro e fino.
// O terreno (grama, terra) NÃO tem contorno.
export const OUTLINE = '#3b2412'
export const OUTLINE_W = 1.3 // em unidades do mundo

// Sombra projetada no chão: sempre uma elipse suave, deslocada para a direita (luz vem da esquerda)
export const SHADOW = 'rgba(14, 44, 22, 0.28)'

// Cada material tem 3 tons: claro (face iluminada / topo), médio e escuro (face na sombra)
export const WOOD = { light: '#d6a064', mid: '#b4753f', dark: '#7e4a27' }
export const HAY = { light: '#f7da7c', mid: '#e3b34a', dark: '#b8872a', rope: '#8f5a2a' }
export const BURLAP = { light: '#ead0a0', mid: '#cfa96c', dark: '#a37b43' }
export const STONE = { light: '#d4cfc3', mid: '#aaa498', dark: '#7c776d' }
export const LEAF = { light: '#92df62', mid: '#51ae4a', dark: '#2a7a3a' }
export const TRUNK = { light: '#a8744a', dark: '#6b4226' }

// Prédios (celeiro e máquinas)
export const BARN_RED = { light: '#e3654c', mid: '#c4402f', dark: '#8a2619' }
export const TRIM = { light: '#fff6e2', mid: '#efe0c0', dark: '#c9b48c' } // acabamento branco (portas, beirais)
export const ROOF = { light: '#8f6a55', mid: '#6e4d3c', dark: '#4a3227' } // telhado de telha escura
export const METAL = { light: '#e3e7eb', mid: '#aeb5bd', dark: '#727b85' }
export const COPPER = { light: '#f3a86c', mid: '#cc6e38', dark: '#8c4521' }
export const BRICK = { light: '#de9064', mid: '#bb6a40', dark: '#7f4024' }
export const CLAY = { light: '#e6b884', mid: '#c98c56', dark: '#8f5c32' }
export const FIRE = { light: '#ffe27a', mid: '#ff9d2e', dark: '#e0461f' }
