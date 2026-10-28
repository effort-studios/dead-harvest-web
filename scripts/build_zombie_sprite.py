"""Monta a tira de sprites do zumbi (andando para a esquerda) a partir dos quadros da PixelLab
(art/pixellab/raw/zombie/west_0..7.png): recorta o espaço vazio igual em todos e põe lado a lado.
Sai em public/assets/world/zombie_walk.png (8 quadros) e imprime o tamanho de cada quadro.

    python3 scripts/build_zombie_sprite.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / 'art/pixellab/raw/zombie'
OUT = ROOT / 'public/assets/world/zombie_walk.png'
FRAMES = 8


def main():
    frames = [Image.open(RAW / f'west_{i}.png').convert('RGBA') for i in range(FRAMES)]
    boxes = [f.getbbox() for f in frames]
    box = (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))
    w, h = box[2] - box[0], box[3] - box[1]
    sheet = Image.new('RGBA', (w * FRAMES, h), (0, 0, 0, 0))
    for i, f in enumerate(frames):
        sheet.paste(f.crop(box), (i * w, 0))
    sheet.save(OUT)
    print(f'{FRAMES} quadros de {w}x{h} em {OUT}')


if __name__ == '__main__':
    main()
