# Generates the vertex and fragment code
import re
from pathlib import Path

BASE = Path(__file__).resolve().parent
INCLUDE_LINE = r"^#include <(.+)>$"
BASE_OUT = BASE / '../../src/gen/shaders'
SHADERS = [
    BASE / 'fragment/fragment.fs',
    BASE / 'vertex/vertex.vs'
]


def generateGlslCode(filepath):
    # won't protext against infinite loops and circular dependencies
    # so don't do those
    code = ""
    with open(filepath) as f:
        for line in f.readlines():
            match = re.match(INCLUDE_LINE, line)
            if match:
                code += generateGlslCode(match[1])
            else:
                code += line
    return code


def wrapGlslCode(code):
    return f"""// Generated with generators/shaders/run.py

const code = `{code}`;
export default code;"""


def full_pipeline(filepath):

    glsl = generateGlslCode(filepath)
    ts = wrapGlslCode(glsl)

    outfile = BASE_OUT / (filepath.parent.name + '.ts')
    with open(outfile, 'w') as f:
        f.write(ts)


for shader in SHADERS:
    full_pipeline(shader)
