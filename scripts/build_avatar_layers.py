"""Prepara as camadas do avatar a partir dos recortes em art/avatar-source/.

Os recortes vieram de uma folha gerada por IA: transparência imprecisa, tamanhos e posições diferentes
e chapéus/roupas partidos entre dois arquivos. Este script:
  1. limpa a transparência (alpha 0 ou 255);
  2. junta os recortes de cada linha e separa cada item (chapéus e roupas);
  3. alinha tudo numa tela comum de CANVAS x CANVAS (a cabeça é a referência);
  4. extrai a barba comparando cada cabeça com a versão sem barba;
  5. gera máscaras de pele e de íris, usadas no front para trocar tom de pele e cor dos olhos.
Saída: public/assets/avatar/*.png e public/assets/avatar/layers.json

Uso: python scripts/build_avatar_layers.py   (precisa de pillow e numpy)
"""
import colorsys
import json
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'art', 'avatar-source')
OUT = os.path.join(ROOT, 'public', 'assets', 'avatar')

CANVAS = 232
HEAD_CX = 116  # centro horizontal da cabeça na tela
HEAD_TOP = 64  # topo da careca na tela (sobra espaço para chapéu e coque)

FACES = {'happy': 'feliz', 'calm': 'calmo', 'wink': 'piscando', 'surprised': 'surpreso', 'sleepy': 'sonolento'}
BEARDS = {'stubble': 'stubble_leve', 'mustache': 'bigode', 'goatee': 'cavanhaque', 'full': 'barba_cheia'}
HAIRS = {'short': 'curto_fr estilo_frente', 'messy': 'curto_espigado', 'long': 'longo_partido_centro', 'ponytail': 'rabo_cavalo', 'bun': 'coque', 'buzz': 'buzz_cut'}
HAT_ORDER = ['straw', 'cap', 'beanie', 'cowboy']  # na ordem em que aparecem na linha
OUTFIT_ORDER = ['overalls_blue', 'overalls_red', 'shirt_green', 'shirt_purple', 'coat_brown']  # a listrada veio cortada: fica de fora


def load(path):
    im = np.array(Image.open(path).convert('RGBA')).astype(np.uint8)
    im[..., 3] = np.where(im[..., 3] > 128, 255, 0)  # transparência limpa
    im[im[..., 3] == 0] = 0
    return im


def hsv(im):
    rgb = im[..., :3].astype(float) / 255
    mx, mn = rgb.max(-1), rgb.min(-1)
    d = mx - mn
    sat = np.where(mx > 0, d / np.maximum(mx, 1e-6), 0)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.zeros_like(mx)
    m = d > 1e-6
    rr = m & (mx == r)
    gg = m & (mx == g) & ~rr
    bb = m & ~rr & ~gg
    h[rr] = ((g - b)[rr] / d[rr]) % 6
    h[gg] = (b - r)[gg] / d[gg] + 2
    h[bb] = (r - g)[bb] / d[bb] + 4
    return h * 60, sat, mx


def skin_bright(im):
    """Pele bem iluminada (usada como âncora: orelhas, pescoço)."""
    r, g, b = (im[..., i].astype(float) / 255 for i in range(3))
    return (im[..., 3] > 0) & (r > 0.85) & (g > 0.55) & (g < 0.85) & (b > 0.35) & (b < 0.7)


def skin_any(im):
    """Qualquer tom de pele (luz, base, sombra e o contorno avermelhado)."""
    h, s, v = hsv(im)
    return (im[..., 3] > 0) & (h >= 5) & (h <= 40) & (s > 0.28) & (v > 0.32)


def bbox(mask):
    ys, xs = np.nonzero(mask)
    return xs.min(), ys.min(), xs.max(), ys.max()


def place(im, dx, dy, scale=1.0):
    """Coloca a imagem na tela comum, deslocada (e escalada) — tudo em pixel inteiro."""
    if abs(scale - 1) > 0.01:
        h, w = im.shape[:2]
        im = np.array(Image.fromarray(im).resize((round(w * scale), round(h * scale)), Image.NEAREST))
    out = np.zeros((CANVAS, CANVAS, 4), np.uint8)
    h, w = im.shape[:2]
    x0, y0 = int(round(dx)), int(round(dy))
    sx0, sy0 = max(0, -x0), max(0, -y0)
    tx0, ty0 = max(0, x0), max(0, y0)
    ww = min(w - sx0, CANVAS - tx0)
    hh = min(h - sy0, CANVAS - ty0)
    if ww > 0 and hh > 0:
        out[ty0:ty0 + hh, tx0:tx0 + ww] = im[sy0:sy0 + hh, sx0:sx0 + ww]
    return out


