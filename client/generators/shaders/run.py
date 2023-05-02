# Generates the vertex and fragment code
import re
from pathlib import Path

BASE = Path(__file__).resolve().parent

INCLUDE_LINE = r"^#include \"(.+)\"$"
BASE_OUT = BASE / '../../src/gen/shaders'
INTERFACE_OUT = BASE_OUT / 'shaderInterface.ts'
SHADERS = [
    BASE / 'fragment/fragment.fs',
    BASE / 'vertex/vertex.vs'
]


def var_name_from_declaration(declaration):
    """
    From a declaration like `in vec4 aCoolAttr;\n`,
    extract the camelCase var name `coolAttr`
    """
    name = declaration.split(' ')[2]
    return name[1].lower() + name[2:-2]


def generate_glsl_code(filepath, skip_comments=False):
    """won't protext against infinite loops and circular dependencies
    so don't do those"""
    code = ""
    attrs = []
    unifs = []
    with open(filepath) as f:
        for line in f.readlines():
            match = re.match(INCLUDE_LINE, line)
            if match:
                new_code, new_attrs, new_unifs = generate_glsl_code(Path(filepath).parent /
                                                                    match[1], True)
                code += new_code
                attrs += new_attrs
                unifs += new_unifs
            elif not line.startswith('#') or not skip_comments:
                code += line
                # look for attributes in vertex shaders begining with the word `in`
                if filepath.suffix == '.vs' and line.startswith('in'):
                    # var name is the 3rd word, as in `in vec4 aCoolAttr;`
                    # this should be reparsed as `coolAttr`

                    attrs.append(var_name_from_declaration(line))
                if line.startswith('uniform'):
                    unifs.append(var_name_from_declaration(line))

    return code, attrs, unifs


def wrap_glsl_code(code):
    return f"""// Generated with generators/shaders/run.py

const code = `{code}`;
export default code;"""


def output_shader_code(filepath):

    glsl, attrs, uniforms = generate_glsl_code(filepath)
    ts = wrap_glsl_code(glsl)

    outfile = BASE_OUT / (filepath.parent.name + '.ts')
    with open(outfile, 'w') as f:
        f.write(ts)
    return attrs, uniforms


def output_interface_code(attrs, uniforms):
    def reglslify(name, letter): return letter + name[0].upper() + name[1:]

    attr_types = '\n  '.join([attr + ': number;' for attr in attrs])
    attr_lookups = '\n      '.join(
        [attr + ': gl.getAttribLocation(program, "' + reglslify(attr, 'a') + '"), ' for attr in attrs])
    uni_types = '\n  '.join(
        [uni + ': WebGLUniformLocation;' for uni in uniforms])
    uni_lookups = '\n    '.join(
        [uni + ': gl.getUniformLocation(program, "' + reglslify(uni, 'u') + '"),' for uni in uniforms])

    content = f"""// Generated with generators/shaders/run.py

export type AttributeLocationMap = {{
  {attr_types}
}};

export type UniformLocationMap = {{
  {uni_types}
}};

export type ProgramInfo = {{
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  canvas: HTMLCanvasElement;
  attrLocs: AttributeLocationMap;
  uniLocs: UniformLocationMap;
}};

export function getProgramInfo(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  canvas: HTMLCanvasElement
): ProgramInfo | null {{
  const uniLocs = {{
    {uni_lookups}
  }};
  if (Object.values(uniLocs).some((loc) => loc === null)) {{
    return null;
  }}
  return {{
    gl,
    program,
    canvas,
    uniLocs: uniLocs as UniformLocationMap,
    attrLocs: {{
      {attr_lookups}
    }},
  }};
}}
"""
    with open(INTERFACE_OUT, 'w') as f:
        f.write(content)


attrs = []
uniforms = []
for shader in SHADERS:
    a, u = output_shader_code(shader)
    attrs += a
    uniforms += u

output_interface_code(attrs, uniforms)
