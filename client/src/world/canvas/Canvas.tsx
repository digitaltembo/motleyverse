import React from "react";
import styled from "styled-components";

import vertex from "../../gen/shaders/vertex";
import fragment from "../../gen/shaders/fragment";
import { GL } from "../types";
import initBuffers from "../buffers";
import drawScene from "../scene";
import { mat4 } from "gl-matrix";
import { getProgramInfo } from "../../gen/shaders/shaderInterface";
import initShaders from "./initShaders";
import { loadBlockTextures } from "./loadTextures";

const CanvasComponent = styled("canvas")`
  width: 100%;
  height: 100%;
  image-rendering: crisp-edges;
`;

type Axis = [number, number, number];
const X_AXIS: Axis = [1, 0, 0];
const Y_AXIS: Axis = [0, 1, 0];
const Z_AXIS: Axis = [0, 0, 1];
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
    const programInfo = initShaders(canvas);
    if (programInfo === null) {
      return;
    }

    const buffers = initBuffers(programInfo.gl);
    // Load texture
    const texture = loadBlockTextures(programInfo.gl);
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
