import React from "react";
import styled from "styled-components";

import initBuffers from "../buffers";
import drawScene from "../scene";
import { mat4 } from "gl-matrix";
import initShaders from "./initShaders";
import { loadBlockTextures } from "./loadTextures";
import { Block, TEXTURE_BLOCK_MAP } from "../../gen/textures/mapping";
import { chunkBuffers, generateChunk } from "../chunks/chunk";

const CanvasComponent = styled("canvas")`
  width: 100%;
  height: 100%;
  image-rendering: crisp-edges;
`;

const dim = 1;
const cubes = Array.from({ length: dim }).flatMap((_, x) =>
  Array.from({ length: dim }).flatMap((_, y) =>
    Array.from({ length: dim }).map((_, z) => {
      const f = (v: number) => v - dim / 2 + 0.5;
      const blocks = Object.keys(TEXTURE_BLOCK_MAP) as Block[];

      const block = blocks[Math.floor(Math.random() * blocks.length)];
      return { block, x: f(x), y: f(y), z: f(z) } as const;
    })
  )
);

const PITCH_LIMITS = [-Math.PI / 2, Math.PI / 2] as const;
function constrain(v: number, [min, max]: Readonly<[number, number]>) {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}

type Axis = [number, number, number];
const X_AXIS: Axis = [1, 0, 0];
const Y_AXIS: Axis = [0, 1, 0];
const Z_AXIS: Axis = [0, 0, 1];

const DELTA = 1;

type Camera = {
  position: [number, number, number];
  perspective: [number, number];
};

function defaultCamera(): Camera {
  return {
    position: [-8.257517400730253, -9.499999999999984, -8.132267220205637],
    perspective: [0, 0],
  };
}

function viewFromCamera(camera: Camera) {
  const view = mat4.create();
  mat4.rotateX(view, view, camera.perspective[1]);
  mat4.rotateY(view, view, camera.perspective[0]);
  mat4.translate(view, view, camera.position);
  return view;
}
function Canvas() {
  const [canvas, setCanvas] = React.useState<HTMLCanvasElement | null>(null);
  const camera = React.useRef(defaultCamera());

  const programInfo = React.useMemo(() => {
    const programInfo = initShaders(canvas);
    if (programInfo === null) {
      return;
    }

    const buffers = chunkBuffers(programInfo.gl, generateChunk());
    // const buffers = initBuffers(programInfo.gl, cubes);
    console.log(buffers);
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

      drawScene(programInfo, buffers, texture, viewFromCamera(camera.current));

      squareRotation += deltaTime;

      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
    // Draw the scene
    // drawScene(programInfo, buffers);
    return programInfo;
  }, [canvas]);

  React.useEffect(() => {
    const move = (amount: number, [x1, y1, z1]: Axis) => {
      const [x, y, z] = camera.current.position;
      camera.current.position = [
        x +
          amount *
            (x1 * Math.cos(camera.current.perspective[0]) -
              z1 * Math.sin(camera.current.perspective[0])),
        y + amount * y1,
        z +
          amount *
            (x1 * Math.sin(camera.current.perspective[0]) +
              z1 * Math.cos(camera.current.perspective[0])),
      ];
    };

    const keyPress = (event: KeyboardEvent) => {
      switch (event.key) {
        case "w":
          move(DELTA, Z_AXIS);
          break;
        case "s":
          move(-DELTA, Z_AXIS);
          break;
        case "a":
          move(DELTA, X_AXIS);
          break;
        case "d":
          move(-DELTA, X_AXIS);
          break;
        case "q":
          move(-DELTA, Y_AXIS);
          break;
        case "e":
          move(DELTA, Y_AXIS);
          break;
        case "p":
          console.log(camera.current);
      }
    };

    window.addEventListener("keydown", keyPress);
    return () => window.removeEventListener("keydown", keyPress);
  }, []);

  React.useEffect(() => {
    if (canvas) {
      const moveListener = (event: MouseEvent) => {
        camera.current.perspective[0] += event.movementX * 0.01;
        camera.current.perspective[1] = constrain(
          camera.current.perspective[1] + event.movementY * 0.01,
          PITCH_LIMITS
        );
      };

      const clickListener = async () => {
        await canvas.requestPointerLock();
        canvas.addEventListener("mousemove", moveListener);
        document.addEventListener(
          "pointerlockchange",
          (event) => {
            if (document.pointerLockElement !== canvas) {
              canvas.removeEventListener("mousemove", moveListener);
            }
          },
          false
        );
      };

      canvas.addEventListener("click", clickListener);
      return () => {
        canvas.removeEventListener("click", clickListener);
        canvas.removeEventListener("mousemove", moveListener);
      };
    }
    return () => {};
  }, [canvas]);

  return <CanvasComponent ref={setCanvas} />;
}

export default Canvas;
