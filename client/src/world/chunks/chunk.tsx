import {
  ATLAS_HEIGHT,
  ATLAS_WIDTH,
  BLOCK_HEIGHT,
  BLOCK_WIDTH,
  BlockType,
  TEXTURE_BLOCK_MAP,
  TEXTURE_SIZE,
} from "../../gen/textures/mapping";
import { raytrace } from "../../utils/raytrace";
import { BitwiseBlockData, Chunk, GL, MotleyBuffers, Position } from "../types";
import { perlin2 } from "./noise";
import { SIDES, sideExposed } from "./sides";

/** Number of blocks wide a chunk is */
export const WIDTH = 80;
/** Number of blocks deep a chunk is (not vertical) */
export const DEPTH = WIDTH;
/** Number of blocks high a chunk is (vertical) */
export const HEIGHT = 20;
/** Number of voxels in a chunk */
export const CHUNK_SIZE = WIDTH * HEIGHT * DEPTH;
/** Number of voxels in a slice of a chunk */
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
  block: BlockType;
};

export function createChunk(offset: Position = [0, 0, 0]): Chunk {
  return {
    offset,
    data: new Uint16Array(CHUNK_SIZE),
  };
}

export const BLOCK_TYPE_FILTER = 0xff;
export const EXPOSED_FILTER = 0x1 << 8;
export const AIR = 0xff;

const TYPE_TO_BLOCK = Object.fromEntries(
  Object.keys(TEXTURE_BLOCK_MAP).map((blockName, index) => [
    blockName as BlockType,
    index,
  ])
) as Record<BlockType, BitwiseBlockData>;

const BLOCK_TO_TYPE: Record<BitwiseBlockData, BlockType> = Object.fromEntries(
  Object.entries(TYPE_TO_BLOCK).map(([type, block]) => [
    block,
    type as BlockType,
  ])
);

function blockFromTexture(block: BlockType): BitwiseBlockData {
  return TYPE_TO_BLOCK[block];
}

function blockType(block: BitwiseBlockData) {
  return BLOCK_TO_TYPE[block & BLOCK_TYPE_FILTER] as BlockType;
}
function blockTexture(block: BitwiseBlockData): number[] {
  return TEXTURE_BLOCK_MAP[blockType(block)];
}
function exposed(block: BitwiseBlockData) {
  return Boolean(block & EXPOSED_FILTER);
}
function chunkIndex([x, y, z]: Position) {
  return x + y * WIDTH + z * CROSS_SECTION_SIZE;
}
function positionInChunk([x, y, z]: Position) {
  return x >= 0 && y >= 0 && z >= 0 && x < WIDTH && y < HEIGHT && z < DEPTH;
}

function calculateIsExposed({ data: chunk }: Chunk, [x, y, z]: Position) {
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

export function generateChunk(offset: Position = [0, 0, 0]) {
  const chunk = createChunk(offset);
  for (let cz = 0; cz < DEPTH; cz++) {
    for (let cx = 0; cx < WIDTH; cx++) {
      const x = cx + offset[0];
      const z = cz + offset[1];
      const noise = ((perlin2([x / 12, z / 12]) + 1) * HEIGHT) / 2;
      for (let y = 0; y < HEIGHT; y++) {
        const index = chunkIndex([cx, y, cz]);
        if (y < noise - 1) {
          chunk.data[index] = blockFromTexture("dirt");
        } else if (y < noise) {
          chunk.data[index] = blockFromTexture("grass");
        } else {
          chunk.data[index] = AIR;
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
      chunk.data[index] = chunk.data[index] | EXPOSED_FILTER;
    }
  });
  return chunk;
}
export function chunkArrays(chunks: Chunk[]) {
  const normals: number[] = [];
  const textures: number[] = [];
  const textureIndices: number[] = [];
  const positions: number[] = [];
  const indices: number[] = [];
  for (const chunk of chunks) {
    chunkIter(([x, y, z], index) => {
      const block: BitwiseBlockData = chunk.data[index];
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
                x1 + x + chunk.offset[0],
                y1 + y + chunk.offset[1],
                z1 + z + chunk.offset[2],
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

            const tx = texIndex % BLOCK_WIDTH;
            const ty = Math.floor(texIndex / BLOCK_WIDTH);
            const tx0 = (tx * TEXTURE_SIZE) / ATLAS_WIDTH;
            const tx1 = ((tx + 1) * TEXTURE_SIZE) / ATLAS_WIDTH;
            const ty0 = (ty * TEXTURE_SIZE) / ATLAS_HEIGHT;
            const ty1 = ((ty + 1) * TEXTURE_SIZE) / ATLAS_HEIGHT;

            textures.push(0, 0, 1, 0, 1, 1, 0, 1);
            textureIndices.push(texIndex, texIndex, texIndex, texIndex);
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
  }
  const bufs = {
    positions,
    normals,
    textures,
    indices,
    textureIndices,
  };
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
    isElementArray ? new Uint32Array(arr) : new Float32Array(arr),
    gl.STATIC_DRAW
  );
  return buf;
}

export function highlightVoxel(
  chunk: Chunk,
  origin: Position,
  [phi1, theta1]: [number, number]
) {
  const theta = theta1 + Math.PI / 2;
  const phi = phi1 - Math.PI / 2;
  const s = Math.sin(theta);
  const cartesianDirection = [
    s * Math.cos(phi),
    Math.cos(theta),
    s * Math.sin(phi),
  ];
  console.log("Drawing with", origin, [phi, theta], cartesianDirection);
  const vs: Position[] = [];
  raytrace(
    origin,
    cartesianDirection,
    (pos) => {
      const chunkPos = pos.map(
        (p, i) => Math.floor(p) + chunk.offset[i]
      ) as Position;
      vs.push(pos as Position, chunkPos);
      if (
        positionInChunk(chunkPos) &&
        calculateIsExposed(chunk, chunkPos) &&
        (chunk.data[chunkIndex(chunkPos)] & AIR) !== AIR
      ) {
        console.log(
          "Trying to draw",
          pos,
          chunkPos,
          SIDES.map(({ inChunk }) => !inChunk(chunkPos))
        );
        chunk.data[chunkIndex(chunkPos)] =
          blockFromTexture("sand") | EXPOSED_FILTER;
        return false;
      }
      return true;
    },
    100
  );
}
export function chunkBuffers(gl: GL, chunks: Chunk[]): MotleyBuffers {
  const { positions, textures, textureIndices, normals, indices } =
    chunkArrays(chunks);
  return {
    positions: makeGlBuffer(gl, positions, false),
    textures: makeGlBuffer(gl, textures, false),
    textureIndices: makeGlBuffer(gl, textureIndices, false),
    normals: makeGlBuffer(gl, normals, false),
    indices: makeGlBuffer(gl, indices, true),
    vertexCount: indices.length,
  };
}
