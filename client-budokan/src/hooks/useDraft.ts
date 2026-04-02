export interface DraftStateData {
  active: boolean;
  zone: number;
  triggerLevel: number;
  completedMask: number;
  selectedPicks: bigint;
  currentSlot: number;
}

export const useDraft = ({ gameId }: { gameId: bigint | undefined }) => {
  void gameId;
  return null as DraftStateData | null;
};
