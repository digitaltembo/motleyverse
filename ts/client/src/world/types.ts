// WebGLRenderingContext is just way too long
export type GL = WebGL2RenderingContext;

export type MotleyBuffers = {
  positions: WebGLBuffer | null;
  indices: WebGLBuffer | null;
  textures: WebGLBuffer | null;
  textureIndices: WebGLBuffer | null;
  normals: WebGLBuffer | null;
  vertexCount: number;
};

export type Chunk = {
  offset: Position;
  /**  Array of size CHUNK_SIZE containing BitwiseBlockData for every block in the chunk */
  data: Uint16Array;
};
/**
 * A block is described as 16-bit number, formatted like
 * 0b00000000_00000000
 *   UUUUUUUE_TTTTTTTT
 * where U is unused, E is whether the block is exposed, and T
 * is the 1 byte representation of the underlying type of the block,
 * defined as indexes into the TEXTURE_BLOCK_MAP
 **/
export type BitwiseBlockData = number;

export type Position = [
  /** X coordinate */
  number,
  /** Y coordinate (up) */
  number,
  /** Z coordinate */
  number
];
/** Polar coordinated perspective */
export type Perspective = [
  /** phi */
  number,
  /** theta */
  number
];

export type ChunkIndex = number;
export type SideInfo = {
  indexOffset: (index: ChunkIndex) => ChunkIndex;
  inChunk: (position: Position) => boolean;
  vertices: [Position, Position, Position, Position];
  norm: Position;
  textureIndex: number;
};

export type Camera = {};
