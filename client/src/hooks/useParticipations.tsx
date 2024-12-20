import { useDojo } from "@/dojo/useDojo";
import { useEffect, useState } from "react";
import { useEntityQuery } from "@dojoengine/react";
import {
  ComponentValue,
  getComponentValue,
  Has,
  HasValue,
} from "@dojoengine/recs";
import { useGeneralStore } from "@/stores/generalStore";

export const useParticipations = () => {
  const {
    setup: {
      clientModels: {
        models: { Participation },
        classes: { Participation: ParticipationClass },
      },
    },
  } = useDojo();
  const { playerId } = useGeneralStore();

  type ParticipationInstance = InstanceType<typeof ParticipationClass>;
  const [participations, setParticipations] = useState<ParticipationInstance[]>(
    [],
  );

  const participationKeys = useEntityQuery([
    Has(Participation),
    HasValue(Participation, { player_id: playerId ? playerId : undefined }),
  ]);

  useEffect(() => {
    const components = participationKeys.map((entity) => {
      const component = getComponentValue(Participation, entity);
      if (!component) {
        return undefined;
      }
      return new ParticipationClass(component);
    });

    setParticipations(
      components.map(
        (component) => new ParticipationClass(component as ComponentValue),
      ),
    );
  }, [Participation, ParticipationClass, participationKeys]);

  return participations;
};
