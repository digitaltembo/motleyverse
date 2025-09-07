export function constrain(v: number, [min, max]: Readonly<[number, number]>) {
  if (v < min) return min;
  if (v > max) return max;
  return v;
}
