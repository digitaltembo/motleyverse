import React from "react";
import styled from "styled-components";

import vertex from "../../gen/shaders/vertex";
import fragment from "../../gen/shaders/fragment";
import { GL, ProgramInfo } from "../types";
import initBuffers from "../buffers";
import drawScene from "../scene";
import { mat4 } from "gl-matrix";

const CanvasComponent = styled("canvas")`
  width: 100%;
  height: 100%;
  image-rendering: crisp-edges;
`;

type Axis = [number, number, number];
const X_AXIS: Axis = [1, 0, 0];
const Y_AXIS: Axis = [0, 1, 0];
const Z_AXIS: Axis = [0, 0, 1];
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

function defaultView() {
  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = mat4.create();

  // Now move the drawing position a bit to where we want to
  // start drawing the square.
  mat4.translate(
    modelViewMatrix, // destination matrix
    modelViewMatrix, // matrix to translate
    [-0.0, 0.0, -6.0]
  ); // amount to translate
  mat4.rotate(modelViewMatrix, modelViewMatrix, Math.PI / 6, X_AXIS);
  mat4.rotate(modelViewMatrix, modelViewMatrix, Math.PI / 4, Y_AXIS);
  return modelViewMatrix;
}

function Canvas() {
  const [canvas, setCanvas] = React.useState<HTMLCanvasElement | null>(null);
  const viewMatrix = React.useRef(defaultView());

  const programInfo = React.useMemo(() => {
    if (canvas == null) {
      return null;
    }

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Initialize the GL context
    const gl = canvas.getContext("webgl2");

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

        textureCoord: gl.getAttribLocation(shaderProgram, "aTextureCoord"),

        vertexNormal: gl.getAttribLocation(shaderProgram, "aVertexNormal"),
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
        normalMatrix: gl.getUniformLocation(shaderProgram, "uNormalMatrix"),

        uSampler: gl.getUniformLocation(shaderProgram, "uSampler"),
      },
    };

    //
    // Initialize a texture and load an image.
    // When the image finished loading copy it into the texture.
    //
    const loadTexture = (gl: GL, url: string) => {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);

      // Because images have to be downloaded over the internet
      // they might take a moment until they are ready.
      // Until then put a single pixel in the texture so we can
      // use it immediately. When the image has finished downloading
      // we'll update the texture with the contents of the image.
      const level = 0;
      const internalFormat = gl.RGBA;
      const width = 1;
      const height = 1;
      const border = 0;
      const srcFormat = gl.RGBA;
      const srcType = gl.UNSIGNED_BYTE;
      const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
      gl.texImage2D(
        gl.TEXTURE_2D,
        level,
        internalFormat,
        width,
        height,
        border,
        srcFormat,
        srcType,
        pixel
      );

      const image = new Image();
      image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          level,
          internalFormat,
          srcFormat,
          srcType,
          image
        );

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

        gl.generateMipmap(gl.TEXTURE_2D);
      };
      image.src = url;

      return texture;
    };

    const buffers = initBuffers(gl);
    // Load texture
    const texture = loadTexture(gl, "textures/blocks.png");
    if (texture === null) {
      return null;
    }
    // Flip image pixels into the bottom-to-top order that WebGL expects.
    // gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    let then = 0;
    let squareRotation = 0.0;
    let deltaTime = 0;
    // Draw the scene repeatedly
    const render = (now: number) => {
      now *= 0.001; // convert to seconds
      deltaTime = 0.001;
      then = now;

      drawScene(programInfo, buffers, texture, viewMatrix.current);
      // mat4.rotate(
      //   viewMatrix.current, // destination matrix
      //   viewMatrix.current, // matrix to rotate
      //   deltaTime, // amount to rotate in radians
      //   [0, 0, 1]
      // ); // axis to rotate around (Z)
      // mat4.rotate(
      //   viewMatrix.current, // destination matrix
      //   viewMatrix.current, // matrix to rotate
      //   deltaTime * 0.7, // amount to rotate in radians
      //   [0, 1, 0]
      // ); // axis to rotate around (Y)
      // mat4.rotate(
      //   viewMatrix.current, // destination matrix
      //   viewMatrix.current, // matrix to rotate
      //   deltaTime * 0.3, // amount to rotate in radians
      //   [1, 0, 0]
      // ); // axis to rotate around (X)
      squareRotation += deltaTime;

      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
    // Draw the scene
    // drawScene(programInfo, buffers);
    return programInfo;
  }, [canvas]);

  React.useEffect(() => {
    const rotate = (amount: number, axis: Axis) =>
      mat4.rotate(viewMatrix.current, viewMatrix.current, amount, axis);

    const keyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case "w":
          rotate(-Math.PI / 12, Z_AXIS);
          break;
        case "s":
          rotate(Math.PI / 12, Z_AXIS);
          break;
        case "a":
          rotate(-Math.PI / 12, Y_AXIS);
          break;
        case "d":
          rotate(Math.PI / 12, Y_AXIS);
          break;
        case "q":
          rotate(-Math.PI / 12, X_AXIS);
          break;
        case "e":
          rotate(Math.PI / 12, X_AXIS);
          break;
      }
    };

    window.addEventListener("keydown", keyPress);
    return () => window.removeEventListener("keydown", keyPress);
  }, []);

  return <CanvasComponent ref={setCanvas} />;
}

export default Canvas;
