import { useEffect, useMemo, useState } from 'react';
import { Texture } from 'pixi.js';
import { loadTextureCached } from '../assets/textureLoader';

export function useTexture(path: string | null): Texture | null {
  const [tex, setTex] = useState<Texture | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!path) {
      setTex(null);
      return;
    }

    loadTextureCached(path)
      .then((t) => {
        if (!cancelled) setTex(t);
      })
      .catch(() => {
        if (!cancelled) setTex(null);
      });

    return () => {
      cancelled = true;
    };
  }, [path]);

  return tex;
}

export function useTextureWithFallback(candidates: string[] | null): Texture | null {
  const [tex, setTex] = useState<Texture | null>(null);
  const candidatesKey = useMemo(() => candidates?.join(',') ?? '', [candidates]);

  useEffect(() => {
    let cancelled = false;

    if (!candidates || candidates.length === 0) {
      setTex(null);
      return;
    }

    async function tryLoad(urls: string[]) {
      for (const url of urls) {
        try {
          const t = await loadTextureCached(url);
          if (!cancelled) setTex(t);
          return;
        } catch {
          continue;
        }
      }
      if (!cancelled) setTex(null);
    }

    tryLoad(candidates);

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- candidatesKey is a stable serialization of candidates
  }, [candidatesKey]);

  return tex;
}
