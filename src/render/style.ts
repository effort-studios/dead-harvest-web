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
