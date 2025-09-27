import { raytraceLimitCount } from "./raytrace";

test.each`
  name        | origin        | direction     | expected
  ${"simple"} | ${[0.5, 0.5]} | ${[2, 1]}     | ${[[0, 0], [1, 0], [1, 1]]}
  ${"left"}   | ${[0.5, 0.5]} | ${[-2, 1]}    | ${[[0, 0], [-1, 0], [-1, 1]]}
  ${"odd"}    | ${[0.6, 0.2]} | ${[1.4, 0.3]} | ${[[0, 0], [1, 0], [2, 0]]}
`("raytrace 3 points: $name", ({ origin, direction, expected }) => {
  expect(raytraceLimitCount(origin, direction, 3)).toMatchObject(expected);
});
