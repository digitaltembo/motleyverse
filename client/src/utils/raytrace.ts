type Vec = number[];

type TraceInfo = {
  origin: Vec;
  direction: Vec;
  t: number;
  /** representation of the face of the voxel that the trace interacted with */
  face: number;
};

export const FACE_NUMBERS_2D = {
  1: "left",
  2: "top",
  [-1]: "right",
  [-2]: "bottom",
};

/**
 * Defining a ray R in R^n space parameterized on t [0, inf) such that R(t) = U + tV,
 * with U being the origin position and V being a vector representing movement in R^n,
 * we can find a list of positions R_i along that ray that indicate a transition from
 * one voxel into another, by iteratively solving for t_i in R_i = R(t_i).
 * With reference to http://www.cse.yorku.ca/~amana/research/grid.pdf
 * and https://github.com/kpreid/cubes/blob/c5e61fa22cb7f9ba03cd9f22e5327d738ec93969/world.js#L307
 * @param origin
 * @param direction
 */
export function raytrace(
  origin: Vec,
  direction: Vec,
  con: (voxel: Vec, info: TraceInfo) => boolean,
  limitVoxels: number = Number.POSITIVE_INFINITY
) {
  if (origin.length !== direction.length) {
    throw new Error("Invalid vector trace");
  }

  const traceInfo = {
    origin,
    direction,
    t: 0,
    face: 0,
  };
  const voxel = origin.map((s) => Math.floor(s));
  let shouldContinue = con(voxel, traceInfo);
  if (!shouldContinue) {
    return;
  }
  const step = direction.map(Math.sign);
  const delta = direction.map((s) => Math.sign(s) / s);
  const tMax = origin.map((u, i) => tMaxOf(u, direction[i], voxel[i]));
  let i = 1;
  while (shouldContinue && i < limitVoxels) {
    // console.log("next iteration");
    // tMax.map((t, i) =>
    //   console.log(
    //     `Testing next voxel moving in direction ${i} with tMax = ${t}, (${origin
    //       .map((u, i) => u + direction[i] * t)
    //       .join(",")})`
    //   )
    // );
    const updatedComponent = indexOfSmallest(tMax);
    voxel[updatedComponent] += step[updatedComponent];
    traceInfo.t = tMax[updatedComponent];
    traceInfo.face = step[updatedComponent] * (updatedComponent + 1);
    tMax[updatedComponent] += delta[updatedComponent];

    shouldContinue = con(voxel, traceInfo);
    i++;
  }
}

export function raytraceLimitCount(
  origin: Vec,
  direction: Vec,
  limitCount: number
) {
  let voxels: Vec[] = [];
  raytrace(origin, direction, (v) => {
    voxels.push([...v]);
    return voxels.length < limitCount;
  });
  return voxels;
}

function tMaxOf(
  /** position coordinate */
  u: number,
  /** direction vector coordinate */
  v: number,
  /** floored coordinate */
  c: number
) {
  return (c - u + (v > 0 ? 1 : 0)) / v;
}

function indexOfSmallest(v: Vec) {
  let lowestIndex = 0;
  for (let i = 1; i < v.length; i++) {
    if (v[i] < v[lowestIndex]) lowestIndex = i;
  }
  return lowestIndex;
}
