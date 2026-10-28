"""Monta as molduras 9-slice da HUD escura a partir das peças geradas na PixelLab (art/pixellab/raw/ui/g2_*).

As peças vêm em tamanho real da arte (1 pixel da imagem = 1 pixel da arte), duas folhas e três peças soltas.
Aqui cada uma é recortada e limpa: os cantos ficam como a PixelLab desenhou, as bordas são refeitas repetindo a
coluna (ou linha) do meio, e o miolo vira uma cor lisa, porque o 9-slice estica e qualquer detalhe viraria
mancha. O botão sai da cor bege da PixelLab recolorido para o dourado da paleta (e para o vermelho de perigo).

Saem em public/assets/ui/v2 (as molduras atuais, em public/assets/ui, valem até a migração da HUD):
  panel.png            painel dourado, interior escuro                (slice 5)
  plate.png            placa/campo de texto escuro                    (slice 4)
  bar.png              moldura de barra (progresso, vida, energia)    (slice 5)
  slot.png             slot de item                                   (slice 2)
  slot_selected.png    slot selecionado (preenchimento dourado escuro)(slice 2)
  button.png           botão dourado                                  (slice 3)
  button_pressed.png   botão pressionado (luz e sombra trocadas)      (slice 3)
  button_danger.png    botão de perigo (vermelho)                     (slice 3)
A folha de conferência sai em art/ui_frames_dark_preview.png.

    python3 scripts/build_ui_frames_dark.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / 'art/pixellab/raw/ui'
OUT = ROOT / 'public/assets/ui/v2'
PREVIEW = ROOT / 'art/ui_frames_dark_preview.png'  # fora de public: só para conferir

hexc = lambda h: tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) + (255,)

# (arquivo cru, caixa de recorte, slice)
PIECES = {
    'panel': ('g2_panel.png', (11, 108, 70, 149), 5),
    'plate': ('g2_tab.png', (73, 85, 119, 103), 4),
    'bar': ('g2_bar.png', (39, 164, 153, 175), 5),
    'slot': ('g2_slot_kit.png', (76, 123, 88, 135), 2),
    'slot_selected': ('g2_slot_kit.png', (76, 137, 88, 149), 2),
    'button': ('g2_button.png', (28, 28, 85, 51), 3),
}

# bege da PixelLab -> dourado da paleta; e o botão de perigo
GOLD = {hexc('#9e8976'): hexc('#c89e61'), hexc('#4a3a28'): hexc('#6c4620')}
DANGER = {hexc('#9e8976'): hexc('#d9482b'), hexc('#4a3a28'): hexc('#7a2414'), hexc('#fbd594'): hexc('#f08a6c')}


def nine(img, s, k=4):
    """Refaz a peça como 9-slice limpo: cantos s x s do original, bordas e miolo a partir do meio."""
    w, h = img.size
    mx, my = w // 2, h // 2
    out = Image.new('RGBA', (2 * s + k, 2 * s + k), (0, 0, 0, 0))
    out.paste(img.crop((0, 0, s, s)), (0, 0))
    out.paste(img.crop((w - s, 0, w, s)), (s + k, 0))
    out.paste(img.crop((0, h - s, s, h)), (0, s + k))
    out.paste(img.crop((w - s, h - s, w, h)), (s + k, s + k))
    for i in range(k):
        for j in range(s):
            out.putpixel((s + i, j), img.getpixel((mx, j)))                    # topo
            out.putpixel((s + i, s + k + j), img.getpixel((mx, h - s + j)))    # base
            out.putpixel((j, s + i), img.getpixel((j, my)))                    # esquerda
            out.putpixel((s + k + j, s + i), img.getpixel((w - s + j, my)))    # direita
    for y in range(k):
        for x in range(k):
            out.putpixel((s + x, s + y), img.getpixel((mx, my)))               # miolo liso
    return out


def recolor(img, mapping):
    img = img.copy()
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            if px[x, y] in mapping:
                px[x, y] = mapping[px[x, y]]
    return img


def stretch(img, s, w, h):
    """Simula o 9-slice do CSS para a folha de conferência."""
    n = img.width
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    xs, dx, dy = [0, s, n - s, n], [0, s, w - s, w], [0, s, h - s, h]
    for i in range(3):
        for j in range(3):
            part = img.crop((xs[i], xs[j], xs[i + 1], xs[j + 1]))
            out.paste(part.resize((dx[i + 1] - dx[i], dy[j + 1] - dy[j]), Image.NEAREST), (dx[i], dy[j]))
    return out


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    made = {}
    for name, (raw, box, s) in PIECES.items():
        made[name] = (nine(Image.open(RAW / raw).convert('RGBA').crop(box), s), s)
    btn, s = made['button']
    made['button'] = (recolor(btn, GOLD), s)
    made['button_danger'] = (recolor(btn, DANGER), s)
    made['button_pressed'] = (nine(made['button'][0].transpose(Image.ROTATE_180), s), s)
    for name, (img, _) in made.items():
        img.save(OUT / f'{name}.png')

    # folha de conferência: cada peça esticada, ampliada 5x sobre o verde do mapa
    sheet = Image.new('RGBA', (140, 118), (79, 127, 59, 255))
    def put(name, size, pos):
        img, sl = made[name]
        sheet.alpha_composite(stretch(img, sl, *size), pos)
    put('panel', (64, 46), (4, 4))
    put('plate', (60, 18), (74, 4))
    put('bar', (60, 11), (74, 28))
    for i in range(3):
        put('slot', (16, 16), (4 + 20 * i, 56))
    put('slot_selected', (16, 16), (64, 56))
    put('button', (34, 14), (4, 78))
    put('button_pressed', (34, 14), (42, 78))
    put('button_danger', (34, 14), (80, 78))
    put('button', (60, 14), (4, 98))
    put('plate', (60, 14), (68, 98))
    sheet.resize((sheet.width * 5, sheet.height * 5), Image.NEAREST).save(PREVIEW)
    print('molduras em', OUT)


if __name__ == '__main__':
    main()
