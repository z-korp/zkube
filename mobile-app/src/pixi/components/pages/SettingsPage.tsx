/**
 * SettingsPage - Full-screen settings page
 * Shows: Sound toggle, music toggle, account info
 */

import { useState, useCallback } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { PageTopBar } from './PageTopBar';

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
  const contentPadding = 20;
  const contentTop = topBarHeight + contentPadding;
  const contentWidth = screenWidth - contentPadding * 2;

  // Truncate wallet address for display
  const truncatedAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : 'Not connected';

  const rowGap = 12;
  const sectionGap = 24;

  return (
    <pixiContainer>
      {/* Top bar */}
      <PageTopBar
        title="Settings"
        subtitle="Game options"
        screenWidth={screenWidth}
        topBarHeight={topBarHeight}
      />

      {/* Content */}
      <pixiContainer x={contentPadding} y={contentTop}>
        {/* Audio Section */}
        <SectionHeader y={0} title="AUDIO" />

        <ToggleSwitch
          x={0}
          y={24}
          isOn={isSoundEnabled}
          onToggle={onToggleSound ?? (() => {})}
          label="Sound Effects"
          width={contentWidth}
        />

        <ToggleSwitch
          x={0}
          y={24 + 50 + rowGap}
          isOn={isMusicEnabled}
          onToggle={onToggleMusic ?? (() => {})}
          label="Music"
          width={contentWidth}
        />

        {/* Account Section */}
        <SectionHeader y={24 + (50 + rowGap) * 2 + sectionGap} title="ACCOUNT" />

        <SettingRow
          y={24 + (50 + rowGap) * 2 + sectionGap + 24}
          label="Username"
          value={username || 'Guest'}
          width={contentWidth}
        />

        <SettingRow
          y={24 + (50 + rowGap) * 2 + sectionGap + 24 + 50 + rowGap}
          label="Wallet"
          value={truncatedAddress}
          width={contentWidth}
        />

        {/* Version Info */}
        <pixiText
          text="zKube v1.2.0"
          x={contentWidth / 2}
          y={24 + (50 + rowGap) * 2 + sectionGap + 24 + (50 + rowGap) * 2 + 40}
          anchor={{ x: 0.5, y: 0 }}
          style={{ fontFamily: 'Arial, sans-serif', fontSize: 12, fill: 0x475569 }}
        />

        <pixiText
          text="Built on Starknet with Dojo"
          x={contentWidth / 2}
          y={24 + (50 + rowGap) * 2 + sectionGap + 24 + (50 + rowGap) * 2 + 60}
          anchor={{ x: 0.5, y: 0 }}
          style={{ fontFamily: 'Arial, sans-serif', fontSize: 11, fill: 0x475569 }}
        />
      </pixiContainer>
    </pixiContainer>
  );
};

export default SettingsPage;
