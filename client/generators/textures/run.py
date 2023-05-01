from pathlib import Path
import os
from collections import namedtuple
from PIL import Image

BASE = Path(__file__).resolve().parent
BLOCK_DIR = BASE / 'blocks'
SIZE = 24
OUT_DIR = BASE / '../../public/textures'

blocks = []

ATTRS = ['name', 'top', 'left', 'front', 'right', 'back', 'bottom', 'item']
Block = namedtuple('Block', ATTRS, defaults=[False for _ in ATTRS])


def add_texture(file, block_textures, item_textures, is_icon=False):
    if is_icon:
        index = -len(item_textures) - 1
        item_textures.append(file)
        return index
    else:
        index = len(block_textures)
        block_textures.append(file)
        return index


def monotexture(direntry, block_textures, item_textures):
    texture_id = add_texture(direntry.path, block_textures, item_textures)
    # todo - render icons
    return Block(*[Path(direntry.path).stem if attr == 'name' else texture_id for attr in ATTRS])


def parse_texture(block, direntry, block_textures, item_textures):
    path = Path(direntry)
    block = block._replace(name=path.parent.name)
    texture_id = add_texture(
        direntry.path, block_textures, item_textures)
    for side in path.stem.split('+'):
        if side == 'sides':
            block = block._replace(
                left=texture_id,
                right=texture_id,
                front=texture_id,
                back=texture_id
            )
        elif side in ATTRS:
            block = block._replace(**{side: texture_id})
        else:
            print('Error: Invalid texture name', direntry.path)
    return block


def build_block(direntry, block_textures, item_textures):
    if direntry.is_dir():
        b = Block()
        for entry in os.scandir(direntry.path):
            b = parse_texture(b, entry, block_textures, item_textures)
        return b
    else:
        return monotexture(direntry, block_textures, item_textures)


def find_blocks():
    blocks = []
    block_textures = []
    item_textures = []
    for entry in os.scandir(BLOCK_DIR):
        blocks.append(build_block(entry, block_textures, item_textures))
    return blocks, block_textures, item_textures


def prime_factors(n):
    i = 2
    factors = []
    while i * i <= n:
        if n % i:
            i += 1
        else:
            n //= i
            factors.append(i)
    if n > 1:
        factors.append(n)
    return factors


def texture_size(image_count):
    factors = prime_factors(image_count)
    if len(factors) == 1:
        return (image_count, 1)
    factors.reverse()
    width = height = 1
    for factor in factors:
        if width <= height:
            width *= factor
        else:
            height *= factor
    return (width, height)


def mega_texture(name, textures):
    width, height = texture_size(len(textures))

    out = Image.new('RGB', (width * SIZE, height * SIZE))
    for x in range(0, width):
        for y in range(0, height):
            out.paste(Image.open(
                textures[x + y * width]), (x * SIZE, y * SIZE))
    out.save(OUT_DIR / (name + '.png'))


blocks, block_textures, item_textures = find_blocks()

mega_texture('blocks', block_textures)

print(blocks)
print('---------------')
print(len(block_textures))
