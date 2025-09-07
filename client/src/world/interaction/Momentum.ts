import { mat4 } from "gl-matrix";
import { DEPTH, HEIGHT, WIDTH } from "../chunks/chunk";
import { Camera, Perspective, Position } from "../types";

export class Momentum {
  position: Position;
  velocity: Position;
  perspective: Perspective;

  constructor() {
    this.position = [WIDTH / 2, HEIGHT, DEPTH / 2];
    this.perspective = [0, 0];
    this.velocity = [0, 0, 0];
  }

  view = () => {
    const view = mat4.create();
    mat4.rotateX(view, view, this.perspective[1]);
    mat4.rotateY(view, view, this.perspective[0]);
    mat4.translate(view, view, this.position.map((x) => -x) as Position);
    return view;
  };
  cartesianPerspective = (): Position => {
    const theta = this.perspective[0] + Math.PI / 2;
    const phi = this.perspective[1] - Math.PI / 2;
    const s = Math.sin(theta);
    return [s * Math.cos(phi), Math.cos(theta), s * Math.sin(phi)];
  };

  update = (timeDeltaMs: number) => {
    const d = timeDeltaMs * 0.007;
    this.position[0] += this.velocity[0] * d;
    this.position[1] += this.velocity[1] * d;
    this.position[2] += this.velocity[2] * d;
  };
}
