"""Monta os sprites do mundo a partir das imagens geradas na PixelLab (art/pixellab/raw).

Para cada sprite: tira pedacinhos soltos que a geração deixa nas bordas, recorta o espaço vazio e acha o
ponto de apoio (onde o objeto toca o chão: o meio do losango da base, ou o pé). Grava
public/assets/world/<nome>.png e src/features/farm/render/worldAtlas.json com o tamanho e o apoio de cada um.

Os tiles de chão (grama e terra) vão inteiros, 64x64 com o losango 64x32 no meio. Os ícones da interface
(32x32) vão para public/assets/icons/<id>.png.

    python3 scripts/build_world_sprites.py
"""
import colorsys
import json
import math
import random
from collections import Counter
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / 'art/pixellab/raw'
OUT = ROOT / 'public/assets/world'
ATLAS = ROOT / 'src/features/farm/render/worldAtlas.json'
ICONS_OUT = ROOT / 'public/assets/icons'

# Ícones: nome -> índice em raw/icons (ids dos itens do armazém e alguns da interface)
ICONS = [
    'corn_harvest', 'tomato_harvest', 'pumpkin_harvest', 'carrot_harvest', 'potato_harvest', 'strawberry_harvest',
    'watermelon_harvest', 'apple', 'orange', 'lemon', 'egg', 'milk', 'wool', 'feed', 'fertilizer', 'apple_juice',
    'orange_juice', 'lemonade', 'cornmeal', 'tomato_sauce', 'pickled_carrot', 'potato_chips', 'butter', 'cheese',
    'strawberry_jam', 'pumpkin_sweet', 'yarn', 'corn_cake', 'apple_pie', 'strawberry_ice_cream', 'watermelon_sorbet',
    'polenta', 'can', 'coin', 'sun', 'moon', 'sunrise', 'sunset', 'late_night', 'shop', 'bulb', 'plot', 'farmer',
]

# base: 'iso' = objeto em cima de um losango (apoio no meio do losango da base);
#       'foot' = objeto solto (apoio no pé, um pouco acima da última linha)
# Os prédios estão em restyle/: redesenhados no estilo do moinho (edit_image_pro_flash com ele de referência)
SPRITES = {
    'barn': ('restyle/barn.png', 'iso'),
    'well': ('restyle/well.png', 'iso'),
    'juicer': ('restyle/juicer.png', 'iso'),
    'feed_mill': ('restyle/feed_mill.png', 'iso'),
    'mill': ('mill.png', 'iso'),
    'cannery': ('restyle/cannery.png', 'iso'),
    'fryer': ('restyle/fryer.png', 'iso'),
    'composter': ('restyle/composter.png', 'iso'),
    'dairy': ('restyle/dairy.png', 'iso'),
    'candy': ('restyle/candy.png', 'iso'),
    'loom': ('restyle/loom.png', 'iso'),
    'oven': ('restyle/oven.png', 'iso'),
    'ice_cream': ('restyle/ice_cream.png', 'iso'),
    'kitchen': ('restyle/kitchen.png', 'iso'),
    'hay': ('hay.png', 'iso'),
    'hayStack': ('hayStack.png', 'iso'),
    'platform': ('platform.png', 'iso'),
    'tree': ('tree.png', 'foot'),  # o losango de grama da base é apagado (strip_ground)
    'bush': ('bush.png', 'foot'),
    'sack': ('sack.png', 'foot'),
    'rock': ('rock2.png', 'foot'),
    'chicken': ('chicken.png', 'foot'),
    'cow': ('cow.png', 'foot'),
    'sheep': ('sheep.png', 'foot'),
}

# Animações geradas: sprite -> (quadros em ordem, quadros por segundo). Cada quadro tem o mesmo canvas do
# sprite parado; o loop fecha sozinho (o último quadro gerado, igual ao primeiro, fica de fora).
ANIMS = {
    'fryer': ([f'anim/fryer/{i}.png' for i in range(8)], 8),
    'chicken': ([f'anim/chicken/{i}.png' for i in range(8)], 5),
    'cow': ([f'anim/cow/{i}.png' for i in range(8)], 4),
    'sheep': ([f'anim/sheep/{i}.png' for i in range(8)], 4),
}

