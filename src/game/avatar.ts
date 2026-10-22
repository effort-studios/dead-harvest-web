// Peças do avatar. Os ids precisam ser os mesmos da API (dead-harvest-api/src/game/avatar.ts):
// o servidor só aceita estes. Para adicionar uma peça: id aqui, na API (e no CHECK do banco) e no desenho.
export const AVATAR_OPTIONS = {
  skin: ['porcelain', 'light', 'tan', 'olive', 'brown', 'dark'],
  eyes: ['brown', 'green', 'blue', 'gray', 'hazel'],
  face: ['happy', 'calm', 'wink', 'surprised', 'sleepy'],
  hair: ['short', 'messy', 'long', 'ponytail', 'bun', 'buzz', 'bald'],
  hairColor: ['black', 'brown', 'auburn', 'ginger', 'blonde', 'gray'],
  beard: ['none', 'stubble', 'mustache', 'goatee', 'full'],
  hat: ['none', 'straw', 'cap', 'beanie', 'cowboy', 'flower'],
  outfit: ['overalls_blue', 'overalls_red', 'shirt_green', 'shirt_purple', 'coat_brown', 'shirt_yellow'],
} as const

export type AvatarPart = keyof typeof AVATAR_OPTIONS
export type Avatar = { [K in AvatarPart]: (typeof AVATAR_OPTIONS)[K][number] }

// Ordem das abas no editor
export const AVATAR_PARTS: AvatarPart[] = ['skin', 'eyes', 'face', 'hair', 'hairColor', 'beard', 'hat', 'outfit']

export const PART_LABEL: Record<AvatarPart, string> = {
  skin: 'Pele',
  eyes: 'Olhos',
  face: 'Rosto',
  hair: 'Cabelo',
  hairColor: 'Cor do cabelo',
  beard: 'Barba',
  hat: 'Chapéu',
  outfit: 'Roupa',
}

// Nome de cada opção, por peça (o mesmo id pode existir em peças diferentes, ex.: "brown")
export const OPTION_LABEL: { [K in AvatarPart]: Record<Avatar[K], string> } = {
  skin: { porcelain: 'Porcelana', light: 'Clara', tan: 'Bronzeada', olive: 'Oliva', brown: 'Morena', dark: 'Escura' },
  eyes: { brown: 'Castanhos', green: 'Verdes', blue: 'Azuis', gray: 'Cinza', hazel: 'Mel' },
  face: { happy: 'Feliz', calm: 'Tranquilo', wink: 'Piscadinha', surprised: 'Surpreso', sleepy: 'Sonolento' },
  hair: { short: 'Curto', messy: 'Bagunçado', long: 'Comprido', ponytail: 'Rabo de cavalo', bun: 'Coque', buzz: 'Raspado', bald: 'Careca' },
  hairColor: { black: 'Preto', brown: 'Castanho', auburn: 'Acaju', ginger: 'Ruivo', blonde: 'Loiro', gray: 'Grisalho' },
  beard: { none: 'Nenhuma', stubble: 'Por fazer', mustache: 'Bigode', goatee: 'Cavanhaque', full: 'Cheia' },
  hat: { none: 'Nenhum', straw: 'Palha', cap: 'Boné', beanie: 'Gorro', cowboy: 'Cowboy', flower: 'Flor' },
  outfit: {
    overalls_blue: 'Macacão azul',
    overalls_red: 'Macacão vermelho',
    shirt_green: 'Camisa verde',
    shirt_purple: 'Camisa roxa',
    coat_brown: 'Casaco marrom',
    shirt_yellow: 'Camisa amarela',
  },
}
