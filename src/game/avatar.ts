// Peças do avatar. Os ids precisam ser os mesmos da API (dead-harvest-api/src/game/avatar.ts):
// o servidor só aceita estes. Para adicionar uma peça: id aqui, na API (e no CHECK do banco) e no desenho.
export const AVATAR_OPTIONS = {
  skin: ['porcelain', 'light', 'tan', 'olive', 'brown', 'dark'],
  face: ['happy', 'calm', 'wink', 'surprised', 'sleepy'],
  hat: ['none', 'straw', 'cap', 'beanie', 'cowboy', 'flower'],
  beard: ['none', 'stubble', 'mustache', 'goatee', 'full'],
  outfit: ['overalls_blue', 'overalls_red', 'shirt_green', 'shirt_purple', 'coat_brown', 'shirt_yellow'],
} as const

export type AvatarPart = keyof typeof AVATAR_OPTIONS
export type Avatar = { [K in AvatarPart]: (typeof AVATAR_OPTIONS)[K][number] }

export const AVATAR_PARTS: AvatarPart[] = ['skin', 'face', 'hat', 'beard', 'outfit']

export const PART_LABEL: Record<AvatarPart, string> = {
  skin: 'Pele',
  face: 'Rosto',
  hat: 'Chapéu',
  beard: 'Barba',
  outfit: 'Roupa',
}

export const OPTION_LABEL: Record<string, string> = {
  porcelain: 'Porcelana',
  light: 'Clara',
  tan: 'Bronzeada',
  olive: 'Oliva',
  brown: 'Morena',
  dark: 'Escura',
  happy: 'Feliz',
  calm: 'Tranquilo',
  wink: 'Piscadinha',
  surprised: 'Surpreso',
  sleepy: 'Sonolento',
  none: 'Nenhum',
  straw: 'Palha',
  cap: 'Boné',
  beanie: 'Gorro',
  cowboy: 'Cowboy',
  flower: 'Flor',
  stubble: 'Por fazer',
  mustache: 'Bigode',
  goatee: 'Cavanhaque',
  full: 'Cheia',
  overalls_blue: 'Macacão azul',
  overalls_red: 'Macacão vermelho',
  shirt_green: 'Camisa verde',
  shirt_purple: 'Camisa roxa',
  coat_brown: 'Casaco marrom',
  shirt_yellow: 'Camisa amarela',
}
