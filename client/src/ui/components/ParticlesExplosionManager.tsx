import {
  useState,
  useImperativeHandle,
  forwardRef,
  useRef,
  useEffect,
} from "react";
import ParticlesExplode from "./ParticlesExplode";
import { initParticlesEngine } from "@tsparticles/react";
import { Engine } from "@tsparticles/engine";
import { loadFull } from "tsparticles";

interface Explosion {
  id: number;
  position: {
    x: number;
    y: number;
  };
  color: {
    value: string[];
  };
}

export interface ParticlesExplosionManagerHandles {
  triggerExplosion: (
    position: { x: number; y: number },
    colorSet: string[],
  ) => void;
}

const ParticlesExplosionManager = forwardRef<
  ParticlesExplosionManagerHandles,
  // eslint-disable-next-line @typescript-eslint/ban-types
  {}
>((props, ref) => {
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const explosionIdRef = useRef(0);
  const particlesEngineRef = useRef<Engine | null>(null);
  const [engineLoaded, setEngineLoaded] = useState(false);

  // Initialize the particles engine once
  useEffect(() => {
    const initParticles = async () => {
      if (!particlesEngineRef.current) {
        await initParticlesEngine(async (engine: Engine) => {
          await loadFull(engine);
          particlesEngineRef.current = engine;
          setEngineLoaded(true);
        });
      }
    };
    initParticles();
  }, []);

  // Expose a method to trigger explosions
  useImperativeHandle(ref, () => ({
    triggerExplosion(position: { x: number; y: number }, colorSet: string[]) {
      const id = explosionIdRef.current++;
      setExplosions((prev) => [
        ...prev,
        { id, position, color: { value: colorSet } },
      ]);
    },
  }));

  // Remove explosion after animation ends
  const handleAnimationEnd = (id: number) => {
    setExplosions((prev) => prev.filter((explosion) => explosion.id !== id));
  };

  return (
    <>
      {engineLoaded &&
        explosions.map((explosion) => (
          <ParticlesExplode
            key={explosion.id}
            position={explosion.position}
            color={explosion.color.value}
            onAnimationEnd={() => handleAnimationEnd(explosion.id)}
          />
        ))}
    </>
  );
});

export default ParticlesExplosionManager;
