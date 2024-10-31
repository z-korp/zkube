import { useDojo } from "@/dojo/useDojo";
import { useEffect, useState } from "react";
import { useEntityQuery } from "@dojoengine/react";
import { ComponentValue, getComponentValue, Has } from "@dojoengine/recs";

export const useParticipationsFromChest = ({
  chest_id,
}: {
  chest_id: number | undefined;
}) => {
  const {
    setup: {
      clientModels: {
        models: { Participation },
        classes: { Participation: ParticipationClass },
      },
    },
  } = useDojo();
  type ParticipationInstance = InstanceType<typeof ParticipationClass>;
  const [participations, setParticipations] = useState<ParticipationInstance[]>(
    [],
  );

  const participationKeys = useEntityQuery([Has(Participation)]);

  useEffect(() => {
    const components = participationKeys.map((entity) => {
      const component = getComponentValue(Participation, entity);
      if (!component) {
        return undefined;
      }
      return new ParticipationClass(component);
    });

    const newParticipations = components
      .map((component) => new ParticipationClass(component as ComponentValue))
      .filter((participation) => participation.chest_id === chest_id)
      .sort((a, b) => b.points - a.points);
    setParticipations(newParticipations);
  }, [participationKeys, chest_id]);

  return participations;
};
