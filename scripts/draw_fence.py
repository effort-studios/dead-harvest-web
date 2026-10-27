"""Desenha o trecho de cerca em pixel art com a geometria exata da aresta do tile (32 x 16 px).

A cerca gerada pela PixelLab não encaixa na aresta do losango, então o trecho é desenhado aqui, com a
paleta dela. Sai um trecho descendo para a direita ("\\", lados N e S do tile); o "/" (lados E e W) é o
mesmo espelhado, feito no jogo.

    python3 scripts/draw_fence.py art/pixellab/raw/fence_drawn.png   (depois rode build_world_sprites.py)
"""
import sys
from PIL import Image

OUTLINE = (0x55, 0x30, 0x28, 255)
DARK = (0x76, 0x45, 0x2D, 255)
MID = (0xAC, 0x67, 0x3E, 255)
LIGHT = (0xE9, 0x97, 0x5E, 255)

W, H = 38, 34
X0, Y0 = 3, 15  # ponta de cima da aresta; a outra fica em (X0 + 32, Y0 + 16)
POST_H = 13
RAILS = (4, 9)  # altura de cada travessa acima do chão

img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
px = img.load()


def put(x, y, c):
    if 0 <= x < W and 0 <= y < H:
        px[x, y] = c


def ground_y(x):
    return Y0 + (x - X0) / 2


# travessas: 2 px de madeira (clara em cima) com contorno em cima e embaixo
for h in RAILS:
    for x in range(X0, X0 + 33):
        y = round(ground_y(x)) - h
        put(x, y - 1, OUTLINE)
        put(x, y, LIGHT if x % 7 else MID)
        put(x, y + 1, MID)
        put(x, y + 2, OUTLINE)

# postes: 4 px de largura, luz da esquerda, topo chanfrado
for gx in (X0, X0 + 32):
    gy = round(ground_y(gx))
    for y in range(gy - POST_H, gy + 1):
        put(gx - 2, y, OUTLINE)
        put(gx - 1, y, LIGHT)
        put(gx, y, MID)
        put(gx + 1, y, DARK)
        put(gx + 2, y, OUTLINE)
    for x in range(gx - 1, gx + 2):
        put(x, gy - POST_H - 1, OUTLINE)
        put(x, gy + 1, OUTLINE)
    put(gx - 1, gy - POST_H, MID)

img.save(sys.argv[1])
print(f'cerca {W}x{H}, ancora da aresta em ({X0}, {Y0})')
