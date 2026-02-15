import { useCallback, useMemo, useRef } from 'react';
import { Graphics as PixiGraphics, Rectangle } from 'pixi.js';
import { PageTopBar } from './PageTopBar';
import { useTheme } from '@/ui/elements/theme-provider/hooks';
import { FONT_TITLE, FONT_BODY, THEME_IDS, THEME_META, type ThemeId } from '../../utils/colors';

const SLIDER_LABEL_STYLE = { fontFamily: FONT_TITLE, fontSize: 16, fill: 0xffffff };
const SETTING_LABEL_STYLE = { fontFamily: FONT_BODY, fontSize: 14, fill: 0x94a3b8 };
const SETTING_VALUE_STYLE = { fontFamily: FONT_BODY, fontSize: 14, fill: 0xffffff };
const THEME_HEADER_STYLE = { fontFamily: FONT_TITLE, fontSize: 14, fill: 0xffffff };
const SECTION_HEADER_STYLE = { fontFamily: FONT_BODY, fontSize: 12, fill: 0x64748b, letterSpacing: 2 };
const VERSION_STYLE = { fontFamily: FONT_BODY, fontSize: 12, fill: 0x475569 };
const FOOTER_STYLE = { fontFamily: FONT_BODY, fontSize: 11, fill: 0x475569 };

// ============================================================================
// VOLUME SLIDER
// ============================================================================

const VolumeSlider = ({
  x,
  y,
  value,
  onChange,
  label,
  width = 280,
}: {
  x: number;
  y: number;
  value: number;
  onChange: (v: number) => void;
  label: string;
  width?: number;
}) => {
  const rowH = 60;
  const trackH = 8;
  const knobR = 12;
  const padX = 16;
  const labelH = 24;
  const trackY = labelH + (rowH - labelH - trackH) / 2;
  const trackW = width - padX * 2;
  const draggingRef = useRef(false);

  const clampedValue = Math.max(0, Math.min(1, value));
  const pct = Math.round(clampedValue * 100);

  const resolveValue = useCallback(
    (globalX: number, containerX: number) => {
      const relX = globalX - containerX - padX;
      return Math.max(0, Math.min(1, relX / trackW));
    },
    [trackW, padX],
  );

  const drawRow = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.setFillStyle({ color: 0x1e293b, alpha: 0.85 });
      g.roundRect(0, 0, width, rowH, 12);
      g.fill();
    },
    [width],
  );

  const drawTrack = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.setFillStyle({ color: 0x334155, alpha: 1 });
      g.roundRect(0, 0, trackW, trackH, trackH / 2);
      g.fill();

      const fillW = trackW * clampedValue;
      if (fillW > 0) {
        g.setFillStyle({ color: 0x3b82f6, alpha: 1 });
        g.roundRect(0, 0, fillW, trackH, trackH / 2);
        g.fill();
      }

      const knobX = trackW * clampedValue;
      const knobCY = trackH / 2;
      g.setFillStyle({ color: 0xffffff, alpha: 1 });
      g.circle(knobX, knobCY, knobR);
      g.fill();
      g.setStrokeStyle({ width: 2, color: 0x3b82f6, alpha: 0.8 });
      g.circle(knobX, knobCY, knobR);
      g.stroke();
    },
    [trackW, clampedValue],
  );

  const pctStyle = useMemo(
    () => ({ fontFamily: FONT_BODY, fontSize: 13, fill: 0x94a3b8 }),
    [],
  );

  const onPointerDown = useCallback(
    (e: any) => {
      draggingRef.current = true;
      const container = e.currentTarget.parent;
      if (container) {
        onChange(resolveValue(e.global.x, container.worldTransform.tx));
      }
    },
    [onChange, resolveValue],
  );

  const onPointerMove = useCallback(
    (e: any) => {
      if (!draggingRef.current) return;
      const container = e.currentTarget.parent;
      if (container) {
        onChange(resolveValue(e.global.x, container.worldTransform.tx));
      }
    },
    [onChange, resolveValue],
  );

  const onPointerUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics draw={drawRow} />
      <pixiText
        text={label}
        x={padX}
        y={8}
        anchor={{ x: 0, y: 0 }}
        style={SLIDER_LABEL_STYLE}
        eventMode="none"
      />
      <pixiText
        text={`${pct}%`}
        x={width - padX}
        y={8}
        anchor={{ x: 1, y: 0 }}
        style={pctStyle}
        eventMode="none"
      />
      <pixiContainer x={padX} y={trackY}>
        <pixiGraphics
          draw={drawTrack}
          eventMode="static"
          cursor="pointer"
          hitArea={new Rectangle(-knobR, -knobR, trackW + knobR * 2, trackH + knobR * 2)}
          onPointerDown={onPointerDown}
          onGlobalPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerUpOutside={onPointerUp}
        />
      </pixiContainer>
    </pixiContainer>
  );
};

