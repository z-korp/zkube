/**
 * SettingsPage - Full-screen settings page
 * Shows: Sound toggle, music toggle, account info
 */

import { useState, useCallback } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { PageTopBar } from './PageTopBar';
import { useTheme } from '@/ui/elements/theme-provider/hooks';

const FONT = 'Fredericka the Great, Bangers, Arial Black, sans-serif';

// ============================================================================
// TOGGLE SWITCH
// ============================================================================

const ToggleSwitch = ({
  x,
  y,
  isOn,
  onToggle,
  label,
  width = 280,
}: {
  x: number;
  y: number;
  isOn: boolean;
  onToggle: () => void;
  label: string;
  width?: number;
}) => {
  const [hovered, setHovered] = useState(false);
  const switchW = 56;
  const switchH = 30;
  const knobSize = 24;
  const rowH = 50;

  const drawRow = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.setFillStyle({ color: 0x1e293b, alpha: 0.85 });
      g.roundRect(0, 0, width, rowH, 12);
      g.fill();
    },
    [width]
  );

  const drawSwitch = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      // Track
      const trackColor = isOn ? 0x22c55e : 0x475569;
      g.setFillStyle({ color: trackColor, alpha: hovered ? 1 : 0.9 });
      g.roundRect(0, 0, switchW, switchH, switchH / 2);
      g.fill();
      // Knob
      const knobX = isOn ? switchW - knobSize - 3 : 3;
      g.setFillStyle({ color: 0xffffff, alpha: 1 });
      g.circle(knobX + knobSize / 2, switchH / 2, knobSize / 2);
      g.fill();
    },
    [isOn, hovered]
  );

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics draw={drawRow} />
      {/* Label */}
      <pixiText
        text={label}
        x={16}
        y={rowH / 2}
        anchor={{ x: 0, y: 0.5 }}
        style={{ fontFamily: FONT, fontSize: 16, fill: 0xffffff }}
      />
      {/* Switch */}
      <pixiGraphics
        x={width - switchW - 12}
        y={(rowH - switchH) / 2}
        draw={drawSwitch}
        eventMode="static"
        cursor="pointer"
        onPointerDown={onToggle}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      />
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
        style={{ fontFamily: 'Arial, sans-serif', fontSize: 14, fill: 0x94a3b8 }}
      />
      <pixiText
        text={value}
        x={width - 16}
        y={rowH / 2}
        anchor={{ x: 1, y: 0.5 }}
        style={{ fontFamily: 'Arial, sans-serif', fontSize: 14, fill: 0xffffff }}
      />
    </pixiContainer>
  );
};

// ============================================================================
// THEME SELECTOR
// ============================================================================

const ThemeSelector = ({
  y,
  width,
  currentTheme,
  onSelect,
}: {
  y: number;
  width: number;
  currentTheme: string;
  onSelect: (theme: 'theme-1' | 'theme-2') => void;
}) => {
  const rowH = 56;
  const optionW = (width - 16 * 3) / 2;
  const optionH = 40;

  const drawBg = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.setFillStyle({ color: 0x1e293b, alpha: 0.85 });
      g.roundRect(0, 0, width, rowH, 12);
      g.fill();
    },
    [width]
  );

  const drawOption = useCallback(
    (g: PixiGraphics, selected: boolean) => {
      g.clear();
      g.setFillStyle({ color: selected ? 0x3b82f6 : 0x0f172a, alpha: selected ? 0.9 : 0.6 });
      g.roundRect(0, 0, optionW, optionH, 8);
      g.fill();
      g.setStrokeStyle({ width: selected ? 2 : 1, color: selected ? 0x60a5fa : 0x475569, alpha: selected ? 1 : 0.5 });
      g.roundRect(0, 0, optionW, optionH, 8);
      g.stroke();
    },
    [optionW, optionH]
  );

  const isTheme1 = currentTheme === 'theme-1';
  const isTheme2 = currentTheme === 'theme-2';

  return (
    <pixiContainer y={y}>
      <pixiGraphics draw={drawBg} />
      <pixiText
        text="Theme"
        x={16}
        y={8}
        style={{ fontFamily: FONT, fontSize: 14, fill: 0xffffff }}
      />
      <pixiContainer y={rowH - optionH - 8}>
        <pixiGraphics
          x={16}
          y={0}
          draw={(g) => drawOption(g, isTheme1)}
          eventMode="static"
          cursor="pointer"
          onPointerDown={() => onSelect('theme-1')}
        />
        <pixiText
          text="Tiki"
          x={16 + optionW / 2}
          y={optionH / 2}
          anchor={0.5}
          style={{ fontFamily: FONT, fontSize: 13, fill: isTheme1 ? 0xffffff : 0x94a3b8 }}
        />

        <pixiGraphics
          x={16 + optionW + 16}
          y={0}
          draw={(g) => drawOption(g, isTheme2)}
          eventMode="static"
          cursor="pointer"
          onPointerDown={() => onSelect('theme-2')}
        />
        <pixiText
          text="Tropical"
          x={16 + optionW + 16 + optionW / 2}
          y={optionH / 2}
          anchor={0.5}
          style={{ fontFamily: FONT, fontSize: 13, fill: isTheme2 ? 0xffffff : 0x94a3b8 }}
        />
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
      style={{ fontFamily: 'Arial, sans-serif', fontSize: 12, fill: 0x64748b, letterSpacing: 2 }}
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
  isSoundEnabled?: boolean;
  isMusicEnabled?: boolean;
  onToggleSound?: () => void;
  onToggleMusic?: () => void;
  username?: string;
  walletAddress?: string;
}

