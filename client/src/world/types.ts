export type ProgramInfo = {
  program: WebGLProgram;
  canvas: HTMLCanvasElement;
  gl: WebGLRenderingContext;
  attribLocations: Record<string, number>;
  uniformLocations: Record<string, WebGLUniformLocation | null>;
};
// WebGLRenderingContext is just way too long
export type GL = WebGLRenderingContext;

export type MotleyBuffers = {
  position: WebGLBuffer | null;
};
