from pathlib import Path
import os
from collections import namedtuple
from PIL import Image

BASE = Path(__file__).resolve().parent
BLOCK_DIR = BASE / 'blocks'
SIZE = 24
PUBLIC_OUT_DIR = BASE / '../../public/textures'
CODE_OUT_FILE = BASE / "../../src/gen/textures/mapping.ts"

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
    width, height = [1, len(textures)]  # texture_size(len(textures))

    out = Image.new('RGB', (width * SIZE, height * SIZE))
    for x in range(0, width):
        for y in range(0, height):
            out.paste(Image.open(
                textures[x + y * width]), (x * SIZE, y * SIZE))
    out.save(PUBLIC_OUT_DIR / (name + '.png'))
    return width, height


def texture_mapping(blocks, block_textures, item_textures):
    width, height = mega_texture("blocks", block_textures)

    code = ""
    code += f"export const BLOCK_WIDTH = {width};\n"
    code += f"export const BLOCK_HEIGHT = {height};\n"
    code += f"export const ATLAS_WIDTH = {width * SIZE};\n"
    code += f"export const ATLAS_HEIGHT = {height * SIZE};\n"
    code += f"export const TEXTURE_SIZE = {SIZE};\n"

    code += "export const TEXTURE_BLOCK_MAP = {\n"
    for block in blocks:
        code += f'  "{block.name}": [{block.front},{block.back},{block.top},{block.bottom},{block.right},{block.left}],\n'
    code += "};\n"
    code += "export type Block = keyof typeof TEXTURE_BLOCK_MAP;"

    with open(CODE_OUT_FILE, 'w') as f:
        f.write(code)


blocks, block_textures, item_textures = find_blocks()

texture_mapping(blocks, block_textures, item_textures)
