/**
 * QuestsModal - PixiJS modal for daily quests
 * Shows quest families with progress bars and claim buttons
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { Modal, Button } from '../ui';
import type { QuestFamily, QuestTier } from '@/types/questFamily';

const FONT = 'Fredericka the Great, Bangers, Arial Black, sans-serif';

// ============================================================================
// TYPES
// ============================================================================

interface QuestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  questFamilies: QuestFamily[];
  loading: boolean;
  onClaim: (questId: string, intervalId: number) => Promise<void>;
  screenWidth: number;
  screenHeight: number;
}

// Family icons
const FAMILY_ICONS: Record<string, string> = {
  player: '\u{1F3AE}',   // Game controller
  clearer: '\u{1F4CA}',  // Bar chart
  combo: '\u{26A1}',     // Lightning
  finisher: '\u{1F3C6}', // Trophy
};

// ============================================================================
// COUNTDOWN TIMER
// ============================================================================

const CountdownTimer = ({ x, y }: { x: number; y: number }) => {
  const [timeLeft, setTimeLeft] = useState('00:00:00');

  useEffect(() => {
    const updateTime = () => {
      const now = Math.floor(Date.now() / 1000);
      const todayMidnight = Math.floor(now / 86400) * 86400;
      const nextMidnight = todayMidnight + 86400;
      const seconds = Math.max(0, nextMidnight - now);

      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <pixiText
      text={`Resets in ${timeLeft}`}
      x={x}
      y={y}
      anchor={{ x: 0.5, y: 0 }}
      style={{ fontFamily: 'Arial, sans-serif', fontSize: 10, fill: 0x64748B }}
    />
  );
};

// ============================================================================
// PROGRESS BAR
// ============================================================================

const ProgressBar = ({
  x,
  y,
  width,
  progress,
  target,
  color,
}: {
  x: number;
  y: number;
  width: number;
  progress: number;
  target: number;
  color: number;
}) => {
  const percent = target > 0 ? Math.min(progress / target, 1) : 1;
  const barH = 8;

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      // Track
      g.setFillStyle({ color: 0x1E293B, alpha: 1 });
      g.roundRect(0, 0, width, barH, 4);
      g.fill();
      // Fill
      if (percent > 0) {
        g.setFillStyle({ color, alpha: 1 });
        g.roundRect(0, 0, width * percent, barH, 4);
        g.fill();
      }
    },
    [width, percent, color]
  );

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics draw={draw} />
      <pixiText
        text={`${progress}/${target}`}
        x={width + 8}
        y={barH / 2}
        anchor={{ x: 0, y: 0.5 }}
        style={{ fontFamily: 'Arial, sans-serif', fontSize: 10, fill: 0x94A3B8 }}
      />
    </pixiContainer>
  );
};

// ============================================================================
// TIER ROW
// ============================================================================

const TierRow = ({
  tier,
  y,
  width,
  isClaimable,
}: {
  tier: QuestTier;
  y: number;
  width: number;
  isClaimable: boolean;
}) => {
  const rowH = 24;

  // Icon and color based on state
  let icon = '\u{26AA}'; // White circle (pending)
  let textColor = 0x94A3B8;
  let rewardColor = 0x64748B;

  if (tier.claimed) {
    icon = '\u{2705}'; // Check mark
    textColor = 0x64748B;
    rewardColor = 0x64748B;
  } else if (tier.completed) {
    icon = '\u{2705}'; // Check mark
    textColor = 0x22C55E;
    rewardColor = 0xFBBF24;
  } else if (tier.locked) {
    icon = '\u{1F512}'; // Lock
    textColor = 0x475569;
    rewardColor = 0x475569;
  }

  const drawBg = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      if (isClaimable) {
        g.setFillStyle({ color: 0x166534, alpha: 0.3 });
        g.roundRect(0, 0, width, rowH, 4);
        g.fill();
      }
    },
    [width, isClaimable]
  );

  return (
    <pixiContainer y={y}>
      <pixiGraphics draw={drawBg} />
      <pixiText text={icon} x={4} y={rowH / 2} anchor={{ x: 0, y: 0.5 }} style={{ fontSize: 12 }} />
      <pixiText
        text={`T${tier.tier}: ${tier.name}`}
        x={24}
        y={rowH / 2}
        anchor={{ x: 0, y: 0.5 }}
        style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: 11,
          fill: textColor,
          ...(tier.claimed && { textDecoration: 'line-through' }),
        }}
      />
      <pixiText
        text={`+${tier.reward}`}
        x={width - 4}
        y={rowH / 2}
        anchor={{ x: 1, y: 0.5 }}
        style={{ fontFamily: FONT, fontSize: 11, fill: rewardColor }}
      />
    </pixiContainer>
  );
};

// ============================================================================
// QUEST FAMILY CARD
// ============================================================================

const QuestFamilyCard = ({
  family,
  y,
  width,
  onClaim,
}: {
  family: QuestFamily;
  y: number;
  width: number;
  onClaim: (questId: string, intervalId: number) => Promise<void>;
}) => {
  const [isClaiming, setIsClaiming] = useState(false);

  const icon = FAMILY_ICONS[family.id] || '\u{2753}';
  const hasClaimable = family.claimableTier !== null;
  const allCompleted = family.tiers.every((t) => t.completed);
  const allClaimed = family.tiers.every((t) => t.claimed);

  // Calculate card height based on content
  const tierRowH = 24;
  const tiersHeight = family.tiers.length * tierRowH;
  const headerH = 36;
  const progressH = !allCompleted ? 20 : 0;
  const claimBtnH = hasClaimable ? 40 : 0;
  const cardPadding = 12;
  const cardH = headerH + tiersHeight + progressH + claimBtnH + cardPadding * 2;

  const drawCard = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.setFillStyle({ color: allClaimed ? 0x0F172A : 0x1E293B, alpha: 0.9 });
      g.roundRect(0, 0, width, cardH, 10);
      g.fill();
      if (hasClaimable) {
        g.setStrokeStyle({ width: 1, color: 0x22C55E, alpha: 0.5 });
        g.roundRect(0, 0, width, cardH, 10);
        g.stroke();
      }
    },
    [width, cardH, hasClaimable, allClaimed]
  );

  const handleClaim = useCallback(async () => {
    if (!family.claimableTier) return;
    setIsClaiming(true);
    try {
      await onClaim(family.claimableTier.questId, family.claimableTier.intervalId);
    } finally {
      setIsClaiming(false);
    }
  }, [family.claimableTier, onClaim]);

  // Progress color
  const progressColor = hasClaimable ? 0x22C55E : 0x3B82F6;

  return (
    <pixiContainer y={y}>
      <pixiGraphics draw={drawCard} />

      {/* Header: Icon + Name + Tier indicator */}
      <pixiContainer x={cardPadding} y={cardPadding}>
        <pixiText text={icon} x={0} y={10} anchor={{ x: 0, y: 0.5 }} style={{ fontSize: 18 }} />
        <pixiText
          text={family.name}
          x={28}
          y={10}
          anchor={{ x: 0, y: 0.5 }}
          style={{ fontFamily: FONT, fontSize: 14, fill: 0xFFFFFF }}
        />
        <pixiText
          text={`${family.currentTierIndex >= 0 ? family.currentTierIndex + 1 : family.totalTiers}/${family.totalTiers}`}
          x={width - cardPadding * 2}
          y={10}
          anchor={{ x: 1, y: 0.5 }}
          style={{ fontFamily: 'Arial, sans-serif', fontSize: 11, fill: allCompleted ? 0x22C55E : 0x64748B }}
        />
      </pixiContainer>

      {/* Tier rows */}
      <pixiContainer x={cardPadding} y={headerH}>
        {family.tiers.map((tier, i) => (
          <TierRow
            key={tier.questId}
            tier={tier}
            y={i * tierRowH}
            width={width - cardPadding * 2}
            isClaimable={family.claimableTier?.questId === tier.questId}
          />
        ))}
      </pixiContainer>

      {/* Progress bar (if not all completed) */}
      {!allCompleted && (
        <ProgressBar
          x={cardPadding}
          y={headerH + tiersHeight + 4}
          width={width - cardPadding * 2 - 50}
          progress={family.progress}
          target={family.nextTarget}
          color={progressColor}
        />
      )}

      {/* Claim button */}
      {hasClaimable && (
        <pixiContainer x={cardPadding} y={headerH + tiersHeight + progressH + 8}>
          <Button
            text={isClaiming ? 'Claiming...' : `Claim T${family.claimableTier!.tier} (+${family.claimableTier!.reward})`}
            width={width - cardPadding * 2}
            height={32}
            variant="primary"
            fontSize={12}
            onClick={handleClaim}
            disabled={isClaiming}
          />
        </pixiContainer>
      )}
    </pixiContainer>
  );
};

