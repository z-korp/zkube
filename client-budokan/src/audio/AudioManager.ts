import { Howl, Howler } from "howler";
import {
  type ThemeId,
  type MusicContext,
  type SfxName,
  THEME_MUSIC,
  SFX_PATHS,
  loadAudioSettings,
  saveAudioSettings,
} from "@/config/themes";

const clampVolume = (volume: number): number => {
  if (Number.isNaN(volume)) {
    return 0;
  }
  return Math.min(Math.max(volume, 0), 1);
};

export class AudioManager {
  private musicHowls = new Map<string, Howl>();

  private sfxHowls = new Map<SfxName, Howl>();

  private currentMusicHowl: Howl | null = null;

  private currentMusicUrl: string | null = null;

  private stopTimeoutId: number | null = null;

  private pausedByManager = false;

  private playlist: string[] = [];

  private playlistIdx = 0;

  private playlistThemeId: ThemeId | null = null;

  public musicVolume: number;

  public effectsVolume: number;

  public currentThemeId: ThemeId | null = null;

  public currentContext: MusicContext | null = null;

  public isPlaying = false;

  constructor() {
    const settings = loadAudioSettings();
    this.musicVolume = clampVolume(settings.musicVolume);
    this.effectsVolume = clampVolume(settings.effectsVolume);

    (Object.keys(SFX_PATHS) as SfxName[]).forEach((name) => {
      this.sfxHowls.set(
        name,
        new Howl({
          src: [SFX_PATHS[name]],
          volume: this.effectsVolume,
          loop: false,
        }),
      );
    });
  }

  public playMusic(themeId: ThemeId, context: MusicContext): void {
    const nextUrl = THEME_MUSIC[themeId][context];
    this.clearPendingStop();

    if (this.currentMusicUrl !== nextUrl) {
      if (this.currentMusicHowl && this.currentMusicHowl.playing()) {
        this.currentMusicHowl.stop();
      }
      this.currentMusicHowl = this.getOrCreateMusicHowl(nextUrl);
      this.currentMusicUrl = nextUrl;
    }

    if (!this.currentMusicHowl) {
      return;
    }

    this.currentMusicHowl.volume(this.musicVolume);
    if (!this.currentMusicHowl.playing()) {
      this.currentMusicHowl.play();
    }

    this.currentThemeId = themeId;
    this.currentContext = context;
    this.isPlaying = true;
    this.pausedByManager = false;
  }

  public stopMusic(withFade = true): void {
    this.stopCurrentTrack(withFade);
    this.isPlaying = false;
  }

  public setMusicVolume(volume: number): void {
    this.musicVolume = clampVolume(volume);

    if (this.currentMusicHowl) {
      this.currentMusicHowl.volume(this.musicVolume);
    }

    saveAudioSettings({
      musicVolume: this.musicVolume,
      effectsVolume: this.effectsVolume,
    });
  }

  public setEffectsVolume(volume: number): void {
    this.effectsVolume = clampVolume(volume);

    this.sfxHowls.forEach((howl) => {
      howl.volume(this.effectsVolume);
    });

    saveAudioSettings({
      musicVolume: this.musicVolume,
      effectsVolume: this.effectsVolume,
    });
  }

  public playSfx(name: SfxName): void {
    const howl = this.sfxHowls.get(name);
    if (!howl) {
      return;
    }
    howl.play();
  }

  public pauseAll(): void {
    if (!this.currentMusicHowl || !this.currentMusicHowl.playing()) {
      return;
    }
    this.currentMusicHowl.pause();
    this.pausedByManager = true;
    this.isPlaying = false;
  }

  public resumeAll(): void {
    if (!this.currentMusicHowl || !this.pausedByManager) {
      return;
    }
    this.currentMusicHowl.play();
    this.pausedByManager = false;
    this.isPlaying = true;
  }

  public dispose(): void {
    this.clearPendingStop();
    this.stopCurrentTrack(false);
    this.musicHowls.forEach((howl) => {
      howl.unload();
    });
    this.sfxHowls.forEach((howl) => {
      howl.unload();
    });
    this.musicHowls.clear();
    this.sfxHowls.clear();
    this.currentMusicHowl = null;
    this.currentMusicUrl = null;
    this.currentThemeId = null;
    this.currentContext = null;
    this.isPlaying = false;
    this.pausedByManager = false;
    Howler.stop();
  }

  private getOrCreateMusicHowl(url: string): Howl {
    const existing = this.musicHowls.get(url);
    if (existing) {
      return existing;
    }

    const created = new Howl({
      src: [url],
      loop: true,
      volume: this.musicVolume,
    });

    this.musicHowls.set(url, created);
    return created;
  }

  private stopCurrentTrack(withFade: boolean): void {
    this.clearPendingStop();

    if (!this.currentMusicHowl) {
      return;
    }

    if (withFade && this.currentMusicHowl.playing()) {
      const currentVolume = this.currentMusicHowl.volume();
      this.currentMusicHowl.fade(currentVolume, 0, 200);
      const howlToStop = this.currentMusicHowl;
      this.stopTimeoutId = window.setTimeout(() => {
        howlToStop.stop();
        howlToStop.volume(this.musicVolume);
      }, 200);
      return;
    }

    this.currentMusicHowl.stop();
    this.currentMusicHowl.volume(this.musicVolume);
  }

  private clearPendingStop(): void {
    if (this.stopTimeoutId !== null) {
      window.clearTimeout(this.stopTimeoutId);
      this.stopTimeoutId = null;
    }
  }
}

export const audioManager = new AudioManager();
