import { ChunkIndex, Position, SideInfo, Chunk } from "../types";
import {
  CROSS_SECTION_SIZE,
  DEPTH,
  WIDTH,
  HEIGHT,
  BLOCK_TYPE_FILTER,
  AIR,
} from "./chunk";

export const SIDE_MAP = {
  FRONT: {
    indexOffset: (index: ChunkIndex) => {
      // console.log("checking z", index, index + CROSS_SECTION_SIZE);
      return index + CROSS_SECTION_SIZE;
    },
    inChunk: ([_1, _2, z]: Position) => z < DEPTH - 1,
    vertices: [
      [0, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
    ],
    norm: [0, 0, 1],
    textureIndex: 0,
  } as SideInfo,
  BACK: {
    indexOffset: (index: ChunkIndex) => index - CROSS_SECTION_SIZE,
    inChunk: ([_1, _2, z]: Position) => z > 0,
    vertices: [
      [0, 0, 0],
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
    ],
    norm: [0, 0, -1],
    textureIndex: 1,
  } as SideInfo,
  TOP: {
    indexOffset: (index: ChunkIndex) => index + WIDTH,
    inChunk: ([_1, y, _2]: Position) => y < HEIGHT - 1,
    vertices: [
      [0, 1, 0],
      [0, 1, 1],
      [1, 1, 1],
      [1, 1, 0],
    ],
    norm: [0, 1, 0],
    textureIndex: 2,
  } as SideInfo,
  BOTTOM: {
    indexOffset: (index: ChunkIndex) => index - WIDTH,
    inChunk: ([_1, y, _2]: Position) => y > 0,
    vertices: [
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 1],
      [0, 0, 1],
    ],
    norm: [0, -1, 0],
    textureIndex: 3,
  } as SideInfo,
  RIGHT: {
    indexOffset: (index: ChunkIndex) => index + 1,
    inChunk: ([x, _1, _2]: Position) => x < WIDTH - 1,
    vertices: [
      [1, 0, 0],
      [1, 0, 1],
      [1, 1, 1],
      [1, 1, 0],
    ],
    norm: [1, 0, 0],
    textureIndex: 4,
  } as SideInfo,
  LEFT: {
    indexOffset: (index: ChunkIndex) => index - 1,
    inChunk: ([x, _1, _2]: Position) => x > 0,
    vertices: [
      [0, 0, 0],
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
    norm: [-1, 0, 0],
    textureIndex: 5,
  } as SideInfo,
};
export const SIDES: SideInfo[] = Object.values(SIDE_MAP);

export type SideName = keyof typeof SIDE_MAP;
export function sideExposed(side: SideInfo, chunk: Chunk, index: ChunkIndex) {
  return (chunk.data[side.indexOffset(index)] & BLOCK_TYPE_FILTER) === AIR;
}
