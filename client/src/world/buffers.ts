import {
  BLOCK_HEIGHT,
  BLOCK_WIDTH,
  Block,
  TEXTURE_BLOCK_MAP,
} from "../gen/textures/mapping";
import { GL, MotleyBuffers } from "./types";

type Cube = {
  block: Block;
  x: number;
  y: number;
  z: number;
};

const CUBE_POSITIONS = [
  // Front face
  0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0, 1.0,

  // Back face
  0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,

  // Top face
  0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.0,

  // Bottom face
  0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0,

  // Right face
  1.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, 0.0, 1.0,

  // Left face
  0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0,
];

const CUBE_NORMALS = [
  // Front
  0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0,

  // Back
  0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0,

  // Top
  0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,

  // Bottom
  0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0,

  // Right
  1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,

  // Left
  -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
];

const CUBE_INDICES = [
  0,
  1,
  2,
  0,
  2,
  3, // front
  4,
  5,
  6,
  4,
  6,
  7, // back
  8,
  9,
  10,
  8,
  10,
  11, // top
  12,
  13,
  14,
  12,
  14,
  15, // bottom
  16,
  17,
  18,
  16,
  18,
  19, // right
  20,
  21,
  22,
  20,
  22,
  23, // left
];

const CUBE_INDEX_COUNT = 24;

export function map3<A, B>(
  arr: Array<A>,
  fn: (iter: [A, A, A]) => [B, B, B]
): Array<B> {
  const out: Array<B> = [];
  for (let i = 0; i < arr.length - 2; i += 3) {
    out.push(...fn([arr[i], arr[i + 1], arr[i + 2]]));
  }
  return out;
}

function initBuffers(gl: GL, cubes: Cube[]): MotleyBuffers {
  const [indices, vertexCount] = initIndexBuffer(gl, cubes.length);
  return {
    positions: initPositionBuffer(gl, cubes),
    textures: initTextureBuffer(gl, cubes),
    normals: initNormalBuffer(gl, cubes.length),
    indices,
    vertexCount,
  };
}

function initPositionBuffer(gl: GL, cubes: Cube[]) {
  // Create a buffer for the square's positions.
  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions for the cube.
  const positions = cubes.flatMap((cube) =>
    map3(CUBE_POSITIONS, ([x, y, z]) => [x + cube.x, y + cube.y, z + cube.z])
  );
  console.log({ positions });

  // console.log(positions);

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  return positionBuffer;
}

function initIndexBuffer(gl: GL, cubeCount: number) {
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.

  const indices = [...Array.from({ length: cubeCount })].flatMap((_, index) =>
    CUBE_INDICES.map((i) => i + index * CUBE_INDEX_COUNT)
  );

  // Now send the element array to GL
  console.log({ indices });
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );

  return [indexBuffer, indices.length] as const;
}

function initTextureBuffer(gl: GL, cubes: Cube[]) {
  const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

  const textureCoordinates = cubes.flatMap((cube) =>
    TEXTURE_BLOCK_MAP[cube.block].flatMap((texIndex, index) => {
      const x = (texIndex % BLOCK_WIDTH) / BLOCK_WIDTH;
      const dx = 1 / BLOCK_WIDTH;
      const y = Math.floor(texIndex / BLOCK_WIDTH) / BLOCK_HEIGHT;
      const dy = 1 / BLOCK_HEIGHT;
      if (index === 0 || index === 2 || index === 5) {
        // Facing me
        return [x, y, x + dx, y, x + dx, y + dy, x, y + dy];
      } else {
        // backwards
        return [x, y, x, y + dy, x + dx, y + dy, x + dx, y];
      }
    })
  );
  console.log({ textureCoordinates });

  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(textureCoordinates),
    gl.STATIC_DRAW
  );

  return textureCoordBuffer;
}

function initNormalBuffer(gl: GL, cubeCount: number) {
  const normalBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);

  const vertexNormals = [...Array.from({ length: cubeCount })].flatMap(
    () => CUBE_NORMALS
  );

  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(vertexNormals),
    gl.STATIC_DRAW
  );

  return normalBuffer;
}
export default initBuffers;
