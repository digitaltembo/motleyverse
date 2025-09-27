/**
 * Perlin Noise describes a family of Gradient Noise functions which smoothly map a value in R^n to the range [-1, 1]
 * It works by
 * - Defining a grid of random gradient vectors of length 1
 *   - for ease of computation, and because of otherwise equivalence this grid will be defined
 *     at integer values, mapping Z^n => R^n
 *   - a particular position p, therefore, it should be surrounded by a (hyper)cube of 2^n gradient vectors
 * -
 */
type Vec2 = [number, number];

type SmoothstepFn = (v: number) => number;
type RandomGrad = (integerPos: Vec2) => Vec2;

const genericInterpolate =
  (smooth: SmoothstepFn) => (min: number, max: number) => {
    const diff = max - min;
    return (v: number) => diff * smooth(v) + min;
  };

const interpolateLinear = genericInterpolate((x) => x);

function psuedorandomGrad2([ix, iy]: Vec2): Vec2 {
  // Bitwise operators on JS numbers truncate the 64 bit double precision of the Number type
  // to a 32 bit signed integer
  const w = 32;
  const s = 16; // rotation width
  let a = ix,
    b = iy;
  a *= 3284157443;
  b ^= (a << s) | (a >> (w - s));
  b *= 1911520717;
  a ^= (b << s) | (b >> (w - s));
  a *= 2048419325;

  const random = a * (3.14159265 / 8388608); // in [0, 2*Pi]
  return [Math.cos(random), Math.sin(random)];
}

function genericDotGridGradient(randomGrad: RandomGrad) {
  return (i: Vec2, [px, py]: Vec2) => {
    const [rx, ry] = randomGrad(i);
    return (px - i[0]) * rx + (py - i[1]) * ry;
  };
}

function genericPerlin2(randomGrad: RandomGrad, smoothstep: SmoothstepFn) {
  const interpolate = genericInterpolate(smoothstep);
  const dotGridGradient = genericDotGridGradient(randomGrad);

  return ([x, y]: Vec2) => {
    const x0 = Math.floor(x);
    const x1 = x0 + 1;
    const y0 = Math.floor(y);
    const y1 = y0 + 1;

    // interpolation weights
    const sx = x - x0;
    const sy = y - y0;

    const ix0 = interpolate(
      dotGridGradient([x0, y0], [x, y]),
      dotGridGradient([x1, y0], [x, y])
    )(sx);
    const ix1 = interpolate(
      dotGridGradient([x0, y1], [x, y]),
      dotGridGradient([x1, y1], [x, y])
    )(sx);

    // console.log({ x0, x1, y0, y1, sx, sy, ix0, ix1 });
    return interpolate(ix0, ix1)(sy);
  };
}

export const perlin2 = genericPerlin2(psuedorandomGrad2, (x) => x);
