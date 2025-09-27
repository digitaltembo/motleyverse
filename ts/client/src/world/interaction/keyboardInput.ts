import React from "react";
import { Momentum } from "./Momentum";
const X_AXIS: Axis = [1, 0, 0];
const Y_AXIS: Axis = [0, 1, 0];
const Z_AXIS: Axis = [0, 0, 1];

const DELTA = 1;
type Axis = [number, number, number];

const directionKeys = ["w", "a", "s", "d", "q", "e"];
/**
 * To be called within a useEffect, sets up keypress monitoring events
 * and returns a function for tearing them down
 */
export function keyboardInput(moment: React.MutableRefObject<Momentum>) {
  const move = (amount: number, [x1, y1, z1]: Axis) => {
    moment.current.velocity = [
      -amount *
        (x1 * Math.cos(moment.current.perspective[0]) -
          z1 * Math.sin(moment.current.perspective[0])),
      amount * y1,

      -amount *
        (x1 * Math.sin(moment.current.perspective[0]) +
          z1 * Math.cos(moment.current.perspective[0])),
    ];
  };

  const keyPress = (event: KeyboardEvent) => {
    switch (event.key) {
      case "w":
        move(-DELTA, Z_AXIS);
        break;
      case "s":
        move(DELTA, Z_AXIS);
        break;
      case "a":
        move(-DELTA, X_AXIS);
        break;
      case "d":
        move(DELTA, X_AXIS);
        break;
      case "q":
        move(-DELTA, Y_AXIS);
        break;
      case "e":
        move(DELTA, Y_AXIS);
        break;
      case "p":
        console.log(moment);
    }
  };
  const keyRelease = (event: KeyboardEvent) => {
    if (directionKeys.includes(event.key)) {
      moment.current.velocity = [0, 0, 0];
    }
  };

  window.addEventListener("keydown", keyPress);
  window.addEventListener("keyup", keyRelease);
  return () => {
    window.removeEventListener("keydown", keyPress);

    window.addEventListener("keyup", keyRelease);
  };
}
