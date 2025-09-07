import { constrain } from "../../utils/constrain";
import { Momentum } from "./Momentum";

const PITCH_LIMITS = [-Math.PI / 2, Math.PI / 2] as const;

/**
 * To be called within a useEffect, sets up mouse movement monitoring events
 * and returns a function for tearing them down
 */
export function mouseInput(
  canvas: HTMLCanvasElement,
  moment: React.MutableRefObject<Momentum>
) {
  const moveListener = (event: MouseEvent) => {
    moment.current.perspective[0] += event.movementX * 0.007;
    moment.current.perspective[1] = constrain(
      moment.current.perspective[1] + event.movementY * 0.007,
      PITCH_LIMITS
    );

    // highlightVoxel(
    //   chunks[0],
    //   moment.current.position,
    //   moment.current.perspective
    // );
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
