import {
  ISourceOptions,
  tsParticles,
  Container,
  Particle,
} from "@tsparticles/engine";
import React, {
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { loadFull } from "tsparticles";

interface ConfettiExplosionProps {
  colorSet: string[];
}

export interface ConfettiExplosionRef {
  triggerLocalExplosion: (position: { x: number; y: number }) => void;
  triggerLineExplosion: (position: {
    x: number;
    y: number;
    range: number;
  }) => void;
}

const ConfettiExplosion = forwardRef<
  ConfettiExplosionRef,
  ConfettiExplosionProps
>(({ colorSet }, ref) => {
  const particleContainerRef = useRef<Container | null>(null);
  const mousePosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const configs: ISourceOptions = {
    particles: {
      number: {
        value: 0,
      },
      color: {
        value: colorSet,
      },
      shape: {
        type: "square",
        options: {},
      },
      opacity: {
        value: {
          min: 0,
          max: 1,
        },
        animation: {
          enable: true,
          speed: 2,
          startValue: "max",
          destroy: "min",
        },
      },
      size: {
        value: {
          min: 8,
          max: 10,
        },
      },
      links: {
        enable: false,
      },
      life: {
        duration: {
          sync: true,
          value: 1,
        },
        count: 1,
      },
      move: {
        enable: true,
        gravity: {
          enable: true,
          acceleration: 10,
        },
        speed: {
          min: 10,
          max: 20,
        },
        decay: 0.1,
        direction: "none",
        straight: false,
        outModes: {
          default: "destroy",
          top: "none",
        },
      },
      wobble: {
        distance: 30,
        enable: true,
        move: true,
        speed: {
          min: -15,
          max: 15,
        },
      },
    },
  };

  const loadParticles = async (options: ISourceOptions) => {
    await loadFull(tsParticles);
    const container = await tsParticles.load({
      id: "tsparticles",
      options,
    });
    particleContainerRef.current = container ?? null;
  };

  useEffect(() => {
    loadParticles(configs);

    const handleMouseMove = (event: MouseEvent) => {
      mousePosition.current.x = event.clientX;
      mousePosition.current.y = event.clientY;
    };

    // Écoute l'événement mousemove
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const handleClick = () => {
    if (particleContainerRef.current) {
      const x =
        mousePosition.current.x *
        particleContainerRef.current.retina.pixelRatio;
      const y =
        mousePosition.current.y *
        particleContainerRef.current.retina.pixelRatio;

      for (let i = 0; i < 100; i++) {
        particleContainerRef.current.particles.addParticle({ x, y });
      }
    }
  };

  const triggerLocalExplosion = (position: { x: number; y: number }) => {
    if (particleContainerRef.current) {
      const pR = particleContainerRef.current.retina.pixelRatio;
      for (let i = 0; i < 50; i++) {
        particleContainerRef.current.particles.addParticle({
          x: position.x * pR,
          y: position.y * pR,
        });
      }
    }
  };

  const triggerLineExplosion = (position: {
    x: number;
    y: number;
    range: number;
  }) => {
    if (particleContainerRef.current) {
      const pR = particleContainerRef.current.retina.pixelRatio;
      for (let i = 0; i < 300; i++) {
        particleContainerRef.current.particles.addParticle({
          x:
            Math.random() * position.range * pR +
            position.x * pR -
            (position.range * pR) / 2,
          y: position.y * pR,
        });
      }
    }
  };

  // Expose the function
  useImperativeHandle(ref, () => ({
    triggerLocalExplosion,
    triggerLineExplosion,
  }));

  return (
    <div
      id="tsparticles"
      className="pointer-events-none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1000,
      }}
    />
  );
});

export default ConfettiExplosion;
