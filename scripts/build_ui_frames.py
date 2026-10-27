"""Monta as molduras 9-slice da interface a partir das geradas na PixelLab (art/pixellab/raw/ui).

A PixelLab entrega 192 x 192 com cada pixel da arte em 3 x 3; aqui volta ao tamanho real (64 x 64) e o CSS
amplia sem borrar (border-image + image-rendering: pixelated). Saem em public/assets/ui:
  panel.png        moldura dourada (barra de itens, painel do jogador, botões da lateral)
  panel_light.png  a mesma moldura com o miolo creme (janelas, menus, login)
  slot.png         moldura de madeira com miolo creme (slots, placas, botões)

    python3 scripts/build_ui_frames.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / 'art/pixellab/raw/ui'
OUT = ROOT / 'public/assets/ui'
SCALE = 3
CREAM = (0xF8, 0xDF, 0xA8, 255)
CREAM_SHADE = (0xE9, 0xC9, 0x8A, 255)


def shrink(name):
    img = Image.open(RAW / f'{name}.png').convert('RGBA')
    small = img.resize((img.width // SCALE, img.height // SCALE), Image.NEAREST)
    return small.crop(small.getbbox())


def inner_start(img):
    """Primeira coluna do miolo, olhando a linha do meio: depois do contorno e do anel da moldura a cor
    para de mudar (o miolo é liso)."""
    px = img.load()
    y = img.height // 2
    for x in range(2, img.width // 2):
        if px[x, y] == px[x + 1, y] == px[x + 2, y] == px[x + 3, y]:
            return x
    return 8


def fill_inner(img, k, color=None, shade=None):
    """Pinta o miolo (a partir de k pixels da borda) de uma cor lisa: no 9-slice ele estica, e qualquer
    detalhe viraria uma mancha. Sem cor, usa a do meio da imagem. shade = linha logo abaixo da borda de cima."""
    img = img.copy()
    px = img.load()
    color = color or px[img.width // 2, img.height // 2]
    for y in range(k, img.height - k):
        for x in range(k, img.width - k):
            px[x, y] = shade if shade and y == k else color
    return img


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    gold = shrink('panel_gold')
    k = inner_start(gold)
    fill_inner(gold, k).save(OUT / 'panel.png')
    fill_inner(gold, k, CREAM, CREAM_SHADE).save(OUT / 'panel_light.png')
    slot = shrink('slot')
    ks = inner_start(slot)
    fill_inner(slot, ks).save(OUT / 'slot.png')
    print(f'moldura {gold.size}, miolo a partir de {k}px; slot {slot.size}, miolo a partir de {ks}px')


if __name__ == '__main__':
    main()
