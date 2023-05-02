// WebGLRenderingContext is just way too long
export type GL = WebGLRenderingContext;

export type MotleyBuffers = {
  position: WebGLBuffer | null;
  color: WebGLBuffer | null;
  indices: WebGLBuffer | null;
  textures: WebGLBuffer | null;
  normals: WebGLBuffer | null;
};
