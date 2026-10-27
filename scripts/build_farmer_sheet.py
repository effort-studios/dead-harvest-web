"""Monta a folha de sprites do fazendeiro a partir dos quadros da PixelLab (art/pixellab/raw/farmer).

Uma linha por (animação, direção), um quadro por coluna, células de 64 x 64 (o personagem tem 48; a enxada
precisa do espaço em volta). Grava
public/assets/world/farmer.png e src/features/farm/render/farmerAtlas.json.

    python3 scripts/build_farmer_sheet.py
"""
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / 'art/pixellab/raw/farmer'
CELL = 64

DIRECTIONS = ['south', 'south-west', 'west', 'north-west', 'north', 'north-east', 'east', 'south-east']

# animação -> (pasta, quadros usados). idle é a rotação parada; do "pick" o quadro 2 da geração saiu quebrado
# (o boneco cai), então o gesto é só abaixar (0 -> 1); o "till" (enxada) tem 7 quadros, o 0 é a pose parada.
ANIMS = {
    'idle': ('idle', [None]),
    'walk': ('walk', [0, 1, 2, 3, 4, 5]),
    'pick': ('pick', [0, 1]),
    'till': ('till', [1, 2, 3, 4, 5, 6]),
}


def frame(folder, direction, index):
    path = RAW / folder / (f'{direction}.png' if index is None else f'{direction}/{index}.png')
    img = Image.open(path).convert('RGBA')
    if img.size != (CELL, CELL):  # parado, andando e abaixando vêm em 48 x 48: centraliza na célula
        small = img
        img = Image.new('RGBA', (CELL, CELL))
        img.alpha_composite(small, ((CELL - small.width) // 2, (CELL - small.height) // 2))
    return img


def main():
    anims = {name: spec for name, spec in ANIMS.items() if (RAW / spec[0]).exists()}
    rows = len(anims) * len(DIRECTIONS)
    cols = max(len(frames) for _, frames in anims.values())
    sheet = Image.new('RGBA', (cols * CELL, rows * CELL))
    layout = {}
    for a, (name, (folder, frames)) in enumerate(anims.items()):
        layout[name] = {'row': a * len(DIRECTIONS), 'frames': len(frames)}
        for d, direction in enumerate(DIRECTIONS):
            for f, index in enumerate(frames):
                sheet.alpha_composite(frame(folder, direction, index), (f * CELL, (a * len(DIRECTIONS) + d) * CELL))
    sheet.save(ROOT / 'public/assets/world/farmer.png')
    atlas = {'cell': CELL, 'ax': 32, 'ay': 52, 'directions': DIRECTIONS, 'anims': layout}
    (ROOT / 'src/features/farm/render/farmerAtlas.json').write_text(json.dumps(atlas, indent=1) + '\n')
    print(f'fazendeiro: {", ".join(anims)} ({cols}x{rows} células)')


if __name__ == '__main__':
    main()
