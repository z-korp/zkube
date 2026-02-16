import { useCallback, useMemo, useRef } from 'react';
import { Graphics as PixiGraphics, Rectangle } from 'pixi.js';
import { PageTopBar } from './PageTopBar';
import { useTheme } from '@/ui/elements/theme-provider/hooks';
import { FONT_TITLE, THEME_IDS, type ThemeId } from '../../utils/colors';
import { resolveAsset } from '../../assets/resolver';
import { AssetId } from '../../assets/catalog';
import { useTextureWithFallback } from '../../hooks/useTexture';

const THEME_GRID_COLS = 5;

const VolumeSlider = ({
  x, y, value, onChange, label, width = 280, s = 1,
}: {
  x: number; y: number; value: number; onChange: (v: number) => void;
  label: string; width?: number; s?: number;
}) => {
  const rowH = Math.round(60 * s);
  const trackH = Math.round(8 * s);
  const knobR = Math.round(12 * s);
  const padX = Math.round(16 * s);
  const labelH = Math.round(24 * s);
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
    [trackW, trackH, knobR, clampedValue],
  );

  const labelStyle = useMemo(() => ({ fontFamily: FONT_TITLE, fontSize: Math.round(16 * s), fill: 0xffffff }), [s]);
  const pctStyle = useMemo(() => ({ fontFamily: FONT_TITLE, fontSize: Math.round(13 * s), fill: 0x94a3b8 }), [s]);

  const onPointerDown = useCallback(
    (e: any) => {
      draggingRef.current = true;
      const container = e.currentTarget.parent;
      if (container) onChange(resolveValue(e.global.x, container.worldTransform.tx));
    },
    [onChange, resolveValue],
  );
  const onPointerMove = useCallback(
    (e: any) => {
      if (!draggingRef.current) return;
      const container = e.currentTarget.parent;
      if (container) onChange(resolveValue(e.global.x, container.worldTransform.tx));
    },
    [onChange, resolveValue],
  );
  const onPointerUp = useCallback(() => { draggingRef.current = false; }, []);

  return (
    <pixiContainer x={x} y={y}>
      <pixiText text={label} x={padX} y={Math.round(8 * s)} style={labelStyle} eventMode="none" />
      <pixiText text={`${pct}%`} x={width - padX} y={Math.round(8 * s)} anchor={{ x: 1, y: 0 }} style={pctStyle} eventMode="none" />
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

const SettingRow = ({
  y, label, value, width, s = 1,
}: {
  y: number; label: string; value: string; width: number; s?: number;
}) => {
  const rowH = Math.round(44 * s);
  const padX = Math.round(16 * s);
  const labelStyle = useMemo(() => ({ fontFamily: FONT_TITLE, fontSize: Math.round(14 * s), fill: 0x94a3b8 }), [s]);
  const valueStyle = useMemo(() => ({ fontFamily: FONT_TITLE, fontSize: Math.round(14 * s), fill: 0xffffff }), [s]);

  return (
    <pixiContainer y={y}>
      <pixiText text={label} x={padX} y={rowH / 2} anchor={{ x: 0, y: 0.5 }} style={labelStyle} eventMode="none" />
      <pixiText text={value} x={width - padX} y={rowH / 2} anchor={{ x: 1, y: 0.5 }} style={valueStyle} eventMode="none" />
    </pixiContainer>
  );
};

const ThemeOption = ({
  x, y, width, height, themeId, selected, onSelect,
}: {
  x: number; y: number; width: number; height: number;
  themeId: ThemeId; selected: boolean; onSelect: (id: ThemeId) => void;
}) => {
  const iconCandidates = useMemo(() => resolveAsset(themeId, AssetId.ThemeIcon), [themeId]);
  const iconTex = useTextureWithFallback(iconCandidates);

  const drawBg = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.setFillStyle({ color: selected ? 0x3b82f6 : 0x0f172a, alpha: selected ? 0.35 : 0.01 });
      g.roundRect(0, 0, width, height, 8);
      g.fill();
      g.setStrokeStyle({ width: selected ? 2 : 1, color: selected ? 0x60a5fa : 0x475569, alpha: selected ? 1 : 0.5 });
      g.roundRect(0, 0, width, height, 8);
      g.stroke();
    },
    [width, height, selected]
  );

  const iconSize = Math.min(width, height) * 0.7;

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics
        draw={drawBg} eventMode="static" cursor="pointer"
        hitArea={new Rectangle(0, 0, width, height)}
        onPointerDown={() => onSelect(themeId)}
      />
      {iconTex && (
        <pixiSprite texture={iconTex} x={width / 2} y={height / 2} anchor={0.5} width={iconSize} height={iconSize} eventMode="none" />
      )}
    </pixiContainer>
  );
};

const ThemeSelector = ({
  width, currentTheme, onSelect, s = 1,
}: {
  width: number; currentTheme: string; onSelect: (theme: ThemeId) => void; s?: number;
}) => {
  const gap = Math.round(8 * s);
  const padX = Math.round(16 * s);
  const innerW = width - padX * 2;
  const optionW = (innerW - (THEME_GRID_COLS - 1) * gap) / THEME_GRID_COLS;
  const optionH = Math.round(56 * s);

  return (
    <pixiContainer x={padX} y={0}>
      {THEME_IDS.map((id, i) => (
        <ThemeOption
          key={id}
          x={(i % THEME_GRID_COLS) * (optionW + gap)}
          y={Math.floor(i / THEME_GRID_COLS) * (optionH + gap)}
          width={optionW} height={optionH}
          themeId={id} selected={currentTheme === id} onSelect={onSelect}
        />
      ))}
    </pixiContainer>
  );
};

