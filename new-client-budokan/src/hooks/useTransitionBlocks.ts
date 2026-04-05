import { useState, useCallback, useRef } from "react";

const TRANSITION_TIMEOUT_MS = 500;

const useTransitionBlocks = () => {
  const [transitioningBlocks, setTransitioningBlocks] = useState<number[]>([]);
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
      setTransitioningBlocks((prev) => {
        return prev.includes(id) ? prev : [...prev, id];
      });

      // Safety net: auto-remove after timeout in case transitionend never fires
      clearBlockTimeout(id);
      const timeout = setTimeout(() => {
        timeoutsRef.current.delete(id);
        setTransitioningBlocks((prev) =>
          prev.filter((blockId) => blockId !== id)
        );
      }, TRANSITION_TIMEOUT_MS);
      timeoutsRef.current.set(id, timeout);
    },
    [clearBlockTimeout]
  );

  const handleTransitionBlockEnd = useCallback(
    (id: number) => {
      clearBlockTimeout(id);
      setTransitioningBlocks((prev) =>
        prev.filter((blockId) => blockId !== id)
      );
    },
    [clearBlockTimeout]
  );

  return {
    transitioningBlocks,
    handleTransitionBlockStart,
    handleTransitionBlockEnd,
  };
};

export default useTransitionBlocks;
