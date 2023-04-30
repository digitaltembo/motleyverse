import React from "react";
import styled from "styled-components";

import vertex from "../vertex/base.vs";

const CanvasComponent = styled("canvas")`
  width: 100%;
  height: 100%;
`;

function Canvas() {
  const [canvas, setCanvas] = React.useState<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    if (canvas == null ){
      return;
    }

    // Initialize the GL context
    const gl = canvas.getContext("webgl");
  
    // Only continue if WebGL is available and working
    if (gl === null) {
      alert(
        "Unable to initialize WebGL. Your browser or machine may not support it."
      );
      return;
    }
  
    // Set clear color to black, fully opaque
    gl.clearColor(1.0, 0.0, 0.0, 1.0);
    // Clear the color buffer with specified clear color
    gl.clear(gl.COLOR_BUFFER_BIT);
  }, [canvas]);

  return <CanvasComponent ref={setCanvas} />
}

export default Canvas;