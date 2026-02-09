import { useCallback, useRef, useMemo, useEffect } from 'react';
import type { Graphics as PixiGraphics } from 'pixi.js';
import { useTick } from '@pixi/react';
import { usePixiTheme, usePerformanceSettings } from '../../themes/ThemeContext';
import { BloomFilter } from '../../extend';

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

export const ParticleSystem = ({ gridSize }: ParticleSystemProps) => {
  const { colors } = usePixiTheme();
  const { maxParticles, prefersReducedMotion } = usePerformanceSettings();

  const particlesRef = useRef<Particle[]>([]);
  const graphicsRef = useRef<PixiGraphics | null>(null);
  const dirtyRef = useRef(false);

  // Tick-driven physics update — mutates particles in-place, redraws graphics directly
  const tickCallback = useCallback((ticker: { deltaMS: number }) => {
    const ps = particlesRef.current;
    if (ps.length === 0) return;

    // deltaTime normalized to 60fps frames (~16.67ms per unit)
    const dt = ticker.deltaMS / 16.667;

    let writeIdx = 0;
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 0.3 * dt;
      p.life -= dt;
      p.rotation += p.rotationSpeed * dt;
      p.size *= Math.pow(0.98, dt);

      if (p.life > 0 && p.size > 0.5) {
        ps[writeIdx++] = p;
      }
    }
    ps.length = writeIdx;
    dirtyRef.current = true;

    // Immediate imperative draw — no React setState
    const g = graphicsRef.current;
    if (!g) return;

    g.clear();
    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      const alpha = p.life / p.maxLife;
      g.setFillStyle({ color: p.color, alpha });
      g.rect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      g.fill();
    }
  }, []);

  useTick(tickCallback);

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

    const ps = particlesRef.current;
    const actualCount = Math.min(count, maxParticles - ps.length);

    for (let i = 0; i < actualCount; i++) {
      const angle = (Math.random() - 0.5) * spread - Math.PI / 2;
      const velocity = speed * (0.5 + Math.random() * 0.5);

      ps.push({
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

    if (ps.length > maxParticles) {
      ps.splice(0, ps.length - maxParticles);
    }
  }, [colors.particles.explosion, maxParticles, prefersReducedMotion]);

  const emitLine = useCallback((
    y: number,
    width: number,
    count: number
  ) => {
    if (prefersReducedMotion) return;

    const particlesPerPoint = Math.ceil(count / 8);
    for (let i = 0; i < 8; i++) {
      const x = (i + 0.5) * (width / 8);
      emit(x, y, particlesPerPoint, { spread: Math.PI, speed: 6 });
    }
  }, [emit, prefersReducedMotion]);

  const clear = useCallback(() => {
    particlesRef.current.length = 0;
  }, []);

  // Capture the Graphics ref imperatively
  const captureRef = useCallback((g: PixiGraphics) => {
    graphicsRef.current = g;
    g.clear();
  }, []);

  const bloomFilter = useMemo(() => new BloomFilter({ strength: 4 }), []);
  const filters = useMemo(() => [bloomFilter], [bloomFilter]);

  useEffect(() => {
    return () => { bloomFilter.destroy(); };
  }, [bloomFilter]);

  return (
    <pixiContainer filters={filters}>
      <pixiGraphics draw={captureRef} />
    </pixiContainer>
  );
};

export default ParticleSystem;
