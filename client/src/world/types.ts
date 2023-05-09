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

export type Chunk = Uint16Array;
export type BitwiseBlockData = number;

export type Position = [number, number, number];
export type ChunkIndex = number;
export type SideInfo = {
  indexOffset: (index: ChunkIndex) => ChunkIndex;
  inChunk: (position: Position) => boolean;
  vertices: [Position, Position, Position, Position];
  norm: Position;
  textureIndex: number;
};
