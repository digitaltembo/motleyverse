import {
  BLOCK_HEIGHT,
  BLOCK_WIDTH,
  Block,
  TEXTURE_BLOCK_MAP,
} from "../../gen/textures/mapping";
import { BitwiseBlockData, Chunk, GL, MotleyBuffers, Position } from "../types";
import { perlin2 } from "./noise";
import { SIDES, sideExposed } from "./sides";

export const WIDTH = 50;
export const DEPTH = 50;
export const HEIGHT = 20;
export const CHUNK_SIZE = WIDTH * HEIGHT * DEPTH;
export const CROSS_SECTION_SIZE = WIDTH * HEIGHT;

// Block data is
// 8 bits block type
// 1 bit exposed
// 1 bit transparent
// 1 bit outside
// 1 bit additional data
// 3 bits direction (optional?)
// 4 bits power

type UnpackedBlock = {
  rawBlock: number;
  exposed: boolean;
};

type ParsedBlock = {
  block: Block;
};

export function createChunk() {
  return new Uint16Array(CHUNK_SIZE);
}

export const BLOCK_TYPE_FILTER = 0xff;
export const EXPOSED_FILTER = 0x1 << 8;
export const AIR = 0xff;

function blockFromTexture(block: Block) {
  return Object.keys(TEXTURE_BLOCK_MAP).indexOf(block);
}

function blockType(block: BitwiseBlockData) {
  return Object.keys(TEXTURE_BLOCK_MAP)[block & BLOCK_TYPE_FILTER] as Block;
}
function blockTexture(block: BitwiseBlockData): number[] {
  return Object.values(TEXTURE_BLOCK_MAP)[block & BLOCK_TYPE_FILTER];
}
function exposed(block: BitwiseBlockData) {
  return Boolean(block & EXPOSED_FILTER);
}
function chunkIndex([x, y, z]: Position) {
  return x + y * WIDTH + z * CROSS_SECTION_SIZE;
}

function calculateIsExposed(chunk: Chunk, [x, y, z]: Position) {
  if (SIDES.some(({ inChunk }) => !inChunk([x, y, z]))) {
    return true;
  }

  const index = chunkIndex([x, y, z]);

  if ((chunk[index] & BLOCK_TYPE_FILTER) !== AIR) {
    return SIDES.some(
      ({ indexOffset }) =>
        (chunk[indexOffset(index)] & BLOCK_TYPE_FILTER) === AIR
    );
  }
  return false;
}
// Iterate over blocks in chunk
// left to right, bottom to top, back to front
function chunkIter(fn: (position: Position, index: number) => void) {
  let index = 0;
  for (let z = 0; z < DEPTH; z++) {
    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        fn([x, y, z], index);
        index++;
      }
    }
  }
}

export function generateChunk() {
  const chunk = new Uint16Array(CHUNK_SIZE);
  for (let z = 0; z < DEPTH; z++) {
    for (let x = 0; x < WIDTH; x++) {
      const noise = ((perlin2([x / 12, z / 12]) + 1) * HEIGHT) / 2;
      for (let y = 0; y < HEIGHT; y++) {
        const index = chunkIndex([x, y, z]);
        if (y < noise - 1) {
          chunk[index] = blockFromTexture("mud");
        } else if (y < noise) {
          chunk[index] = blockFromTexture("moss");
        } else {
          chunk[index] = AIR;
        }
      }
    }
  }
  // chunkIter(([x, y, z], index) => {
  //   // if (x === 0) {
  //   //   chunk[index] = 0;
  //   // } else if (y === 0) {
  //   //   chunk[index] = 1;
  //   // } else if (z === 0) {
  //   //   chunk[index] = 2;
  //   // } else {
  //   //   chunk[index] = AIR;
  //   // }
  //   if (Math.random() > 0.5) {
  //     // if (y > HEIGHT - Math.random() * 2 - 2) {
  //     chunk[index] = AIR;
  //   } else {
  //     chunk[index] = Math.floor(
  //       Math.random() * Object.keys(TEXTURE_BLOCK_MAP).length
  //     );
  //   }
  //   // console.log(chunk[index]);
  // });
  chunkIter((position, index) => {
    if (calculateIsExposed(chunk, position)) {
      chunk[index] = chunk[index] | EXPOSED_FILTER;
    }
  });
  return chunk;
}
export function chunkArrays(chunk: Chunk) {
  const normals: number[] = [];
  const textures: number[] = [];
  const positions: number[] = [];
  const indices: number[] = [];
  chunkIter(([x, y, z], index) => {
    const block: BitwiseBlockData = chunk[index];
    if ((block & BLOCK_TYPE_FILTER) !== AIR && exposed(block)) {
      const texIndices = blockTexture(block);
      SIDES.forEach((sideInfo) => {
        if (
          !sideInfo.inChunk([x, y, z]) ||
          sideExposed(sideInfo, chunk, index)
        ) {
          const basePositionIndex = positions.length / 3;
          positions.push(
            ...sideInfo.vertices.flatMap(([x1, y1, z1]) => [
              x1 + x,
              y1 + y,
              z1 + z,
            ])
          );
          normals.push(
            ...[
              sideInfo.norm,
              sideInfo.norm,
              sideInfo.norm,
              sideInfo.norm,
            ].flat()
          );
          const texIndex = texIndices[sideInfo.textureIndex];

          const tx = (texIndex % BLOCK_WIDTH) / BLOCK_WIDTH;
          const tdx = 1 / BLOCK_WIDTH;
          const ty = Math.floor(texIndex / BLOCK_WIDTH) / BLOCK_HEIGHT;
          const tdy = 1 / BLOCK_HEIGHT;
          textures.push(tx, ty, tx + tdx, ty, tx + tdx, ty + tdy, tx, ty + tdy);
          indices.push(
            basePositionIndex,
            basePositionIndex + 1,
            basePositionIndex + 2,
            basePositionIndex,
            basePositionIndex + 2,
            basePositionIndex + 3
          );
        }
      });
    }
  });
  const bufs = {
    positions,
    normals,
    textures,
    indices,
  };
  console.log(bufs);
  return bufs;
}

/**
 * Makes and sends a buffer to the gpu
 * @param gl GL context
 * @param arr JS array to pass to the gpu
 * @param isElementArray if try, pass a uint16 array of elements instead of a float32 array
 * @returns gl buffer
 */
function makeGlBuffer(gl: GL, arr: number[], isElementArray: boolean) {
  const buf = gl.createBuffer();
  const bufType = isElementArray ? gl.ELEMENT_ARRAY_BUFFER : gl.ARRAY_BUFFER;
  // Select the buffer as the one to apply buffer
  // operations to from here out.
  gl.bindBuffer(bufType, buf);
  gl.bufferData(
    bufType,
    isElementArray ? new Uint16Array(arr) : new Float32Array(arr),
    gl.STATIC_DRAW
  );
  return buf;
}
export function chunkBuffers(gl: GL, chunk: Chunk): MotleyBuffers {
  const { positions, textures, normals, indices } = chunkArrays(chunk);
  return {
    positions: makeGlBuffer(gl, positions, false),
    textures: makeGlBuffer(gl, textures, false),
    normals: makeGlBuffer(gl, normals, false),
    indices: makeGlBuffer(gl, indices, true),
    vertexCount: indices.length,
  };
}
