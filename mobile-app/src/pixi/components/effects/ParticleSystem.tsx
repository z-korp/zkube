import { useCallback, useEffect, useRef, useState } from 'react';
import type { Graphics as PixiGraphics } from 'pixi.js';
import { usePixiTheme, usePerformanceSettings } from '../../themes/ThemeContext';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
  rotation: number;
  rotationSpeed: number;
}

interface ParticleSystemProps {
  gridSize: number;
}

export interface ParticleSystemRef {
  emit: (x: number, y: number, count: number, options?: EmitOptions) => void;
  emitLine: (y: number, width: number, count: number) => void;
  clear: () => void;
}

interface EmitOptions {
  colors?: number[];
  speed?: number;
  spread?: number;
  gravity?: number;
  size?: number;
}

/**
 * PixiJS-based particle system for visual effects
 */
export const ParticleSystem = ({ gridSize }: ParticleSystemProps) => {
  const { colors, isProcedural } = usePixiTheme();
  const { maxParticles, prefersReducedMotion } = usePerformanceSettings();
  
  const [particles, setParticles] = useState<Particle[]>([]);
  const frameRef = useRef<number>();
  
  // Animation loop
  useEffect(() => {
    if (prefersReducedMotion) return;
    
    const animate = () => {
      setParticles(prev => {
        const updated = prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.3, // gravity
            life: p.life - 1,
            rotation: p.rotation + p.rotationSpeed,
            size: p.size * 0.98, // shrink over time
          }))
          .filter(p => p.life > 0 && p.size > 0.5);
        
        return updated;
      });
      
      frameRef.current = requestAnimationFrame(animate);
    };
    
    frameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [prefersReducedMotion]);

  // Emit particles at a point
  const emit = useCallback((
    x: number, 
    y: number, 
    count: number,
    options: EmitOptions = {}
  ) => {
    if (prefersReducedMotion) return;
    
    const {
      colors: particleColors = colors.particles.explosion,
      speed = 8,
      spread = Math.PI * 2,
      size = 6,
    } = options;
    
    const newParticles: Particle[] = [];
    const actualCount = Math.min(count, maxParticles - particles.length);
    
    for (let i = 0; i < actualCount; i++) {
      const angle = (Math.random() - 0.5) * spread - Math.PI / 2;
      const velocity = speed * (0.5 + Math.random() * 0.5);
      
      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        life: 30 + Math.random() * 20,
        maxLife: 50,
        size: size * (0.5 + Math.random() * 0.5),
        color: particleColors[Math.floor(Math.random() * particleColors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.2,
      });
    }
    
    setParticles(prev => [...prev, ...newParticles].slice(0, maxParticles));
  }, [colors.particles.explosion, maxParticles, particles.length, prefersReducedMotion]);

  // Emit particles along a line (for line clears)
  const emitLine = useCallback((
    y: number,
    width: number,
    count: number
  ) => {
    if (prefersReducedMotion) return;
    
    const particlesPerPoint = Math.ceil(count / 8);
    
    for (let i = 0; i < 8; i++) {
      const x = (i + 0.5) * (width / 8);
      emit(x, y, particlesPerPoint, {
        spread: Math.PI,
        speed: 6,
      });
    }
  }, [emit, prefersReducedMotion]);

  // Clear all particles
  const clear = useCallback(() => {
    setParticles([]);
  }, []);

  // Draw all particles
  const draw = useCallback((g: PixiGraphics) => {
    g.clear();
    
    for (const particle of particles) {
      const alpha = particle.life / particle.maxLife;
      
      g.setFillStyle({ color: particle.color, alpha });
      
      if (isProcedural) {
        // Neon theme: glowing circles
        g.circle(particle.x, particle.y, particle.size);
      } else {
        // Tiki theme: squares
        g.rect(
          particle.x - particle.size / 2,
          particle.y - particle.size / 2,
          particle.size,
          particle.size
        );
      }
      g.fill();
    }
  }, [particles, isProcedural]);

  // Expose methods via ref pattern (we'll use context instead)
  useEffect(() => {
    // Store methods in a global-ish way for now
    // In production, use a context or ref forwarding
    (window as any).__particleSystem = { emit, emitLine, clear };
    
    return () => {
      delete (window as any).__particleSystem;
    };
  }, [emit, emitLine, clear]);

  if (particles.length === 0) {
    return null;
  }

  return <pixiGraphics draw={draw} />;
};

/**
 * Hook to access particle system methods
 */
export function useParticles(): ParticleSystemRef | null {
  return (window as any).__particleSystem || null;
}

export default ParticleSystem;
