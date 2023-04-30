import React from "react";
import styled from "styled-components";

import vertex from "../vertex/base";
import fragment from "../fragment/base";
import { ProgramInfo } from "../types";
import initBuffers from "../buffers";
import drawScene from "../scene";

const CanvasComponent = styled("canvas")`
  width: 100%;
  height: 100%;
`;

//
// creates a shader of the given type, uploads the source and
// compiles it.
//
function loadShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (shader === null) {
    throw new Error("Failed to create shader?!?");
  }
  // Send the source to the shader object
  gl.shaderSource(shader, source);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn(
      `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

console.log(vertex, fragment);
function Canvas() {
  const [canvas, setCanvas] = React.useState<HTMLCanvasElement | null>(null);

  const programInfo = React.useMemo(() => {
    if (canvas == null) {
      return null;
    }

    // Initialize the GL context
    const gl = canvas.getContext("webgl");

    // Only continue if WebGL is available and working
    if (gl === null) {
      console.warn(
        "Unable to initialize WebGL. Your browser or machine may not support it."
      );
      return null;
    }

    // Set clear color to black, fully opaque
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // Clear the color buffer with specified clear color
    gl.clear(gl.COLOR_BUFFER_BIT);
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vertex);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fragment);

    // Create the shader program

    const shaderProgram = gl.createProgram();
    if (
      shaderProgram === null ||
      vertexShader === null ||
      fragmentShader === null
    ) {
      return;
    }
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    // If creating the shader program failed, console.warn

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      console.warn(
        `Unable to initialize the shader program: ${gl.getProgramInfoLog(
          shaderProgram
        )}`
      );
      return null;
    }
    const programInfo: ProgramInfo = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      },
      canvas,
      gl,
      uniformLocations: {
        projectionMatrix: gl.getUniformLocation(
          shaderProgram,
          "uProjectionMatrix"
        ),
        modelViewMatrix: gl.getUniformLocation(
          shaderProgram,
          "uModelViewMatrix"
        ),
      },
    };

    const buffers = initBuffers(gl);

    // Draw the scene
    drawScene(programInfo, buffers);
    return programInfo;
  }, [canvas]);

  return <CanvasComponent ref={setCanvas} />;
}

export default Canvas;
