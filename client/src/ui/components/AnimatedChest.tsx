import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface AnimatedChestProps {
  imageSrc: string;
  isGrayscale?: boolean;
}

const AnimatedChest: React.FC<AnimatedChestProps> = ({
  imageSrc,
  isGrayscale = false,
}) => {
  const chestRef = useRef<HTMLImageElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only run animations if not grayscale
    if (!isGrayscale) {
      // Animate the chest floating
      if (chestRef.current) {
        gsap.to(chestRef.current, {
          y: 20,
          duration: 1,
          yoyo: true,
          repeat: -1,
          ease: "power1.inOut",
        });
      }
      // Animate the particles
      if (particlesRef.current) {
        const particles =
          particlesRef.current.querySelectorAll<HTMLElement>(".particle");
        particles.forEach((particle) => {
          gsap.to(particle, {
            x: "random(-200, 200)",
            y: "random(-200, 200)",
            opacity: 0,
            duration: "random(2, 5)",
            repeat: -1,
            ease: "power1.inOut",
            onUpdate: () => {
              particle.style.overflow = "hidden";
            },
          });
        });
      }
    }

    // Cleanup function to kill animations when component unmounts or isGrayscale changes
    return () => {
      if (chestRef.current) {
        gsap.killTweensOf(chestRef.current);
      }
      if (particlesRef.current) {
        const particles =
          particlesRef.current.querySelectorAll<HTMLElement>(".particle");
        particles.forEach((particle) => {
          gsap.killTweensOf(particle);
        });
      }
    };
  }, [isGrayscale]);

  return (
    <div className="relative rounded-lg p-4 flex flex-col items-center">
      <div ref={particlesRef} className="absolute inset-0 z-0 overflow-hidden">
        {!isGrayscale &&
          Array.from({ length: 100 }).map((_, index) => (
            <div
              key={index}
              className="particle w-2 h-2 bg-yellow-500 rounded-full absolute"
              style={{
                top: "35%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
      </div>
      <img
        ref={chestRef}
        src={imageSrc}
        className={`relative z-10 self-center h-[180px] ${isGrayscale ? "grayscale" : ""}`}
        alt="Treasure chest"
      />
    </div>
  );
};

export default AnimatedChest;
