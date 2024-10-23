import React, { useRef } from "react";
import Particles from "@tsparticles/react";
import { Container, ISourceOptions } from "@tsparticles/engine";

interface ParticlesExplodeProps {
  position: { x: number; y: number };
  onAnimationEnd: () => void;
}

const ParticlesExplode: React.FC<ParticlesExplodeProps> = React.memo(
  ({ position, onAnimationEnd }) => {
    // Store particlesOptions in a ref to prevent it from changing on re-renders
    const particlesOptionsRef = useRef<ISourceOptions>({
      fullScreen: {
        zIndex: 1,
      },
      particles: {
        number: {
          value: 0,
        },
        color: {
          value: ["#2A708C", "#0A9BC5", "#001424"],
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
      emitters: {
        position: {
          x: position.x, // Position X dynamic %
          y: position.y, // Position Y dynamic %
        },
        life: {
          count: 1,
          duration: 0.1,
          delay: 0.4,
        },
        rate: {
          delay: 0.1,
          quantity: 150,
        },
        size: {
          width: 0,
          height: 0,
        },
      },
    });

    // Handle when particles are loaded
    const particlesLoaded = async (container?: Container): Promise<void> => {
      if (container) {
        // Call onAnimationEnd after the animation duration
        setTimeout(() => {
          onAnimationEnd();
        }, 1000); // Adjust the timing to match your animation duration
      }
    };

    return (
      <Particles
        options={particlesOptionsRef.current}
        particlesLoaded={particlesLoaded}
      />
    );
  },
  (prevProps, nextProps) =>
    prevProps.position.x === nextProps.position.x &&
    prevProps.position.y === nextProps.position.y,
);

export default ParticlesExplode;
