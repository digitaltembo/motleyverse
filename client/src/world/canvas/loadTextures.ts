import { BLOCK_HEIGHT, TEXTURE_SIZE } from "../../gen/textures/mapping";
import { GL } from "../types";

/**
 * Initialize a texture and load an image.
 * When the image finished loading copy it into the texture
 * (texture returned is blue until the image has loaded?)
 * @param gl
 * @param url
 * @returns bound texture
 */
export function loadTexture(gl: GL, url: string) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);

  // // Because images have to be downloaded over the internet
  // // they might take a moment until they are ready.
  // // Until then put a single pixel in the texture so we can
  // // use it immediately. When the image has finished downloading
  // // we'll update the texture with the contents of the image.
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array(
    Array.from({ length: BLOCK_HEIGHT }).flatMap(() => [0, 0, 255, 255])
  ); // opaque blue
  gl.texImage3D(
    gl.TEXTURE_2D_ARRAY,
    0,
    gl.RGBA,
    1,
    1,
    BLOCK_HEIGHT,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    pixel
  );

  const image = new Image();

  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);
    gl.texImage3D(
      gl.TEXTURE_2D_ARRAY,
      0,
      gl.RGBA,
      TEXTURE_SIZE,
      TEXTURE_SIZE,
      BLOCK_HEIGHT,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      image
    );

    gl.texParameteri(
      gl.TEXTURE_2D_ARRAY,
      gl.TEXTURE_MIN_FILTER,
      gl.NEAREST_MIPMAP_LINEAR
    );
    gl.texParameteri(gl.TEXTURE_2D_ARRAY, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D_ARRAY);
  };

  image.src = url;

  return texture;
}

const textureLoader = (file: string) => (gl: GL) => loadTexture(gl, file);

export const loadBlockTextures = textureLoader("textures/blocks.png");
