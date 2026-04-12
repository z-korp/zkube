import { useState, useCallback, useRef } from "react";

const TRANSITION_TIMEOUT_MS = 500;

const useTransitionBlocks = () => {
  // Track block IDs in a ref to avoid re-renders on every transition start/end.
  // Only expose a boolean that flips twice per gravity phase (start → end).
  const blocksRef = useRef<Set<number>>(new Set());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timeoutsRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  const clearBlockTimeout = useCallback((id: number) => {
    const existing = timeoutsRef.current.get(id);
    if (existing) {
      clearTimeout(existing);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const handleTransitionBlockStart = useCallback(
    (id: number) => {
      blocksRef.current.add(id);
      setIsTransitioning(true);

      // Safety net: auto-remove after timeout in case transitionend never fires
      clearBlockTimeout(id);
      const timeout = setTimeout(() => {
        timeoutsRef.current.delete(id);
        blocksRef.current.delete(id);
        if (blocksRef.current.size === 0) {
          setIsTransitioning(false);
        }
      }, TRANSITION_TIMEOUT_MS);
      timeoutsRef.current.set(id, timeout);
    },
    [clearBlockTimeout]
  );

  const handleTransitionBlockEnd = useCallback(
    (id: number) => {
      clearBlockTimeout(id);
      blocksRef.current.delete(id);
      if (blocksRef.current.size === 0) {
        setIsTransitioning(false);
      }
    },
    [clearBlockTimeout]
  );

  return {
    isTransitioning,
    handleTransitionBlockStart,
    handleTransitionBlockEnd,
  };
};

export default useTransitionBlocks;
