import { useMemo } from "react";
import { useChest } from "./useChest";
import { Chest } from "@/dojo/game/models/chest";

export const useAllChests = () => {
  const { chest: chest1 } = useChest({ id: 1 });
  const { chest: chest2 } = useChest({ id: 2 });
  const { chest: chest3 } = useChest({ id: 3 });
  const { chest: chest4 } = useChest({ id: 4 });
  const { chest: chest5 } = useChest({ id: 5 });
  const { chest: chest6 } = useChest({ id: 6 });
  const { chest: chest7 } = useChest({ id: 7 });
  const { chest: chest8 } = useChest({ id: 8 });
  const { chest: chest9 } = useChest({ id: 9 });
  const { chest: chest10 } = useChest({ id: 10 });

  const allChests = useMemo(() => {
    const chests: (Chest | null)[] = [
      chest1,
      chest2,
      chest3,
      chest4,
      chest5,
      chest6,
      chest7,
      chest8,
      chest9,
      chest10,
    ];

    // Log any missing chests
    chests.forEach((chest, index) => {
      if (chest === null) {
        console.warn(`Chest ${index + 1} is null or undefined`);
      }
    });

    return chests;
  }, [
    chest1,
    chest2,
    chest3,
    chest4,
    chest5,
    chest6,
    chest7,
    chest8,
    chest9,
    chest10,
  ]);

  const validChests = useMemo(
    () =>
      allChests
        .filter((chest): chest is Chest => chest !== null)
        .sort((a, b) => a.id - b.id),
    [allChests],
  );

  return validChests;
};
