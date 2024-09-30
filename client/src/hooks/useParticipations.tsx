import { useDojo } from "@/dojo/useDojo";
import { useEffect, useState } from "react";
import { useEntityQuery } from "@dojoengine/react";
import {
  ComponentValue,
  getComponentValue,
  Has,
  HasValue,
} from "@dojoengine/recs";

export const useParticipations = ({
  player_id,
}: {
  player_id: string | undefined;
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

  const participationKeys = useEntityQuery([
    Has(Participation),
    HasValue(Participation, { player_id: BigInt(player_id ? player_id : -1) }),
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
  }, [participationKeys]);

  return participations;
};
