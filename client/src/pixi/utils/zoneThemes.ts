import { hash } from 'starknet';
import { THEME_IDS, type ThemeId } from './colors';
import { TOTAL_ZONES } from './mapLayout';

const ZONE_THEMES_SELECTOR = BigInt('0x5a4f4e455f5448454d4553'); // felt252 of 'ZONE_THEMES'

function poseidonBigInts(values: bigint[]): bigint {
  return BigInt(hash.computePoseidonHashOnElements(values.map(String)));
}

export function deriveZoneThemes(seed: bigint): ThemeId[] {
  const zoneSeed = poseidonBigInts([seed, ZONE_THEMES_SELECTOR]);

  const themes = [...THEME_IDS];
  for (let i = 0; i < TOTAL_ZONES; i++) {
    const stepSeed = poseidonBigInts([zoneSeed, BigInt(i)]);
    const remaining = themes.length - i;
    const j = i + Number(
      (stepSeed < 0n ? -stepSeed : stepSeed) % BigInt(remaining)
    );
    [themes[i], themes[j]] = [themes[j], themes[i]];
  }

  return themes.slice(0, TOTAL_ZONES) as ThemeId[];
}

export function getZoneTheme(seed: bigint, zone: number): ThemeId {
  const themes = deriveZoneThemes(seed);
  return themes[zone - 1] ?? themes[0];
}
