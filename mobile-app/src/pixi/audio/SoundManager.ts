import { sound } from '@pixi/sound';
import type { PlayOptions, Sound } from '@pixi/sound';
import { AssetId } from '../assets/catalog';
import { resolveSoundUrl } from '../assets/resolver';
import type { ThemeId } from '../utils/colors';

// ============================================================================
// SOUND ALIASES — keyed by AssetId so we can swap themes without collisions
// ============================================================================

function sfxAlias(themeId: ThemeId, assetId: AssetId): string {
  return `${themeId}::${assetId}`;
}

// ============================================================================
// BGM — one looping track at a time, with crossfade support
// ============================================================================

export class BGM {
  private currentAlias: string | null = null;
  private currentSound: Sound | null = null;
  private _volume = 0.2;
  private _muted = false;

  async play(themeId: ThemeId, assetId: AssetId) {
    const alias = sfxAlias(themeId, assetId);

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
// SFX — one-shot sound effects with independent volume
// ============================================================================

export class SFX {
  private _volume = 0.2;
  private _muted = false;

  play(themeId: ThemeId, assetId: AssetId, options?: Partial<PlayOptions>) {
    if (this._muted) return;

    const url = resolveSoundUrl(themeId, assetId);
    if (!url) return;

    const alias = sfxAlias(themeId, assetId);

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

  get themeId() {
    return this._themeId;
  }

  set themeId(id: ThemeId) {
    this._themeId = id;
  }

  preloadTheme(themeId: ThemeId) {
    const sfxIds = [
      AssetId.SfxBreak,
      AssetId.SfxExplode,
      AssetId.SfxMove,
      AssetId.SfxNew,
      AssetId.SfxStart,
      AssetId.SfxSwipe,
      AssetId.SfxOver,
    ];
    const musicIds = [
      AssetId.MusicMain,
      AssetId.MusicMap,
      AssetId.MusicLevel,
      AssetId.MusicBoss,
    ];

    for (const assetId of [...sfxIds, ...musicIds]) {
      const url = resolveSoundUrl(themeId, assetId);
      if (!url) continue;
      const alias = sfxAlias(themeId, assetId);
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

  unloadTheme(themeId: ThemeId) {
    const allIds = Object.values(AssetId).filter(
      (id) => typeof id === 'string',
    ) as AssetId[];

    for (const assetId of allIds) {
      const alias = sfxAlias(themeId, assetId);
      if (sound.exists(alias)) {
        try { sound.remove(alias); } catch { /* may not be loaded */ }
      }
    }
  }
}

export const soundManager = new SoundManager();
