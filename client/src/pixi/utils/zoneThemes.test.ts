import { describe, it, expect } from 'vitest';
import { deriveZoneThemes, getZoneTheme } from './zoneThemes';
import { THEME_IDS } from './colors';
import { TOTAL_ZONES } from './mapLayout';

describe('zoneThemes', () => {
  const TEST_SEED = BigInt('0x1234567890abcdef');

  describe('deriveZoneThemes', () => {
    it('returns exactly 5 themes', () => {
      const themes = deriveZoneThemes(TEST_SEED);
      expect(themes).toHaveLength(TOTAL_ZONES);
    });

    it('returns only valid theme IDs', () => {
      const themes = deriveZoneThemes(TEST_SEED);
      for (const theme of themes) {
        expect(THEME_IDS).toContain(theme);
      }
    });

    it('returns 5 unique themes (no duplicates)', () => {
      const themes = deriveZoneThemes(TEST_SEED);
      const uniqueThemes = new Set(themes);
      expect(uniqueThemes.size).toBe(TOTAL_ZONES);
    });

    it('is deterministic (same seed = same themes)', () => {
      const themes1 = deriveZoneThemes(TEST_SEED);
      const themes2 = deriveZoneThemes(TEST_SEED);
      expect(themes1).toEqual(themes2);
    });

    it('different seeds produce different theme assignments', () => {
      const themes1 = deriveZoneThemes(BigInt('0x1111'));
      const themes2 = deriveZoneThemes(BigInt('0x2222'));
      const themes3 = deriveZoneThemes(BigInt('0x3333'));
      const allSame = JSON.stringify(themes1) === JSON.stringify(themes2)
        && JSON.stringify(themes2) === JSON.stringify(themes3);
      expect(allSame).toBe(false);
    });

    it('determinism across 100 seeds', () => {
      for (let i = 0; i < 100; i++) {
        const seed = BigInt(i * 999983 + 42);
        const a = deriveZoneThemes(seed);
        const b = deriveZoneThemes(seed);
        expect(a).toEqual(b);
        expect(a).toHaveLength(TOTAL_ZONES);
        expect(new Set(a).size).toBe(TOTAL_ZONES);
      }
    });
  });

  describe('getZoneTheme', () => {
    it('returns the correct theme for each zone', () => {
      const themes = deriveZoneThemes(TEST_SEED);
      for (let z = 1; z <= TOTAL_ZONES; z++) {
        expect(getZoneTheme(TEST_SEED, z)).toBe(themes[z - 1]);
      }
    });
  });
});