// ============================================================================
// SETTING ROW
// ============================================================================

const SettingRow = ({
  y,
  label,
  value,
  width,
}: {
  y: number;
  label: string;
  value: string;
  width: number;
}) => {
  const rowH = 50;

  const drawBg = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.setFillStyle({ color: 0x1e293b, alpha: 0.85 });
      g.roundRect(0, 0, width, rowH, 12);
      g.fill();
    },
    [width]
  );

  return (
    <pixiContainer y={y}>
      <pixiGraphics draw={drawBg} />
      <pixiText
        text={label}
        x={16}
        y={rowH / 2}
        anchor={{ x: 0, y: 0.5 }}
        style={SETTING_LABEL_STYLE}
        eventMode="none"
      />
      <pixiText
        text={value}
        x={width - 16}
        y={rowH / 2}
        anchor={{ x: 1, y: 0.5 }}
        style={SETTING_VALUE_STYLE}
        eventMode="none"
      />
    </pixiContainer>
  );
};

// ============================================================================
// THEME OPTION (single selectable tile)
// ============================================================================

const ThemeOption = ({
  x,
  y,
  width,
  height,
  themeId,
  selected,
  onSelect,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  themeId: ThemeId;
  selected: boolean;
  onSelect: (id: ThemeId) => void;
}) => {
  const meta = THEME_META[themeId];

  const drawBg = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.setFillStyle({ color: selected ? 0x3b82f6 : 0x0f172a, alpha: selected ? 0.9 : 0.6 });
      g.roundRect(0, 0, width, height, 8);
      g.fill();
      g.setStrokeStyle({ width: selected ? 2 : 1, color: selected ? 0x60a5fa : 0x475569, alpha: selected ? 1 : 0.5 });
      g.roundRect(0, 0, width, height, 8);
      g.stroke();
    },
    [width, height, selected]
  );

  const labelStyle = useMemo(
    () => ({ fontFamily: FONT_TITLE, fontSize: 11, fill: selected ? 0xffffff : 0x94a3b8 }),
    [selected]
  );

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics
        draw={drawBg}
        eventMode="static"
        cursor="pointer"
        onPointerDown={() => onSelect(themeId)}
      />
      <pixiText
        text={meta.icon}
        x={width / 2}
        y={height * 0.35}
        anchor={0.5}
        style={{ fontSize: 18 }}
        eventMode="none"
      />
      <pixiText
        text={meta.name}
        x={width / 2}
        y={height * 0.75}
        anchor={0.5}
        style={labelStyle}
        eventMode="none"
      />
    </pixiContainer>
  );
};

// ============================================================================
// THEME SELECTOR (grid of 10 themes)
// ============================================================================

const THEME_GRID_COLS = 5;
const THEME_GRID_GAP = 8;
const THEME_OPTION_H = 56;

export function getThemeSelectorHeight(): number {
  const rows = Math.ceil(THEME_IDS.length / THEME_GRID_COLS);
  return 28 + rows * THEME_OPTION_H + (rows - 1) * THEME_GRID_GAP + 12;
}

const ThemeSelector = ({
  y,
  width,
  currentTheme,
  onSelect,
}: {
  y: number;
  width: number;
  currentTheme: string;
  onSelect: (theme: ThemeId) => void;
}) => {
  const innerW = width - 32;
  const optionW = (innerW - (THEME_GRID_COLS - 1) * THEME_GRID_GAP) / THEME_GRID_COLS;
  const rows = Math.ceil(THEME_IDS.length / THEME_GRID_COLS);
  const panelH = 28 + rows * THEME_OPTION_H + (rows - 1) * THEME_GRID_GAP + 12;

  const drawBg = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.setFillStyle({ color: 0x1e293b, alpha: 0.85 });
      g.roundRect(0, 0, width, panelH, 12);
      g.fill();
    },
    [width, panelH]
  );

  return (
    <pixiContainer y={y}>
      <pixiGraphics draw={drawBg} eventMode="none" />
      <pixiText text="Theme" x={16} y={6} style={THEME_HEADER_STYLE} eventMode="none" />
      <pixiContainer x={16} y={28}>
        {THEME_IDS.map((id, i) => {
          const col = i % THEME_GRID_COLS;
          const row = Math.floor(i / THEME_GRID_COLS);
          return (
            <ThemeOption
              key={id}
              x={col * (optionW + THEME_GRID_GAP)}
              y={row * (THEME_OPTION_H + THEME_GRID_GAP)}
              width={optionW}
              height={THEME_OPTION_H}
              themeId={id}
              selected={currentTheme === id}
              onSelect={onSelect}
            />
          );
        })}
      </pixiContainer>
    </pixiContainer>
  );
};