def align_head(im):
    """Alinha uma cabeça pela pele: centro horizontal e topo da careca."""
    x0, y0, x1, y1 = bbox(skin_bright(im))
    return place(im, HEAD_CX - (x0 + x1) / 2, HEAD_TOP - y0)


def split_row(folder, names):
    """Junta os recortes de uma linha (eram fatias seguidas da folha) e separa os itens por colunas vazias."""
    manifest = json.load(open(os.path.join(SRC, 'manifest.json'), encoding='utf8'))
    items = sorted((m for m in manifest if m['arquivo'].startswith(folder)), key=lambda m: m['coluna'])
    imgs = [load(os.path.join(SRC, m['arquivo'])) for m in items]
    h = max(i.shape[0] for i in imgs)
    strip = np.concatenate([np.pad(i, ((0, h - i.shape[0]), (0, 0), (0, 0))) for i in imgs], axis=1)
    cols = (strip[..., 3] > 0).sum(0) > 2  # coluna com desenho
    objs, start = [], None
    for x, filled in enumerate(list(cols) + [False]):
        if filled and start is None:
            start = x
        elif not filled and start is not None:
            if x - start > 40:  # ignora sobras pequenas
                objs.append(strip[:, start:x])
            start = None
    print(folder, 'itens encontrados:', len(objs), [o.shape[1] for o in objs])
    return dict(zip(names, objs))


def largest_blob(mask):
    """Maior grupo de pixels vizinhos (4 direções) da máscara."""
    seen = np.zeros_like(mask)
    best = []
    for sy, sx in zip(*np.nonzero(mask)):
        if seen[sy, sx]:
            continue
        stack, blob = [(sy, sx)], []
        seen[sy, sx] = True
        while stack:
            y, x = stack.pop()
            blob.append((y, x))
            for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= ny < mask.shape[0] and 0 <= nx < mask.shape[1] and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    stack.append((ny, nx))
        if len(blob) > len(best):
            best = blob
    out = np.zeros_like(mask)
    for y, x in best:
        out[y, x] = True
    return out


def save(name, im):
    Image.fromarray(im).save(os.path.join(OUT, name + '.png'))


def mask_png(name, mask):
    m = np.zeros((CANVAS, CANVAS, 4), np.uint8)
    m[mask] = (255, 255, 255, 255)
    save(name, m)


