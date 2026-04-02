export const useCubeBalance = () => {
  return {
    cubeBalance: 0n,
    isLoading: false,
    error: null as Error | null,
    refetch: () => undefined,
  };
};
