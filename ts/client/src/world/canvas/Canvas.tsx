import React from "react";
import styled from "styled-components";

import initBuffers from "../buffers";
import drawScene from "../scene";
import initShaders from "./initShaders";
import { loadBlockTextures } from "./loadTextures";
import { BlockType, TEXTURE_BLOCK_MAP } from "../../gen/textures/mapping";
import { chunkBuffers, generateChunk, WIDTH } from "../chunks/chunk";
import { keyboardInput } from "../interaction/keyboardInput";
import { mouseInput } from "../interaction/mouseInput";
import { Momentum } from "../interaction/Momentum";

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
      const blocks = Object.keys(TEXTURE_BLOCK_MAP) as BlockType[];

      const block = blocks[Math.floor(Math.random() * blocks.length)];
      return { block, x: f(x), y: f(y), z: f(z) } as const;
    })
  )
);

const chunks = [
  generateChunk(),
  generateChunk([WIDTH, 0, 0]),
  generateChunk([2 * WIDTH, 0, 0]),
];

function Canvas() {
  const [canvas, setCanvas] = React.useState<HTMLCanvasElement | null>(null);
  const moment = React.useRef(new Momentum());

  const programInfo = React.useMemo(() => {
    const programInfo = initShaders(canvas);
    if (programInfo === null) {
      return;
    }

    const buffers = chunkBuffers(programInfo.gl, chunks);
    // const buffers = initBuffers(programInfo.gl, cubes);
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
      // const buffers = chunkBuffers(programInfo.gl, chunks);
      drawScene(programInfo, buffers, texture, moment.current.view());
      requestAnimationFrame(render);
      if (then > 0) {
        moment.current.update(then - now);
      }
      then = now;
    };
    requestAnimationFrame(render);
    // Draw the scene
    // drawScene(programInfo, buffers);
    return programInfo;
  }, [canvas]);

  React.useEffect(() => keyboardInput(moment), []);

  React.useEffect(() => {
    if (canvas) {
      mouseInput(canvas, moment);
    }
    return () => {};
  }, [canvas]);

  return <CanvasComponent ref={setCanvas} />;
}

export default Canvas;
