import { sound } from '@pixi/sound';
import type { PlayOptions, Sound } from '@pixi/sound';
import { AssetId } from '../assets/catalog';
import { resolveSoundUrl } from '../assets/resolver';
import type { ThemeId } from '../utils/colors';

const SFX_THEME: ThemeId = 'theme-1';

const SFX_IDS: readonly AssetId[] = [
  AssetId.SfxBreak,
  AssetId.SfxExplode,
  AssetId.SfxMove,
  AssetId.SfxNew,
  AssetId.SfxStart,
  AssetId.SfxSwipe,
  AssetId.SfxOver,
];

const MUSIC_IDS: readonly AssetId[] = [
  AssetId.MusicMain,
  AssetId.MusicMap,
  AssetId.MusicLevel,
  AssetId.MusicBoss,
];

function musicAlias(themeId: ThemeId, assetId: AssetId): string {
  return `${themeId}::${assetId}`;
}

function sfxAlias(assetId: AssetId): string {
  return `sfx::${assetId}`;
}

// ============================================================================
// BGM — one looping track at a time
// ============================================================================

export class BGM {
  private currentAlias: string | null = null;
  private currentSound: Sound | null = null;
  private _volume = 0.2;
  private _muted = false;

  async play(themeId: ThemeId, assetId: AssetId) {
    const alias = musicAlias(themeId, assetId);

    if (this.currentAlias === alias && this.currentSound?.isPlaying) return;

    this.stop();

    const url = resolveSoundUrl(themeId, assetId);
    if (!url) return;

    if (!sound.exists(alias)) {
      sound.add(alias, { url });
    }

    try {
      sound.play(alias, {
        loop: true,
        volume: this._muted ? 0 : this._volume,
      });
      this.currentAlias = alias;
      this.currentSound = sound.find(alias);
    } catch (e) {
      console.warn('[BGM] Failed to play', alias, e);
    }
  }

  stop() {
    if (this.currentAlias && sound.exists(this.currentAlias)) {
      try {
        sound.stop(this.currentAlias);
      } catch { /* noop */ }
    }
    this.currentAlias = null;
    this.currentSound = null;
  }

  get volume() {
    return this._volume;
  }

  set volume(v: number) {
    this._volume = Math.max(0, Math.min(1, v));
    if (this.currentSound && !this._muted) {
      this.currentSound.volume = this._volume;
    }
  }

  get muted() {
    return this._muted;
  }

  set muted(m: boolean) {
    this._muted = m;
    if (this.currentSound) {
      this.currentSound.volume = m ? 0 : this._volume;
    }
  }

  get isPlaying(): boolean {
    return this.currentSound?.isPlaying ?? false;
  }
}

// ============================================================================
// SFX — one-shot sound effects, theme-independent
// ============================================================================

export class SFX {
  private _volume = 0.2;
  private _muted = false;

  play(assetId: AssetId, options?: Partial<PlayOptions>) {
    if (this._muted) return;

    const url = resolveSoundUrl(SFX_THEME, assetId);
    if (!url) return;

    const alias = sfxAlias(assetId);

    if (!sound.exists(alias)) {
      sound.add(alias, { url });
    }

    const vol = this._volume * (options?.volume ?? 1);
    try {
      sound.play(alias, { ...options, volume: vol });
    } catch (e) {
      console.warn('[SFX] Failed to play', alias, e);
    }
  }

  get volume() {
    return this._volume;
  }

  set volume(v: number) {
    this._volume = Math.max(0, Math.min(1, v));
  }

  get muted() {
    return this._muted;
  }

  set muted(m: boolean) {
    this._muted = m;
  }
}

// ============================================================================
// SOUND MANAGER — singleton combining BGM + SFX + theme management
// ============================================================================

class SoundManager {
  readonly bgm = new BGM();
  readonly sfx = new SFX();

  private _themeId: ThemeId = 'theme-1';

  constructor() {
    const ctx = sound.context as any;
    if (ctx && 'autoPause' in ctx) {
      ctx.autoPause = false;
    }
  }

  get themeId() {
    return this._themeId;
  }

  set themeId(id: ThemeId) {
    this._themeId = id;
  }

  preloadCommonSfx() {
    for (const assetId of SFX_IDS) {
      const url = resolveSoundUrl(SFX_THEME, assetId);
      if (!url) continue;
      const alias = sfxAlias(assetId);
      if (!sound.exists(alias)) {
        sound.add(alias, { url, preload: true });
      }
    }
  }

  preloadThemeMusic(themeId: ThemeId) {
    for (const assetId of MUSIC_IDS) {
      const url = resolveSoundUrl(themeId, assetId);
      if (!url) continue;
      const alias = musicAlias(themeId, assetId);
      if (!sound.exists(alias)) {
        sound.add(alias, { url, preload: true });
      }
    }
  }

  pauseAll() {
    sound.pauseAll();
  }

  resumeAll() {
    sound.resumeAll();
  }

  get masterVolume() {
    return sound.volumeAll;
  }

  set masterVolume(v: number) {
    sound.volumeAll = v;
  }

  unloadThemeMusic(themeId: ThemeId) {
    for (const assetId of MUSIC_IDS) {
      const alias = musicAlias(themeId, assetId);
      if (sound.exists(alias)) {
        try { sound.remove(alias); } catch { /* may not be loaded */ }
      }
    }
  }
}

export const soundManager = new SoundManager();