def main():
    os.makedirs(OUT, exist_ok=True)
    layout = {'canvas': CANVAS, 'faces': {}, 'beards': {}, 'hairs': {}, 'hats': {}, 'outfits': {}}

    # ---------- Rostos (cabeça inteira com a expressão) ----------
    faces = {k: align_head(load(os.path.join(SRC, '03_expressoes', v + '.png'))) for k, v in FACES.items()}
    ref = faces['happy']
    hx0, hy0, hx1, hy1 = bbox(skin_bright(ref))
    # caixas dos olhos e da boca (iguais para todos os rostos, já alinhados)
    eye_y0, eye_y1 = hy0 + int((hy1 - hy0) * 0.40), hy0 + int((hy1 - hy0) * 0.62)
    mouth_y0, mouth_y1 = hy0 + int((hy1 - hy0) * 0.72), hy0 + int((hy1 - hy0) * 0.90)
    yy, xx = np.mgrid[0:CANVAS, 0:CANVAS]
    eye_box = (yy >= eye_y0) & (yy <= eye_y1) & (xx >= hx0 + 18) & (xx <= hx1 - 18)
    mouth_box = (yy >= mouth_y0) & (yy <= mouth_y1) & (xx >= HEAD_CX - 22) & (xx <= HEAD_CX + 22)
    for k, im in faces.items():
        save('face_' + k, im)
        h, s, v = hsv(im)
        # na faixa dos olhos, só a pele clara entra (íris, cílios e o branco dos olhos ficam de fora)
        eye_px = eye_box & ((v < 0.6) | (s < 0.22))
        skin = skin_any(im) & ~eye_px & ~(mouth_box & (h < 14))  # boca (mais vermelha) fica de fora
        iris = eye_box & (im[..., 3] > 0) & (h >= 8) & (h <= 45) & (s > 0.3) & (v > 0.18) & (v < 0.75)
        mask_png('face_%s_skin' % k, skin)
        mask_png('face_%s_iris' % k, iris)
        layout['faces'][k] = {'image': 'face_' + k, 'skin': 'face_%s_skin' % k, 'iris': 'face_%s_iris' % k}
    layout['head'] = {'x0': int(hx0), 'y0': int(hy0), 'x1': int(hx1), 'y1': int(hy1)}

    # ---------- Barbas: diferença entre a cabeça com barba e a sem barba ----------
    plain = align_head(load(os.path.join(SRC, '04_barbas', 'sem_barba.png')))
    for k, v in BEARDS.items():
        im = align_head(load(os.path.join(SRC, '04_barbas', v + '.png')))
        diff = np.abs(im[..., :3].astype(int) - plain[..., :3].astype(int)).sum(-1)
        h, s, val = hsv(im)
        beard = (im[..., 3] > 0) & (diff > 60) & (val < 0.62)  # só o que mudou e é escuro (pelos)
        if k == 'stubble':
            beard = (im[..., 3] > 0) & (diff > 25) & (yy > hy0 + (hy1 - hy0) * 0.55)
        out = np.zeros_like(im)
        out[beard] = im[beard]
        save('beard_' + k, out)
        layout['beards'][k] = {'image': 'beard_' + k}

    # ---------- Cabelos: alinhados pelas orelhas ----------
    ref_skin = skin_bright(ref)
    ears_ref = ref_skin & ((xx < hx0 + 14) | (xx > hx1 - 14))
    ey_ref = np.nonzero(ears_ref)[0].mean()
    short_top = None
    for k, v in HAIRS.items():
        raw = load(os.path.join(SRC, '02_cabelo', v + '.png'))
        ears = skin_bright(raw)
        if ears.sum() > 40:
            ex0, _, ex1, _ = bbox(ears)
            ey = np.nonzero(ears)[0].mean()
            dx = HEAD_CX - (ex0 + ex1) / 2
            dy = ey_ref - ey
        else:  # comprido: orelhas escondidas; centraliza e usa o topo do cabelo curto
            x0, y0, x1, y1 = bbox(raw[..., 3] > 0)
            dx = HEAD_CX - (x0 + x1) / 2
            dy = short_top - y0
        im = place(raw, dx, dy)
        im[skin_bright(im) | skin_any(im) & (hsv(im)[2] > 0.75)] = 0  # tira as orelhas (já estão no rosto)
        if k == 'short':
            short_top = bbox(im[..., 3] > 0)[1]
        if k == 'long':
            bottom = bbox(im[..., 3] > 0)[3]
            for x in range(CANVAS):
                cut = bottom - 4 - (x * 7) % 13  # mechas desencontradas
                im[cut:, x] = 0
        save('hair_' + k, im)
        layout['hairs'][k] = {'image': 'hair_' + k}
        # elástico (rabo de cavalo e coque): aglomerado de vermelho vivo; não recebe a cor do cabelo.
        # Reflexos avermelhados soltos no cabelo não entram (precisam de vizinhos vermelhos).
        r, g, b = (im[..., i].astype(int) for i in range(3))
        red = (im[..., 3] > 0) & (r > 150) & (g < 90) & (b < 90)
        near = sum(np.roll(np.roll(red, dy, 0), dx, 1) for dy in (-1, 0, 1) for dx in (-1, 0, 1))
        tie = largest_blob(red & (near >= 4)) if k in ('ponytail', 'bun') else None
        if tie is not None and tie.sum() > 15:
            mask_png('hair_%s_keep' % k, tie)
            layout['hairs'][k]['keep'] = 'hair_%s_keep' % k

    # ---------- Chapéus e roupas: reconstruídos e encaixados na cabeça ----------
    head_w = hx1 - hx0
    hats = split_row('05_chapeus_acessorios', HAT_ORDER)
    # quanto a base do chapéu fica abaixo do topo da cabeça (ajuste visual, em fração da altura da cabeça)
    hat_base = {'straw': 0.30, 'cap': 0.30, 'beanie': 0.32, 'cowboy': 0.30}
    for k, raw in hats.items():
        x0, y0, x1, y1 = bbox(raw[..., 3] > 0)
        dx = HEAD_CX - (x0 + x1) / 2
        dy = hy0 + (hy1 - hy0) * hat_base[k] - y1
        save('hat_' + k, place(raw, dx, dy))
        layout['hats'][k] = {'image': 'hat_' + k}

    outfits = split_row('06_roupas', OUTFIT_ORDER)
    for k, raw in outfits.items():
        x0, y0, x1, y1 = bbox(raw[..., 3] > 0)
        neck = skin_bright(raw)
        nx0, ny0, nx1, _ = bbox(neck) if neck.sum() > 30 else (x0, y0, x1, y0)
        dx = HEAD_CX - (x0 + x1) / 2
        dy = hy1 - 18 - y0  # a gola começa um pouco acima do queixo (o pescoço fica atrás da cabeça)
        im = place(raw, dx, dy)
        save('outfit_' + k, im)
        mask_png('outfit_%s_skin' % k, skin_any(im) & (hsv(im)[2] > 0.55))
        layout['outfits'][k] = {'image': 'outfit_' + k, 'skin': 'outfit_%s_skin' % k}

    json.dump(layout, open(os.path.join(OUT, 'layers.json'), 'w'), indent=2)
    print('ok:', OUT)


if __name__ == '__main__':
    main()