// ============================================================================
// SCROLLABLE QUEST LIST
// ============================================================================

const ScrollableQuestList = ({
  families,
  width,
  maxHeight,
  loading,
  onClaim,
}: {
  families: QuestFamily[];
  width: number;
  maxHeight: number;
  loading: boolean;
  onClaim: (questId: string, intervalId: number) => Promise<void>;
}) => {
  const [scrollY, setScrollY] = useState(0);
  const isDragging = useRef(false);
  const lastY = useRef(0);

  // Calculate card heights dynamically
  const getCardHeight = (family: QuestFamily) => {
    const tierRowH = 24;
    const tiersHeight = family.tiers.length * tierRowH;
    const headerH = 36;
    const progressH = !family.tiers.every((t) => t.completed) ? 20 : 0;
    const claimBtnH = family.claimableTier !== null ? 40 : 0;
    const cardPadding = 12;
    return headerH + tiersHeight + progressH + claimBtnH + cardPadding * 2;
  };

  const cardGap = 12;
  const totalHeight = families.reduce((sum, f) => sum + getCardHeight(f) + cardGap, 0);
  const maxScroll = Math.max(0, totalHeight - maxHeight);

  const handlePointerDown = useCallback((e: any) => {
    isDragging.current = true;
    lastY.current = e.data.global.y;
  }, []);

  const handlePointerMove = useCallback(
    (e: any) => {
      if (!isDragging.current) return;
      const dy = lastY.current - e.data.global.y;
      lastY.current = e.data.global.y;
      setScrollY((prev) => Math.max(0, Math.min(maxScroll, prev + dy)));
    },
    [maxScroll]
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const drawMask = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.rect(0, 0, width, maxHeight);
      g.fill({ color: 0xffffff });
    },
    [width, maxHeight]
  );

  const drawScrollTrack = useCallback(
    (g: PixiGraphics) => {
      if (totalHeight <= maxHeight) return;
      g.clear();
      const trackH = maxHeight - 20;
      const thumbH = Math.max(30, (maxHeight / totalHeight) * trackH);
      const thumbY = maxScroll > 0 ? (scrollY / maxScroll) * (trackH - thumbH) : 0;

      g.roundRect(width - 6, 10, 4, trackH, 2);
      g.fill({ color: 0x334155, alpha: 0.3 });

      g.roundRect(width - 6, 10 + thumbY, 4, thumbH, 2);
      g.fill({ color: 0x64748B, alpha: 0.8 });
    },
    [width, maxHeight, totalHeight, scrollY, maxScroll]
  );

  if (loading) {
    return (
      <pixiText
        text="Loading quests..."
        x={width / 2}
        y={60}
        anchor={{ x: 0.5, y: 0.5 }}
        style={{ fontFamily: FONT, fontSize: 14, fill: 0x94A3B8 }}
      />
    );
  }

  if (families.length === 0) {
    return (
      <pixiText
        text="No quests available"
        x={width / 2}
        y={60}
        anchor={{ x: 0.5, y: 0.5 }}
        style={{ fontFamily: FONT, fontSize: 14, fill: 0x64748B }}
      />
    );
  }

  // Calculate y positions for each card
  let currentY = 0;
  const cardPositions = families.map((f) => {
    const y = currentY;
    currentY += getCardHeight(f) + cardGap;
    return y;
  });

  return (
    <pixiContainer>
      <pixiContainer
        eventMode="static"
        onPointerDown={handlePointerDown}
        onGlobalPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerUpOutside={handlePointerUp}
      >
        <pixiGraphics draw={drawMask} alpha={0.001} />

        <pixiContainer y={-scrollY}>
          {families.map((family, i) => (
            <QuestFamilyCard
              key={family.id}
              family={family}
              y={cardPositions[i]}
              width={width - 12}
              onClaim={onClaim}
            />
          ))}
        </pixiContainer>
      </pixiContainer>

      <pixiGraphics draw={drawScrollTrack} />
    </pixiContainer>
  );
};