# Animações montadas aqui (o modelo não acertou): coordenadas em pixels do PNG parado
# Moinho: as pás giram 360 graus. anim/mill tem as pás girando 45 graus; a torre é separada das pás e, para os
# 45 seguintes, as pás são espelhadas em torno do eixo (HUB) e tocadas de trás para frente: o giro continua no
# mesmo sentido e, com 4 pás, 90 graus já é uma volta inteira.
MILL_HUB = (64, 75)
# Cozinha: fumaça saindo da boca da chaminé (a gerada saía do telhado, ao lado dela)
CHIMNEY = (66, 23)
# Forno: chamas desenhadas dentro da boca (a gerada só mudava o brilho): caixa da boca e linha do chão dela
OVEN_MOUTH = (17, 34, 29, 46)
OVEN_FLOOR = 43

# Plantas: (pasta dos candidatos, índice) para cada estágio (0 broto, 1 crescendo, 2 madura)
CROPS = {
    'corn': [('crops_b', 5), ('crops_a', 1), ('crops_a', 2)],
    'tomato': [('crops_a', 3), ('crops_a', 4), ('crops_a', 5)],
    'pumpkin': [('crops_a', 6), ('crops_a', 7), ('crops_a', 8)],
    'carrot': [('crops_a', 9), ('crops_a', 10), ('crops_a', 11)],
    'potato': [('crops_b', 9), ('crops_a', 13), ('crops_a', 14)],
    'strawberry': [('crops_b', 10), ('crops_b', 0), ('crops_b', 1)],
    'watermelon': [('crops_b', 2), ('crops_b', 3), ('crops_b', 4)],
}

# Tiles de chão: índice em raw/ground
GROUND = {
    'grass': [0, 1, 2, 3],
    'grass_flowers': [4, 5, 6, 7],
    'soil': [12, 13],
    'soil_wet': [14, 15],
}

# Frutas pintadas na copa da árvore: [cor, sombra, brilho]
FRUITS = {
    'apple': [(0xE5, 0x48, 0x3B), (0x9C, 0x22, 0x22), (0xFF, 0xB0, 0xA0)],
    'orange': [(0xF5, 0x9A, 0x23), (0xB0, 0x5A, 0x12), (0xFF, 0xD8, 0x90)],
    'lemon': [(0xF2, 0xDC, 0x3A), (0xA8, 0x92, 0x1A), (0xFF, 0xF8, 0xC0)],
}
FRUIT_OUTLINE = (0x3B, 0x24, 0x12)


def components(img):
    """Partes ligadas (pixels opacos vizinhos) da imagem, cada uma como lista de (x, y)."""
    a = img.getchannel('A').load()
    w, h = img.size
    seen = set()
    parts = []
    for y in range(h):
        for x in range(w):
            if a[x, y] < 16 or (x, y) in seen:
                continue
            stack, part = [(x, y)], []
            seen.add((x, y))
            while stack:
                p = stack.pop()
                part.append(p)
                px, py = p
                for q in ((px + 1, py), (px - 1, py), (px, py + 1), (px, py - 1)):
                    if 0 <= q[0] < w and 0 <= q[1] < h and q not in seen and a[q] >= 16:
                        seen.add(q)
                        stack.append(q)
            parts.append(part)
    return parts


def clean(img):
    """Apaga os pedaços soltos que ficam fora da caixa da parte principal (restos de outro desenho)."""
    parts = components(img)
    if len(parts) < 2:
        return img
    main = max(parts, key=len)
    x0 = min(p[0] for p in main) - 2
    x1 = max(p[0] for p in main) + 2
    y0 = min(p[1] for p in main) - 2
    y1 = max(p[1] for p in main) + 2
    px = img.load()
    for part in parts:
        if part is main:
            continue
        inside = sum(1 for x, y in part if x0 <= x <= x1 and y0 <= y <= y1)
        if inside < len(part) * 0.5 or len(part) < 3:
            for p in part:
                px[p] = (0, 0, 0, 0)
    return img


