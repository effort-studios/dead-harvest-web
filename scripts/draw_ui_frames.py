"""Desenha as molduras 9-slice da HUD escura (paleta e anéis do PLANO-DESIGN-SYSTEM.md), pixel a pixel.

Cada moldura é uma PNG pequena para o CSS ampliar sem borrar (border-image + image-rendering: pixelated).
Saem em public/assets/ui/v2 (as atuais, em public/assets/ui, continuam valendo até a migração da HUD);
a folha de conferência sai em art/ui_frames_preview.png:
  panel.png            painel: 5 anéis em 8px (contorno, luz, base, sombra, contorno interno) e miolo escuro
  panel_inactive.png   o mesmo painel em bronze (janela sem foco)
  slot.png             slot afundado (contorno e uma linha clara embaixo e à direita)
  button.png           botão dourado
  button_pressed.png   botão pressionado (luz e sombra trocadas)
  button_danger.png    botão de perigo (vermelho)

    python3 scripts/draw_ui_frames.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public/assets/ui/v2'
PREVIEW = ROOT / 'art/ui_frames_preview.png'  # fora de public: só para conferir, não vai no jogo

hexc = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) + (255,)
OUTLINE = hexc('#2a1a0e')
GOLD_LIGHT, GOLD, GOLD_DARK = hexc('#fbd594'), hexc('#c89e61'), hexc('#6c4620')
PANEL_BG, SLOT_BG, SLOT_EDGE = hexc('#2b2118'), hexc('#1d160f'), hexc('#4a3a28')
BRONZE_LIGHT, BRONZE, BRONZE_DARK = hexc('#c9b8a0'), hexc('#9e8976'), hexc('#5a4c40')
RED_LIGHT, RED, RED_DARK = hexc('#f08a6c'), hexc('#d9482b'), hexc('#7a2414')


def frame(size, slice_, rings_tl, rings_br, fill, chamfer=True):
    """Moldura quadrada. rings_tl / rings_br: cor de cada anel (de fora para dentro) nos lados de cima e
    esquerda / de baixo e direita. Nos cantos de cima-direita e de baixo-esquerda vale o tom do meio (o anel
    de baixo-direita), para a luz e a sombra se encontrarem sem degrau. Depois dos anéis é o miolo."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    px = img.load()
    for y in range(size):
        for x in range(size):
            r = min(x, y, size - 1 - x, size - 1 - y)
            if r >= len(rings_tl):
                px[x, y] = fill
                continue
            top_left = (x == r and y <= size - 1 - r) or (y == r and x <= size - 1 - r)
            on_top_or_left = x == r or y == r
            on_bottom_or_right = x == size - 1 - r or y == size - 1 - r
            if on_top_or_left and on_bottom_or_right:
                px[x, y] = rings_br[r]  # cantos que dividem luz e sombra
            elif top_left or on_top_or_left:
                px[x, y] = rings_tl[r]
            else:
                px[x, y] = rings_br[r]
    if chamfer:  # quinas do contorno cortadas em diagonal
        for x, y in ((0, 0), (size - 1, 0), (0, size - 1), (size - 1, size - 1)):
            px[x, y] = (0, 0, 0, 0)
    return img


def panel(light, base, dark):
    # 6 anéis + 2px de respiro = 8px. Luz só em cima e à esquerda, sombra só embaixo e à direita.
    tl = [OUTLINE, light, base, base, base, OUTLINE]
    br = [OUTLINE, base, base, base, dark, OUTLINE]
    return frame(32, 8, tl, br, PANEL_BG)


def button(light, base, dark, pressed=False):
    tl = [OUTLINE, light, base]
    br = [OUTLINE, dark, base]
    if pressed:
        tl, br = [OUTLINE, dark, base], [OUTLINE, light, base]
    return frame(12, 3, tl, br, base)


def slot():
    # afundado: contorno em volta e uma linha clara só embaixo e à direita
    tl = [OUTLINE, SLOT_BG]
    br = [OUTLINE, SLOT_EDGE]
    return frame(12, 2, tl, br, SLOT_BG, chamfer=False)


def stretch(img, slice_, w, h):
    """Simula o 9-slice do CSS (cantos fixos, bordas e miolo esticados) para a folha de conferência."""
    s = img.size[0]
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    xs, ys = [0, slice_, s - slice_, s], [0, slice_, s - slice_, s]
    dx, dy = [0, slice_, w - slice_, w], [0, slice_, h - slice_, h]
    for i in range(3):
        for j in range(3):
            part = img.crop((xs[i], ys[j], xs[i + 1], ys[j + 1]))
            tw, th = dx[i + 1] - dx[i], dy[j + 1] - dy[j]
            out.paste(part.resize((tw, th), Image.NEAREST), (dx[i], dy[j]))
    return out


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    pieces = {
        'panel': (panel(GOLD_LIGHT, GOLD, GOLD_DARK), 8),
        'panel_inactive': (panel(BRONZE_LIGHT, BRONZE, BRONZE_DARK), 8),
        'slot': (slot(), 2),
        'button': (button(GOLD_LIGHT, GOLD, GOLD_DARK), 3),
        'button_pressed': (button(GOLD_LIGHT, GOLD, GOLD_DARK, pressed=True), 3),
        'button_danger': (button(RED_LIGHT, RED, RED_DARK), 3),
    }
    for name, (img, _) in pieces.items():
        img.save(OUT / f'{name}.png')

    # folha de conferência: cada peça esticada em dois tamanhos, ampliada 4x sobre o verde do mapa
    sheet = Image.new('RGBA', (120, 118), (79, 127, 59, 255))
    def put(name, size, pos):
        img, sl = pieces[name]
        sheet.alpha_composite(stretch(img, sl, *size), pos)
    put('panel', (56, 44), (4, 4))
    put('panel_inactive', (50, 44), (64, 4))
    put('slot', (16, 16), (4, 54))
    put('slot', (16, 16), (24, 54))
    put('slot', (16, 16), (44, 54))
    put('button', (30, 14), (4, 76))
    put('button_pressed', (30, 14), (38, 76))
    put('button_danger', (30, 14), (72, 76))
    put('button', (50, 14), (4, 96))
    put('slot', (50, 14), (58, 96))
    sheet.resize((sheet.width * 5, sheet.height * 5), Image.NEAREST).save(PREVIEW)
    print('molduras em', OUT)


if __name__ == '__main__':
    main()
