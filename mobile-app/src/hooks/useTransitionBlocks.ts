import { useState, useCallback } from "react";

const useTransitionBlocks = () => {
  const [transitioningBlocks, setTransitioningBlocks] = useState<number[]>([]);

  const handleTransitionBlockStart = useCallback((id: number) => {
    setTransitioningBlocks((prev) => {
      const updatedBlocks = prev.includes(id) ? prev : [...prev, id];
      return updatedBlocks;
    });
  }, []);

  const handleTransitionBlockEnd = useCallback((id: number) => {
    setTransitioningBlocks((prev) => prev.filter((blockId) => blockId !== id));
  }, []);

  return {
    transitioningBlocks,
    handleTransitionBlockStart,
    handleTransitionBlockEnd,
  };
};

export default useTransitionBlocks;
