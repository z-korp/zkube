/**
 * LoadoutPage - Full-screen page for selecting bonuses before starting a game.
 *
 * Features:
 * - Select 3 bonuses from available bonuses
 * - Cube bridging slider (if player has bridging rank)
 * - Remembers last loadout in localStorage
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { Graphics as PixiGraphics, Assets, Texture } from "pixi.js";
import { PageTopBar } from "./PageTopBar";
import { Button } from "../ui";
import { usePixiTheme } from "../../themes/ThemeContext";
import type { PlayerMetaData } from "@/hooks/usePlayerMeta";
import { BonusType, bonusTypeToContractValue } from "@/dojo/game/types/bonus";
import { FONT_TITLE, FONT_BODY } from '../../utils/colors';

// ============================================================================
// CONSTANTS
// ============================================================================

const LOADOUT_STORAGE_KEY = "zkube_loadout";


// ============================================================================
// TYPES
// ============================================================================

interface LoadoutData {
  selectedBonuses: BonusType[];
  cubesToBring: number;
}

export interface LoadoutPageProps {
  onConfirm: (selectedBonuses: number[], cubesToBring: number) => void;
  onCancel: () => void;
  playerMetaData: PlayerMetaData | null;
  cubeBalance: number;
  isLoading?: boolean;
  screenWidth: number;
  screenHeight: number;
  topBarHeight: number;
}

// ============================================================================
// HELPERS
// ============================================================================

const ALL_BONUSES: BonusType[] = [
  BonusType.Hammer,
  BonusType.Totem,
  BonusType.Wave,
  BonusType.Shrink,
  BonusType.Shuffle,
];

const DEFAULT_BONUSES: BonusType[] = [
  BonusType.Hammer,
  BonusType.Wave,
  BonusType.Totem,
];

const loadSavedLoadout = (): LoadoutData | null => {
  try {
    const saved = localStorage.getItem(LOADOUT_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn("Failed to load loadout:", e);
  }
  return null;
};

const saveLoadout = (loadout: LoadoutData) => {
  try {
    localStorage.setItem(LOADOUT_STORAGE_KEY, JSON.stringify(loadout));
  } catch (e) {
    console.warn("Failed to save loadout:", e);
  }
};

const getMaxCubesForRank = (rank: number): number => {
  if (rank === 0) return 0;
  return 5 * Math.pow(2, rank - 1);
};

const getBonusTexturePath = (bonus: BonusType, basePath: string): string => {
  switch (bonus) {
    case BonusType.Hammer:
      return `${basePath}/bonus/hammer.png`;
    case BonusType.Totem:
      return `${basePath}/bonus/tiki.png`;
    case BonusType.Wave:
      return `${basePath}/bonus/wave.png`;
    case BonusType.Shrink:
      return `${basePath}/bonus/shrink.png`;
    case BonusType.Shuffle:
      return `${basePath}/bonus/shuffle.png`;
    default:
      return "";
  }
};

const getBonusName = (bonus: BonusType): string => {
  switch (bonus) {
    case BonusType.Hammer:
      return "Hammer";
    case BonusType.Totem:
      return "Totem";
    case BonusType.Wave:
      return "Wave";
    case BonusType.Shrink:
      return "Shrink";
    case BonusType.Shuffle:
      return "Shuffle";
    default:
      return "";
  }
};

// ============================================================================
// TEXTURE HOOK
// ============================================================================

function useTexture(path: string): Texture | null {
  const [tex, setTex] = useState<Texture | null>(null);
  useEffect(() => {
    if (!path) {
      setTex(null);
      return;
    }
    Assets.load(path)
      .then((t) => setTex(t as Texture))
      .catch(() => setTex(null));
  }, [path]);
  return tex;
}

// ============================================================================
// BONUS TILE COMPONENT
// ============================================================================

const BonusTile = ({
  bonus,
  x,
  y,
  size,
  isSelected,
  isLocked,
  onPress,
}: {
  bonus: BonusType;
  x: number;
  y: number;
  size: number;
  isSelected: boolean;
  isLocked: boolean;
  onPress: () => void;
}) => {
  const { themeName } = usePixiTheme();
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  const tex = useTexture(getBonusTexturePath(bonus, `/assets/${themeName}`));

  const bgColor = isSelected ? 0x22c55e : isLocked ? 0x4b5563 : 0x1e293b;
  const borderColor = isSelected ? 0x4ade80 : isLocked ? 0x6b7280 : 0x475569;
  const scale = pressed ? 0.95 : hovered && !isLocked ? 1.05 : 1;

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      const r = 14;
      // Shadow
      g.setFillStyle({ color: 0x000000, alpha: 0.3 });
      g.roundRect(4, 5, size, size, r);
      g.fill();
      // Background
      g.setFillStyle({ color: bgColor });
      g.roundRect(0, 0, size, size, r);
      g.fill();
      // Border
      g.setStrokeStyle({ width: 3, color: borderColor });
      g.roundRect(0, 0, size, size, r);
      g.stroke();
      // Lock overlay
      if (isLocked) {
        g.setFillStyle({ color: 0x000000, alpha: 0.5 });
        g.roundRect(0, 0, size, size, r);
        g.fill();
      }
    },
    [size, bgColor, borderColor, isLocked]
  );

  return (
    <pixiContainer x={x} y={y} scale={scale}>
      <pixiGraphics
        draw={draw}
        eventMode={isLocked ? "none" : "static"}
        cursor={isLocked ? "not-allowed" : "pointer"}
        onPointerDown={() => !isLocked && setPressed(true)}
        onPointerUp={() => {
          setPressed(false);
          if (!isLocked) onPress();
        }}
        onPointerUpOutside={() => setPressed(false)}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => {
          setHovered(false);
          setPressed(false);
        }}
      />
      {tex && (
        <pixiSprite
          texture={tex}
          x={size / 2}
          y={size / 2 - 10}
          anchor={0.5}
          width={size * 0.55}
          height={size * 0.55}
          alpha={isLocked ? 0.4 : 1}
        />
      )}
      <pixiText
        text={getBonusName(bonus)}
        x={size / 2}
        y={size - 14}
        anchor={0.5}
        style={{
          fontFamily: FONT_BODY,
          fontSize: 12,
          fill: isLocked ? 0x9ca3af : 0xffffff,
        }}
      />
      {isLocked && (
        <pixiText
          text="🔒"
          x={size / 2}
          y={size / 2}
          anchor={0.5}
          style={{ fontSize: 24 }}
        />
      )}
    </pixiContainer>
  );
};

// ============================================================================
// SLIDER COMPONENT
// ============================================================================

const CubeSlider = ({
  x,
  y,
  width,
  value,
  max,
  onChange,
}: {
  x: number;
  y: number;
  width: number;
  value: number;
  max: number;
  onChange: (val: number) => void;
}) => {
  const [dragging, setDragging] = useState(false);
  const trackHeight = 10;
  const knobRadius = 16;

  const fillWidth = max > 0 ? (value / max) * width : 0;
  const knobX = fillWidth;

  const handlePointerMove = useCallback(
    (e: any) => {
      if (!dragging || max === 0) return;
      const localX = e.data.global.x - x;
      const clampedX = Math.max(0, Math.min(localX, width));
      const newValue = Math.round((clampedX / width) * max);
      onChange(newValue);
    },
    [dragging, max, width, x, onChange]
  );

  const drawTrack = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      // Background track
      g.setFillStyle({ color: 0x334155 });
      g.roundRect(0, knobRadius - trackHeight / 2, width, trackHeight, 5);
      g.fill();
      // Filled portion
      if (fillWidth > 0) {
        g.setFillStyle({ color: 0x3b82f6 });
        g.roundRect(0, knobRadius - trackHeight / 2, fillWidth, trackHeight, 5);
        g.fill();
      }
    },
    [width, fillWidth, knobRadius, trackHeight]
  );

  const drawKnob = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.setFillStyle({ color: 0xffffff });
      g.circle(0, 0, knobRadius);
      g.fill();
      g.setStrokeStyle({ width: 3, color: 0x3b82f6 });
      g.circle(0, 0, knobRadius);
      g.stroke();
    },
    [knobRadius]
  );

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics
        draw={drawTrack}
        eventMode="static"
        cursor="pointer"
        onPointerDown={(e: any) => {
          setDragging(true);
          handlePointerMove(e);
        }}
        onGlobalPointerMove={handlePointerMove}
        onPointerUp={() => setDragging(false)}
        onPointerUpOutside={() => setDragging(false)}
      />
      <pixiGraphics
        draw={drawKnob}
        x={knobX}
        y={knobRadius}
        eventMode="static"
        cursor="grab"
        onPointerDown={() => setDragging(true)}
      />
      <pixiText
        text={`${value}`}
        x={width + 20}
        y={knobRadius}
        anchor={{ x: 0, y: 0.5 }}
        style={{
          fontFamily: FONT_TITLE,
          fontSize: 18,
          fill: 0xffffff,
        }}
      />
    </pixiContainer>
  );
};

// ============================================================================
// LOADOUT PAGE
// ============================================================================

export const LoadoutPage = ({
  onConfirm,
  onCancel,
  playerMetaData,
  cubeBalance,
  isLoading = false,
  screenWidth,
  screenHeight,
  topBarHeight,
}: LoadoutPageProps) => {
  // Load saved loadout or use defaults
  const savedLoadout = useMemo(() => loadSavedLoadout(), []);

  const [selected, setSelected] = useState<BonusType[]>(
    savedLoadout?.selectedBonuses ?? DEFAULT_BONUSES
  );
  const [cubesToBring, setCubesToBring] = useState(
    savedLoadout?.cubesToBring ?? 0
  );

  // Bridging rank and max cubes
  const bridgingRank = playerMetaData?.bridgingRank ?? 0;
  const maxCubesAllowed = getMaxCubesForRank(bridgingRank);
  const actualMaxCubes = Math.min(maxCubesAllowed, cubeBalance);
  const canBringCubes = bridgingRank > 0 && cubeBalance > 0;

  // Reset state when page opens
  useEffect(() => {
    const saved = loadSavedLoadout();
    if (saved) {
      // Filter out any bonuses that are no longer unlocked
      const validBonuses = saved.selectedBonuses.filter((b) => {
        if (b === BonusType.Shrink) return playerMetaData?.shrinkUnlocked;
        if (b === BonusType.Shuffle) return playerMetaData?.shuffleUnlocked;
        return true;
      });
      // Ensure we have 3 bonuses
      while (validBonuses.length < 3) {
        const next = DEFAULT_BONUSES.find((b) => !validBonuses.includes(b));
        if (next) validBonuses.push(next);
        else break;
      }
      setSelected(validBonuses.slice(0, 3));
      // Clamp cubes
      setCubesToBring(Math.min(saved.cubesToBring, actualMaxCubes));
    } else {
      setSelected(DEFAULT_BONUSES);
      setCubesToBring(0);
    }
  }, [playerMetaData, actualMaxCubes]);

  // Available bonuses
  const availableBonuses = useMemo(() => {
    return ALL_BONUSES.filter((b) => {
      if (b === BonusType.Shrink) return playerMetaData?.shrinkUnlocked;
      if (b === BonusType.Shuffle) return playerMetaData?.shuffleUnlocked;
      return true;
    });
  }, [playerMetaData]);

  // Toggle bonus selection
  const toggleBonus = useCallback(
    (bonus: BonusType) => {
      if (!availableBonuses.includes(bonus)) return;

      setSelected((prev) => {
        if (prev.includes(bonus)) {
          // Don't allow less than 3 if we have enough available
          if (prev.length <= 3 && availableBonuses.length >= 3) {
            return prev;
          }
          return prev.filter((b) => b !== bonus);
        } else {
          // Max 3 bonuses
          if (prev.length >= 3) {
            // Replace the last one
            return [...prev.slice(0, 2), bonus];
          }
          return [...prev, bonus];
        }
      });
    },
    [availableBonuses]
  );

  // Handle confirm
  const handleConfirm = useCallback(() => {
    // Save loadout
    saveLoadout({ selectedBonuses: selected, cubesToBring });

    // Convert to contract values
    const bonusValues = selected.map((b) => bonusTypeToContractValue(b));

    onConfirm(bonusValues, cubesToBring);
  }, [selected, cubesToBring, onConfirm]);

  // Layout
  const contentPadding = 24;
  const contentTop = topBarHeight + 40;
  const contentWidth = screenWidth - contentPadding * 2;
  const tileSize = Math.min(80, (contentWidth - 4 * 16) / 5);
  const tileGap = 16;

  return (
    <pixiContainer>
      {/* Top bar */}
      <PageTopBar
        title="Select Loadout"
        subtitle="Choose 3 bonuses for your run"
        screenWidth={screenWidth}
        topBarHeight={topBarHeight}
        showCubeBalance
        cubeBalance={cubeBalance}
      />

      {/* Content */}
      <pixiContainer x={contentPadding} y={contentTop}>
        {/* Section: Bonuses */}
        <pixiText
          text="Bonuses"
          x={contentWidth / 2}
          y={0}
          anchor={{ x: 0.5, y: 0 }}
          style={{
            fontFamily: FONT_TITLE,
            fontSize: 20,
            fill: 0xffffff,
            dropShadow: {
              alpha: 0.3,
              angle: Math.PI / 4,
              blur: 2,
              distance: 1,
              color: 0x000000,
            },
          }}
        />

        {/* Bonus tiles */}
        <pixiContainer x={(contentWidth - (5 * tileSize + 4 * tileGap)) / 2} y={36}>
          {ALL_BONUSES.map((bonus, idx) => {
            const isLocked = !availableBonuses.includes(bonus);
            const isSelected = selected.includes(bonus);
            const col = idx % 5;
            const tileX = col * (tileSize + tileGap);
            return (
              <BonusTile
                key={bonus}
                bonus={bonus}
                x={tileX}
                y={0}
                size={tileSize}
                isSelected={isSelected}
                isLocked={isLocked}
                onPress={() => toggleBonus(bonus)}
              />
            );
          })}
        </pixiContainer>

        {/* Cube Bridging Section */}
        {canBringCubes && (
          <pixiContainer y={36 + tileSize + 40}>
            <pixiText
              text={`Bring Cubes (max ${actualMaxCubes})`}
              x={contentWidth / 2}
              y={0}
              anchor={{ x: 0.5, y: 0 }}
              style={{
                fontFamily: FONT_TITLE,
                fontSize: 18,
                fill: 0xffffff,
              }}
            />
            <CubeSlider
              x={20}
              y={36}
              width={contentWidth - 100}
              value={cubesToBring}
              max={actualMaxCubes}
              onChange={setCubesToBring}
            />
          </pixiContainer>
        )}

        {/* Buttons */}
        <pixiContainer y={canBringCubes ? 36 + tileSize + 40 + 90 : 36 + tileSize + 50}>
          <Button
            text={isLoading ? "Starting..." : "Start Game"}
            x={0}
            y={0}
            width={contentWidth}
            height={56}
            variant="primary"
            fontSize={18}
            onClick={handleConfirm}
            disabled={isLoading || selected.length !== 3}
          />

          <Button
            text="Cancel"
            x={0}
            y={68}
            width={contentWidth}
            height={48}
            variant="secondary"
            fontSize={16}
            onClick={onCancel}
            disabled={isLoading}
          />
        </pixiContainer>
      </pixiContainer>
    </pixiContainer>
  );
};

export default LoadoutPage;