// ============================================================================
// QUESTS MODAL
// ============================================================================

export const QuestsModal = ({
  isOpen,
  onClose,
  questFamilies,
  loading,
  onClaim,
  screenWidth,
  screenHeight,
}: QuestsModalProps) => {
  const modalW = Math.min(380, screenWidth - 40);
  const contentW = modalW - 48;
  const listMaxH = 400;

  // Calculate claimable rewards
  const claimableRewards = questFamilies.reduce((sum, f) => {
    if (f.claimableTier) return sum + f.claimableTier.reward;
    return sum;
  }, 0);

  // Separate main families from finisher
  const mainFamilies = questFamilies.filter((f) => f.id !== 'finisher');
  const finisherFamily = questFamilies.find((f) => f.id === 'finisher');
  const allFamilies = finisherFamily ? [...mainFamilies, finisherFamily] : mainFamilies;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Daily Quests"
      subtitle={claimableRewards > 0 ? `${claimableRewards} CUBE ready!` : 'Complete for rewards'}
      width={modalW}
      screenWidth={screenWidth}
      screenHeight={screenHeight}
    >
      <pixiContainer x={24} y={0}>
        {/* Timer */}
        <CountdownTimer x={contentW / 2} y={0} />

        {/* Quest list */}
        <pixiContainer y={20}>
          <ScrollableQuestList
            families={allFamilies}
            width={contentW}
            maxHeight={listMaxH}
            loading={loading}
            onClaim={onClaim}
          />
        </pixiContainer>

        {/* Close button */}
        <Button
          text="Close"
          x={0}
          y={20 + listMaxH + 16}
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

export default QuestsModal;