function getThemeGridHeight(s: number): number {
  const rows = Math.ceil(THEME_IDS.length / THEME_GRID_COLS);
  const gap = Math.round(8 * s);
  const optionH = Math.round(56 * s);
  return rows * optionH + (rows - 1) * gap;
}

const SectionPanel = ({
  y, width, height, title, s = 1, children,
}: {
  y: number; width: number; height: number; title: string; s?: number;
  children: React.ReactNode;
}) => {
  const radius = Math.round(12 * s);
  const drawBg = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.setFillStyle({ color: 0x0f172a, alpha: 0.92 });
      g.roundRect(0, 0, width, height, radius);
      g.fill();
      g.setStrokeStyle({ width: 1, color: 0x334155, alpha: 0.6 });
      g.roundRect(0, 0, width, height, radius);
      g.stroke();
    },
    [width, height, radius]
  );

  const titleStyle = useMemo(() => ({ fontFamily: FONT_TITLE, fontSize: Math.round(16 * s), fill: 0xffffff }), [s]);
  const padX = Math.round(16 * s);
  const titleY = Math.round(12 * s);
  const contentY = titleY + Math.round(24 * s);

  return (
    <pixiContainer y={y}>
      <pixiGraphics draw={drawBg} eventMode="none" />
      <pixiText text={title} x={padX} y={titleY} style={titleStyle} eventMode="none" />
      <pixiContainer y={contentY}>{children}</pixiContainer>
    </pixiContainer>
  );
};

interface SettingsPageProps {
  screenWidth: number;
  screenHeight: number;
  topBarHeight: number;
  uiScale?: number;
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
  uiScale = 1,
  musicVolume = 0.5,
  effectsVolume = 0.5,
  onMusicVolumeChange,
  onEffectsVolumeChange,
  username,
  walletAddress,
}: SettingsPageProps) => {
  const { themeTemplate, setThemeTemplate } = useTheme();
  const s = uiScale;

  const contentPadding = Math.round(20 * s);
  const contentTop = topBarHeight + Math.round(12 * s);
  const contentWidth = screenWidth - contentPadding * 2;

  const truncatedAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : 'Not connected';

  const sectionGap = Math.round(12 * s);
  const sliderH = Math.round(60 * s);
  const sliderGap = Math.round(8 * s);
  const rowH = Math.round(44 * s);
  const rowGap = Math.round(4 * s);
  const panelPad = Math.round(12 * s);
  const titleH = Math.round(36 * s);

  const themeGridH = getThemeGridHeight(s);

  const audioPanelH = panelPad + titleH + sliderH + sliderGap + sliderH + panelPad;
  const themePanelH = panelPad + titleH + themeGridH + panelPad;
  const accountPanelH = panelPad + titleH + rowH + rowGap + rowH + panelPad;

  let cy = 0;
  const audioY = cy; cy += audioPanelH + sectionGap;
  const themeY = cy; cy += themePanelH + sectionGap;
  const accountY = cy; cy += accountPanelH + sectionGap;
  const versionY = cy;

  const versionStyle = useMemo(() => ({ fontFamily: FONT_TITLE, fontSize: Math.round(12 * s), fill: 0x475569 }), [s]);
  const footerStyle = useMemo(() => ({ fontFamily: FONT_TITLE, fontSize: Math.round(11 * s), fill: 0x475569 }), [s]);

  return (
    <pixiContainer>
      <PageTopBar title="SETTINGS" screenWidth={screenWidth} topBarHeight={topBarHeight} />

      <pixiContainer x={contentPadding} y={contentTop}>
        <SectionPanel y={audioY} width={contentWidth} height={audioPanelH} title="AUDIO" s={s}>
          <VolumeSlider x={0} y={0} value={musicVolume} onChange={onMusicVolumeChange ?? (() => {})} label="MUSIC" width={contentWidth} s={s} />
          <VolumeSlider x={0} y={sliderH + sliderGap} value={effectsVolume} onChange={onEffectsVolumeChange ?? (() => {})} label="SOUND EFFECTS" width={contentWidth} s={s} />
        </SectionPanel>

        <SectionPanel y={themeY} width={contentWidth} height={themePanelH} title="THEME" s={s}>
          <ThemeSelector width={contentWidth} currentTheme={themeTemplate} onSelect={setThemeTemplate} s={s} />
        </SectionPanel>

        <SectionPanel y={accountY} width={contentWidth} height={accountPanelH} title="ACCOUNT" s={s}>
          <SettingRow y={0} label="USERNAME" value={username || 'GUEST'} width={contentWidth} s={s} />
          <SettingRow y={rowH + rowGap} label="WALLET" value={truncatedAddress} width={contentWidth} s={s} />
        </SectionPanel>

        <pixiText text="zKube v1.2.0" x={contentWidth / 2} y={versionY} anchor={{ x: 0.5, y: 0 }} style={versionStyle} eventMode="none" />
        <pixiText text="Built on Starknet with Dojo" x={contentWidth / 2} y={versionY + Math.round(20 * s)} anchor={{ x: 0.5, y: 0 }} style={footerStyle} eventMode="none" />
      </pixiContainer>
    </pixiContainer>
  );
};

export default SettingsPage;