export const SettingsPage = ({
  screenWidth,
  screenHeight,
  topBarHeight,
  isSoundEnabled = true,
  isMusicEnabled = true,
  onToggleSound,
  onToggleMusic,
  username,
  walletAddress,
}: SettingsPageProps) => {
  const { themeTemplate, setThemeTemplate } = useTheme();
  const contentPadding = 20;
  const contentTop = topBarHeight + contentPadding;
  const contentWidth = screenWidth - contentPadding * 2;

  // Truncate wallet address for display
  const truncatedAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : 'Not connected';

  const rowGap = 12;
  const sectionGap = 24;
  const rowH = 50;
  const themeRowH = 56;

  let cy = 0;

  const audioHeaderY = cy; cy += 24;
  const soundY = cy; cy += rowH + rowGap;
  const musicY = cy; cy += rowH + sectionGap;

  const themeHeaderY = cy; cy += 24;
  const themeSelectorY = cy; cy += themeRowH + sectionGap;

  const accountHeaderY = cy; cy += 24;
  const usernameY = cy; cy += rowH + rowGap;
  const walletY = cy; cy += rowH + 40;

  const versionY = cy;

  return (
    <pixiContainer>
      <PageTopBar
        title="Settings"
        subtitle="Game options"
        screenWidth={screenWidth}
        topBarHeight={topBarHeight}
      />

      <pixiContainer x={contentPadding} y={contentTop}>
        <SectionHeader y={audioHeaderY} title="AUDIO" />

        <ToggleSwitch
          x={0}
          y={soundY}
          isOn={isSoundEnabled}
          onToggle={onToggleSound ?? (() => {})}
          label="Sound Effects"
          width={contentWidth}
        />

        <ToggleSwitch
          x={0}
          y={musicY}
          isOn={isMusicEnabled}
          onToggle={onToggleMusic ?? (() => {})}
          label="Music"
          width={contentWidth}
        />

        <SectionHeader y={themeHeaderY} title="APPEARANCE" />

        <ThemeSelector
          y={themeSelectorY}
          width={contentWidth}
          currentTheme={themeTemplate}
          onSelect={(t) => setThemeTemplate(t)}
        />

        <SectionHeader y={accountHeaderY} title="ACCOUNT" />

        <SettingRow
          y={usernameY}
          label="Username"
          value={username || 'Guest'}
          width={contentWidth}
        />

        <SettingRow
          y={walletY}
          label="Wallet"
          value={truncatedAddress}
          width={contentWidth}
        />

        <pixiText
          text="zKube v1.2.0"
          x={contentWidth / 2}
          y={versionY}
          anchor={{ x: 0.5, y: 0 }}
          style={{ fontFamily: 'Arial, sans-serif', fontSize: 12, fill: 0x475569 }}
        />

        <pixiText
          text="Built on Starknet with Dojo"
          x={contentWidth / 2}
          y={versionY + 20}
          anchor={{ x: 0.5, y: 0 }}
          style={{ fontFamily: 'Arial, sans-serif', fontSize: 11, fill: 0x475569 }}
        />
      </pixiContainer>
    </pixiContainer>
  );
};

export default SettingsPage;