def anchor(img, base):
    """Ponto de apoio no chão, em pixels do sprite já recortado."""
    a = img.getchannel('A').load()
    w, h = img.size
    rows = [[x for x in range(w) if a[x, y] >= 16] for y in range(h)]
    if base == 'foot':
        xs = [x for row in rows[-4:] for x in row]
        return (min(xs) + max(xs)) / 2, h - 2
    # losango da base: a linha mais larga no quarto de baixo do desenho; o meio dele fica 1/4 da largura
    # acima da ponta de baixo
    start = h - max(h // 4, 4)
    y_wide = max(range(start, h), key=lambda y: (max(rows[y]) - min(rows[y])) if rows[y] else -1)
    row = rows[y_wide]
    width = max(row) - min(row) + 1
    return (min(row) + max(row) + 1) / 2, h - width / 4


def add_fruits(img, colors, seed):
    """Pinta frutas redondinhas (3x3 com contorno) espalhadas pela copa verde."""
    img = img.copy()
    px = img.load()
    w, h = img.size
    leafy = lambda x, y: 0 <= x < w and 0 <= y < h and px[x, y][3] > 200 and px[x, y][1] > px[x, y][0] + 20
    spots = [(x, y) for y in range(2, int(h * 0.62)) for x in range(2, w - 2) if all(leafy(x + dx, y + dy) for dx in (-2, 2) for dy in (-2, 2))]
    rng = random.Random(seed)
    rng.shuffle(spots)
    chosen = []
    for s in spots:
        if all(abs(s[0] - c[0]) + abs(s[1] - c[1]) > 9 for c in chosen):
            chosen.append(s)
        if len(chosen) == 8:
            break
    fill, dark, shine = colors
    for x, y in chosen:
        for dx in range(-2, 3):
            for dy in range(-2, 3):
                if abs(dx) + abs(dy) <= 3:
                    px[x + dx, y + dy] = (*FRUIT_OUTLINE, 255)
        for dx in range(-1, 2):
            for dy in range(-1, 2):
                px[x + dx, y + dy] = (*(dark if dy == 1 or dx == 1 else fill), 255)
        px[x - 1, y - 1] = (*shine, 255)
    return img


def strip_ground(img, below=0.68):
    """Apaga o chão verde desenhado embaixo do objeto (o losango de grama da árvore): em outro tom, ele
    aparecia como um quadrado sobre a grama do mapa. Só mexe nas linhas de baixo (abaixo da copa)."""
    img = img.copy()
    px = img.load()
    w, h = img.size
    for y in range(int(h * below), h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a and r <= g + 10:  # o tronco é marrom (bem mais vermelho que verde); o resto é chão
                px[x, y] = (0, 0, 0, 0)
    return img


def flatten_rim(tile, rim=2):
    """Tira a beirada escura de baixo do losango (a "lateral" do tile). Na grama, que cobre o chão todo, ela
    desenharia a grade; os pixels dela passam a ter a cor dos que estão logo acima."""
    tile = tile.copy()
    px = tile.load()
    w, h = tile.size
    for x in range(w):
        ys = [y for y in range(h // 2, h) if px[x, y][3] >= 128]
        if not ys:
            continue
        bottom = max(ys)
        for k in range(rim):
            px[x, bottom - k] = px[x, bottom - k - rim]
    return tile


def save_anim(name, paths, fps, base, atlas, frames=None, pad=0):
    """Tira com os quadros lado a lado em <nome>_anim.png, todos recortados pela mesma caixa (a união das
    caixas), para o apoio não pular de um quadro para o outro. <nome>.png fica sendo o primeiro quadro."""
    frames = frames or [clean(Image.open(RAW / p).convert('RGBA')) for p in paths]
    boxes = [f.getbbox() for f in frames]
    box = (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))
    frames = [f.crop(box) for f in frames]
    w, h = frames[0].size
    strip = Image.new('RGBA', (w * len(frames), h))
    for i, f in enumerate(frames):
        strip.alpha_composite(f, (i * w, 0))
    strip.save(OUT / f'{name}_anim.png')
    frames[0].save(OUT / f'{name}.png')
    # o apoio sai do sprite parado, no lugar dele dentro da caixa comum
    still = clean(Image.open(RAW / SPRITES[name][0]).convert('RGBA')) if name in SPRITES else frames[0]
    sb = still.getbbox()
    ax, ay = anchor(still.crop(sb), base)
    atlas[name] = {'w': w, 'h': h, 'ax': round(ax + sb[0] - box[0], 1), 'ay': round(ay + sb[1] + pad - box[1], 1),
                   'frames': len(frames), 'fps': fps}


def fiery(c):
    h, l, sat = colorsys.rgb_to_hls(*(v / 255 for v in c[:3]))
    return c[3] > 200 and (h < 0.17 or h > 0.95) and sat > 0.55 and l > 0.3


def mill_frames():
    """Pás do moinho girando 360 graus (ver MILL_HUB)."""
    frames = [Image.open(RAW / f'anim/mill/{i}.png').convert('RGBA') for i in range(8)]
    w, h = frames[0].size
    data = [f.load() for f in frames]

    def cloth(c):  # pano claro das pás
        if c[3] < 128:
            return False
        hh, l, _ = colorsys.rgb_to_hls(*(v / 255 for v in c[:3]))
        return l > 0.62 and 0.05 < hh < 0.17

    # torre sem as pás: em cada pixel, a cor mais comum entre os quadros (as pás passam e vão embora); onde o
    # pano das pás ganha, fica a outra cor que aparece em mais de um quadro
    tower = Image.new('RGBA', (w, h))
    tp = tower.load()
    for y in range(h):
        for x in range(w):
            counts = Counter(d[x, y] for d in data).most_common()
            c = counts[0][0]
            if cloth(c):
                c = next((k for k, n in counts if not cloth(k) and n >= 2), c)
            tp[x, y] = c
    # pás de cada quadro: o que difere da torre e está ligado ao eixo (o resto é ruído da torre)
    hx, hy = MILL_HUB
    hub = {(x, y) for x in range(hx - 8, hx + 9) for y in range(hy - 8, hy + 9) if (x - hx) ** 2 + (y - hy) ** 2 <= 64}

    def blades(i):
        d = data[i]
        diff = hub | {(x, y) for y in range(h) for x in range(w)
                      if d[x, y][3] and sum(abs(d[x, y][k] - tp[x, y][k]) for k in range(4)) > 12}
        seen, stack = set(hub), list(hub)
        while stack:
            x, y = stack.pop()
            for q in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1), (x + 1, y + 1), (x - 1, y - 1), (x + 1, y - 1), (x - 1, y + 1)):
                if q in diff and q not in seen:
                    seen.add(q)
                    stack.append(q)
        return seen

    masks = [blades(i) for i in range(8)]

    def compose(i, mirror):
        out = tower.copy()
        op = out.load()
        for x, y in masks[i]:
            nx = 2 * hx - x if mirror else x
            if 0 <= nx < w:
                op[nx, y] = data[i][x, y]
        return out

    return [compose(i, False) for i in range(8)] + [compose(i, True) for i in range(6, 0, -1)]


def smoke_frames(img, n=12, pad=16):
    """Baforadas de fumaça saindo da chaminé (CHIMNEY): três de cada vez, subindo, crescendo, indo um pouco
    para a direita e sumindo em pontilhado. O canvas ganha `pad` pixels em cima para elas caberem."""
    base = Image.new('RGBA', (img.width, img.height + pad))
    base.alpha_composite(img, (0, pad))
    light, mid, edge = (0xF1, 0xEE, 0xE8, 255), (0xD2, 0xCD, 0xC4, 255), (0x9E, 0x97, 0x8D, 255)
    frames = []
    for f in range(n):
        frame = base.copy()
        px = frame.load()
        for k in range(3):
            t = ((f / n) + k / 3) % 1
            cx = CHIMNEY[0] + t * 6
            cy = CHIMNEY[1] + pad - 2 - t * (pad + 14)
            r = 2.2 + t * 3.6
            for y in range(int(cy - r - 1), int(cy + r + 2)):
                for x in range(int(cx - r - 1), int(cx + r + 2)):
                    d2 = (x - cx) ** 2 + (y - cy) ** 2
                    if d2 > r * r or not (0 <= x < frame.width and 0 <= y < frame.height):
                        continue
                    if t > 0.6 and (x + y + f) % 2 == 0 or t > 0.82 and (x * 3 + y + f) % 4:
                        continue  # some aos poucos, em pontilhado
                    inner = d2 < (r - 1.2) ** 2
                    px[x, y] = (light if x - cx + y - cy < 0 else mid) if inner else edge
        frames.append(frame)
    return frames, pad


def flame_frames(img, n=8):
    """Chamas dentro da boca do forno (OVEN_MOUTH): línguas de fogo de alturas que sobem e descem, do
    vermelho na base ao amarelo na ponta, com uma faísca de vez em quando. Só pinta dentro da boca."""
    x0, y0, x1, y1 = OVEN_MOUTH
    px = img.load()
    mouth = {(x, y) for y in range(y0, OVEN_FLOOR + 1) for x in range(x0, x1)
             if fiery(px[x, y]) or (px[x, y][3] > 200 and sum(px[x, y][:3]) < 220)}
    dark = (0x14, 0x10, 0x0C, 255)
    red, orange, yellow, tip = (0xC4, 0x2E, 0x1A, 255), (0xF0, 0x82, 0x1E, 255), (0xFF, 0xCC, 0x33, 255), (0xFF, 0xF3, 0xA0, 255)
    cols = [x for x in range(x0 + 1, x1 - 1) if (x, OVEN_FLOOR) in mouth]
    mid = (cols[0] + cols[-1]) / 2 if cols else 0
    frames = []
    for f in range(n):
        frame = img.copy()
        fpx = frame.load()
        for p in mouth:
            if fiery(px[p]):
                fpx[p] = dark
        for x in cols:
            top = 7.5 - abs(x - mid) * 0.9  # mais alta no meio
            height = round(top + 2.2 * math.sin(2 * math.pi * f / n * 2 + x * 1.9) + math.sin(2 * math.pi * f / n + x))
            for j in range(max(height, 1)):
                y = OVEN_FLOOR - j
                if (x, y) not in mouth:
                    break
                t = j / max(height, 1)
                fpx[x, y] = red if t < 0.3 else orange if t < 0.62 else yellow if t < 0.88 else tip
            if (f + x) % 5 == 0 and (x, OVEN_FLOOR - height - 2) in mouth:
                fpx[x, OVEN_FLOOR - height - 2] = yellow  # faísca
        frames.append(frame)
    return frames


def save(name, img, base, atlas):
    img = img.crop(img.getbbox())
    ax, ay = anchor(img, base)
    img.save(OUT / f'{name}.png')
    atlas[name] = {'w': img.width, 'h': img.height, 'ax': round(ax, 1), 'ay': round(ay, 1)}


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    atlas = {}
    for name, (file, base) in SPRITES.items():
        img = clean(Image.open(RAW / file).convert('RGBA'))
        if name == 'tree':
            img = clean(strip_ground(img))
        if name in ANIMS and all((RAW / p).exists() for p in ANIMS[name][0]):
            save_anim(name, *ANIMS[name], base, atlas)
            continue
        if name == 'mill':
            save_anim(name, [], 6, base, atlas, mill_frames())
            continue
        if name == 'kitchen':
            frames, pad = smoke_frames(img)
            save_anim(name, [], 6, base, atlas, frames, pad)
            continue
        if name == 'oven':
            save_anim(name, [], 10, base, atlas, flame_frames(img))
            continue
        save(name, img, base, atlas)
        if name == 'tree':
            for i, (fruit, colors) in enumerate(FRUITS.items()):
                save(f'tree_{fruit}', add_fruits(img, colors, i + 1), base, atlas)
    for crop, stages in CROPS.items():
        for stage, (folder, index) in enumerate(stages):
            path = RAW / folder / f'{index}.png'
            if not path.exists():
                print(f'falta {path.relative_to(ROOT)} ({crop}_{stage})')
                continue
            img = clean(Image.open(path).convert('RGBA'))
            save(f'{crop}_{stage}', img, 'foot', atlas)
    # cerca desenhada à mão (scripts/draw_fence.py): o apoio é a ponta de cima da aresta
    fence = Image.open(RAW / 'fence_drawn.png')
    fence.save(OUT / 'fence.png')
    atlas['fence'] = {'w': fence.width, 'h': fence.height, 'ax': 3, 'ay': 15}
    for name, indices in GROUND.items():
        for i, index in enumerate(indices):
            tile = Image.open(RAW / 'ground' / f'tile_{index}.png').convert('RGBA')
            if name.startswith('grass'):
                tile = flatten_rim(tile)
            tile.save(OUT / f'{name}_{i}.png')
            atlas[f'{name}_{i}'] = {'w': 64, 'h': 64, 'ax': 32, 'ay': 32}
    ATLAS.write_text(json.dumps(atlas, indent=1) + '\n')
    ICONS_OUT.mkdir(parents=True, exist_ok=True)
    for index, name in enumerate(ICONS):
        clean(Image.open(RAW / 'icons' / f'{index}.png').convert('RGBA')).save(ICONS_OUT / f'{name}.png')
    print(f'{len(atlas)} sprites em {OUT.relative_to(ROOT)}, {len(ICONS)} ícones em {ICONS_OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    main()
