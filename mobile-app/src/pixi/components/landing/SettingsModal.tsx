/**
 * SettingsModal - PixiJS modal for game settings
 * Shows: Sound toggle, music toggle, account info
 */

import { useState, useCallback } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { Modal, Button } from '../ui';

const FONT = 'Fredericka the Great, Bangers, Arial Black, sans-serif';

// ============================================================================
// TYPES
// ============================================================================

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  screenWidth: number;
  screenHeight: number;
  // Sound settings
  isSoundEnabled?: boolean;
  isMusicEnabled?: boolean;
  onToggleSound?: () => void;
  onToggleMusic?: () => void;
  // Account info
  username?: string;
  walletAddress?: string;
}

// ============================================================================
// TOGGLE SWITCH
// ============================================================================

const ToggleSwitch = ({
  x,
  y,
  isOn,
  onToggle,
  label,
  width = 200,
}: {
  x: number;
  y: number;
  isOn: boolean;
  onToggle: () => void;
  label: string;
  width?: number;
}) => {
  const [hovered, setHovered] = useState(false);
  const switchW = 48;
  const switchH = 26;
  const knobSize = 20;

  const drawSwitch = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      // Track
      const trackColor = isOn ? 0x22C55E : 0x475569;
      g.setFillStyle({ color: trackColor, alpha: hovered ? 1 : 0.9 });
      g.roundRect(0, 0, switchW, switchH, switchH / 2);
      g.fill();
      // Knob
      const knobX = isOn ? switchW - knobSize - 3 : 3;
      g.setFillStyle({ color: 0xFFFFFF, alpha: 1 });
      g.circle(knobX + knobSize / 2, switchH / 2, knobSize / 2);
      g.fill();
    },
    [isOn, hovered]
  );

  return (
    <pixiContainer x={x} y={y}>
      {/* Label */}
      <pixiText
        text={label}
        x={0}
        y={switchH / 2}
        anchor={{ x: 0, y: 0.5 }}
        style={{ fontFamily: FONT, fontSize: 14, fill: 0xFFFFFF }}
      />
      {/* Switch */}
      <pixiGraphics
        x={width - switchW}
        y={0}
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
  const rowH = 32;

  const drawBg = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.setFillStyle({ color: 0x1E293B, alpha: 0.6 });
      g.roundRect(0, 0, width, rowH, 6);
      g.fill();
    },
    [width]
  );

  return (
    <pixiContainer y={y}>
      <pixiGraphics draw={drawBg} />
      <pixiText
        text={label}
        x={12}
        y={rowH / 2}
        anchor={{ x: 0, y: 0.5 }}
        style={{ fontFamily: 'Arial, sans-serif', fontSize: 12, fill: 0x94A3B8 }}
      />
      <pixiText
        text={value}
        x={width - 12}
        y={rowH / 2}
        anchor={{ x: 1, y: 0.5 }}
        style={{ fontFamily: 'Arial, sans-serif', fontSize: 12, fill: 0xFFFFFF }}
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
      style={{ fontFamily: 'Arial, sans-serif', fontSize: 11, fill: 0x64748B, letterSpacing: 1 }}
    />
  );
};

// ============================================================================
// SETTINGS MODAL
// ============================================================================

export const SettingsModal = ({
  isOpen,
  onClose,
  screenWidth,
  screenHeight,
  isSoundEnabled = true,
  isMusicEnabled = true,
  onToggleSound,
  onToggleMusic,
  username,
  walletAddress,
}: SettingsModalProps) => {
  const modalW = Math.min(340, screenWidth - 40);
  const contentW = modalW - 48;

  // Truncate wallet address for display
  const truncatedAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : 'Not connected';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      subtitle="Game options"
      width={modalW}
      screenWidth={screenWidth}
      screenHeight={screenHeight}
    >
      <pixiContainer x={24} y={0}>
        {/* Audio Section */}
        <SectionHeader y={0} title="AUDIO" />

        <ToggleSwitch
          x={0}
          y={20}
          isOn={isSoundEnabled}
          onToggle={onToggleSound ?? (() => {})}
          label="Sound Effects"
          width={contentW}
        />

        <ToggleSwitch
          x={0}
          y={60}
          isOn={isMusicEnabled}
          onToggle={onToggleMusic ?? (() => {})}
          label="Music"
          width={contentW}
        />

        {/* Account Section */}
        <SectionHeader y={110} title="ACCOUNT" />

        <SettingRow y={130} label="Username" value={username || 'Guest'} width={contentW} />

        <SettingRow y={170} label="Wallet" value={truncatedAddress} width={contentW} />

        {/* Version Info */}
        <pixiText
          text="zKube v1.2.0"
          x={contentW / 2}
          y={220}
          anchor={{ x: 0.5, y: 0 }}
          style={{ fontFamily: 'Arial, sans-serif', fontSize: 10, fill: 0x475569 }}
        />

        {/* Close button */}
        <Button
          text="Close"
          x={0}
          y={250}
          width={contentW}
          height={44}
          variant="secondary"
          fontSize={16}
          onClick={onClose}
        />
      </pixiContainer>
    </Modal>
  );
};

export default SettingsModal;