// ============================================================================
// SECTION HEADER
// ============================================================================

const SectionHeader = ({ y, title }: { y: number; title: string }) => {
  return (
    <pixiText
      text={title}
      x={0}
      y={y}
      anchor={{ x: 0, y: 0 }}
      style={SECTION_HEADER_STYLE}
      eventMode="none"
    />
  );
};

// ============================================================================
// SETTINGS PAGE
// ============================================================================

interface SettingsPageProps {
  screenWidth: number;
  screenHeight: number;
  topBarHeight: number;
  musicVolume?: number;
  effectsVolume?: number;
  onMusicVolumeChange?: (v: number) => void;
  onEffectsVolumeChange?: (v: number) => void;
  username?: string;
  walletAddress?: string;
}

export const SettingsPage = ({
  screenWidth,
  screenHeight: _screenHeight,
  topBarHeight,
  musicVolume = 0.5,
  effectsVolume = 0.5,
  onMusicVolumeChange,
  onEffectsVolumeChange,
  username,
  walletAddress,
}: SettingsPageProps) => {
  const { themeTemplate, setThemeTemplate } = useTheme();
  const contentPadding = 20;
  const contentTop = topBarHeight + contentPadding;
  const contentWidth = screenWidth - contentPadding * 2;

  const truncatedAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : 'Not connected';

  const rowGap = 12;
  const sectionGap = 24;
  const sliderH = 60;
  const rowH = 50;
  const themePanelH = getThemeSelectorHeight();

  let cy = 0;

  const audioHeaderY = cy; cy += 24;
  const musicSliderY = cy; cy += sliderH + rowGap;
  const sfxSliderY = cy; cy += sliderH + sectionGap;

  const themeHeaderY = cy; cy += 24;
  const themeSelectorY = cy; cy += themePanelH + sectionGap;

  const accountHeaderY = cy; cy += 24;
  const usernameY = cy; cy += rowH + rowGap;
  const walletY = cy; cy += rowH + 40;

  const versionY = cy;

  return (
    <pixiContainer>
      <PageTopBar
         title="SETTINGS"
         subtitle="CUSTOMIZE YOUR EXPERIENCE"
         screenWidth={screenWidth}
         topBarHeight={topBarHeight}
       />

      <pixiContainer x={contentPadding} y={contentTop}>
        <SectionHeader y={audioHeaderY} title="AUDIO" />

        <VolumeSlider
          x={0}
          y={musicSliderY}
          value={musicVolume}
          onChange={onMusicVolumeChange ?? (() => {})}
          label="MUSIC"
          width={contentWidth}
        />
        <VolumeSlider
          x={0}
          y={sfxSliderY}
          value={effectsVolume}
          onChange={onEffectsVolumeChange ?? (() => {})}
          label="SOUND EFFECTS"
          width={contentWidth}
        />

        <SectionHeader y={themeHeaderY} title="APPEARANCE" />

        <ThemeSelector
          y={themeSelectorY}
          width={contentWidth}
          currentTheme={themeTemplate}
          onSelect={setThemeTemplate}
        />

        <SectionHeader y={accountHeaderY} title="ACCOUNT" />

         <SettingRow
           y={usernameY}
           label="USERNAME"
           value={username || 'GUEST'}
           width={contentWidth}
         />

         <SettingRow
           y={walletY}
           label="WALLET"
           value={truncatedAddress}
           width={contentWidth}
         />

        <pixiText
          text="zKube v1.2.0"
          x={contentWidth / 2}
          y={versionY}
          anchor={{ x: 0.5, y: 0 }}
          style={VERSION_STYLE}
          eventMode="none"
        />

        <pixiText
          text="Built on Starknet with Dojo"
          x={contentWidth / 2}
          y={versionY + 20}
          anchor={{ x: 0.5, y: 0 }}
          style={FOOTER_STYLE}
          eventMode="none"
        />
      </pixiContainer>
    </pixiContainer>
  );
};

export default SettingsPage;
