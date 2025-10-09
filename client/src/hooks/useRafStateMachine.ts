import { useEffect, useRef } from "react";
import { GameState } from "@/enums/gameEnums";

type UseRafStateMachineParams = {
  gameState: GameState;
  setGameState: (s: GameState) => void;
  isMoving: boolean;
  transitioningCount: number;
  gravityMs: number;
  onApplyGravity: () => void;
  onAdvanceAfterGravity: () => void;
  onAddLine: () => void;
  onLineClear: () => void;
  onUpdateAfter: () => void;
};

export function useRafStateMachine({
  gameState,
  setGameState,
  isMoving,
  transitioningCount,
  gravityMs,
  onApplyGravity,
  onAdvanceAfterGravity,
  onAddLine,
  onLineClear,
  onUpdateAfter,
}: UseRafStateMachineParams) {
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const accumulatorRef = useRef(0);

  useEffect(() => {
    let mounted = true;

    const tick = (ts: number) => {
      if (!mounted) return;
      if (lastTimeRef.current === 0) lastTimeRef.current = ts;
      const dt = ts - lastTimeRef.current;
      lastTimeRef.current = ts;
      accumulatorRef.current += dt;

      const inGravity =
        gameState === GameState.GRAVITY ||
        gameState === GameState.GRAVITY2 ||
        gameState === GameState.GRAVITY_BONUS;

      if (inGravity) {
        if (!isMoving && transitioningCount === 0) {
          onAdvanceAfterGravity();
        } else {
          while (accumulatorRef.current >= gravityMs) {
            onApplyGravity();
            accumulatorRef.current -= gravityMs;
          }
        }
      } else if (gameState === GameState.ADD_LINE) {
        if (transitioningCount === 0) onAddLine();
      } else if (
        gameState === GameState.LINE_CLEAR ||
        gameState === GameState.LINE_CLEAR2 ||
        gameState === GameState.LINE_CLEAR_BONUS
      ) {
        onLineClear();
      } else if (
        gameState === GameState.UPDATE_AFTER_MOVE ||
        gameState === GameState.UPDATE_AFTER_BONUS
      ) {
        onUpdateAfter();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTimeRef.current = 0;
      accumulatorRef.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, isMoving, transitioningCount, gravityMs]);
}

