/**
 * QuestsPage - Full-screen daily quests with progress bars and claim buttons
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { PageTopBar } from './PageTopBar';
import { Button } from '../ui';
import type { QuestFamily, QuestTier } from '@/types/questFamily';
import { FONT_TITLE, FONT_BODY } from '../../utils/colors';


// Family icons
const FAMILY_ICONS: Record<string, string> = {
  player: '🎮', // Game controller
  clearer: '📊', // Bar chart
  combo: '⚡', // Lightning
  finisher: '🏆', // Trophy
};

// ============================================================================
// COUNTDOWN TIMER
// ============================================================================

const TIMER_STYLE = { fontFamily: FONT_BODY, fontSize: 12, fill: 0x64748b };
const PROGRESS_TEXT_STYLE = { fontFamily: FONT_BODY, fontSize: 11, fill: 0x94a3b8 };
const TIER_ICON_STYLE = { fontSize: 14 };
const TIER_REWARD_STYLE_BASE = { fontFamily: FONT_TITLE, fontSize: 12 };
const FAMILY_ICON_STYLE = { fontSize: 22 };
const FAMILY_NAME_STYLE = { fontFamily: FONT_TITLE, fontSize: 16, fill: 0xffffff };
const EMPTY_STATE_STYLE = { fontFamily: FONT_TITLE, fontSize: 16, fill: 0x64748b };

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
      anchor={{ x: 0.5, y: 0.5 }}
      style={TIMER_STYLE}
      eventMode="none"
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
  const barH = 10;

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      // Track
      g.setFillStyle({ color: 0x1e293b, alpha: 1 });
      g.roundRect(0, 0, width, barH, 5);
      g.fill();
      // Fill
      if (percent > 0) {
        g.setFillStyle({ color, alpha: 1 });
        g.roundRect(0, 0, width * percent, barH, 5);
        g.fill();
      }
    },
    [width, percent, color]
  );

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics draw={draw} eventMode="none" />
      <pixiText
        text={`${progress}/${target}`}
        x={width + 10}
        y={barH / 2}
        anchor={{ x: 0, y: 0.5 }}
        style={PROGRESS_TEXT_STYLE}
        eventMode="none"
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
  const rowH = 28;

  // Icon and color based on state
  let icon = '⚪'; // White circle (pending)
  let textColor = 0x94a3b8;
  let rewardColor = 0x64748b;

  if (tier.claimed) {
    icon = '✅'; // Check mark
    textColor = 0x64748b;
    rewardColor = 0x64748b;
  } else if (tier.completed) {
    icon = '✅'; // Check mark
    textColor = 0x22c55e;
    rewardColor = 0xfbbf24;
  } else if (tier.locked) {
    icon = '🔒'; // Lock
    textColor = 0x475569;
    rewardColor = 0x475569;
  }

  const drawBg = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      if (isClaimable) {
        g.setFillStyle({ color: 0x166534, alpha: 0.3 });
        g.roundRect(0, 0, width, rowH, 6);
        g.fill();
      }
    },
    [width, isClaimable]
  );

  const tierNameStyle = useMemo(() => ({
    fontFamily: FONT_BODY, fontSize: 12, fill: textColor,
  }), [textColor]);

  const tierRewardStyle = useMemo(() => ({
    ...TIER_REWARD_STYLE_BASE, fill: rewardColor,
  }), [rewardColor]);

  return (
    <pixiContainer y={y}>
      <pixiGraphics draw={drawBg} eventMode="none" />
      <pixiText text={icon} x={6} y={rowH / 2} anchor={{ x: 0, y: 0.5 }} style={TIER_ICON_STYLE} eventMode="none" />
      <pixiText
        text={`T${tier.tier}: ${tier.name}`}
        x={28}
        y={rowH / 2}
        anchor={{ x: 0, y: 0.5 }}
        style={tierNameStyle}
        eventMode="none"
      />
      <pixiText
        text={`+${tier.reward}`}
        x={width - 6}
        y={rowH / 2}
        anchor={{ x: 1, y: 0.5 }}
        style={tierRewardStyle}
        eventMode="none"
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

  const icon = FAMILY_ICONS[family.id] || '❓';
  const hasClaimable = family.claimableTier !== null;
  const allCompleted = family.tiers.every((t) => t.completed);
  const allClaimed = family.tiers.every((t) => t.claimed);

  // Calculate card height
  const tierRowH = 28;
  const tiersHeight = family.tiers.length * tierRowH;
  const headerH = 44;
  const progressH = !allCompleted ? 26 : 0;
  const claimBtnH = hasClaimable ? 46 : 0;
  const cardPadding = 14;
  const cardH = headerH + tiersHeight + progressH + claimBtnH + cardPadding;

  const drawCard = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.setFillStyle({ color: allClaimed ? 0x0f172a : 0x1e293b, alpha: 0.9 });
      g.roundRect(0, 0, width, cardH, 12);
      g.fill();
      if (hasClaimable) {
        g.setStrokeStyle({ width: 2, color: 0x22c55e, alpha: 0.6 });
        g.roundRect(0, 0, width, cardH, 12);
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

  const progressColor = hasClaimable ? 0x22c55e : 0x3b82f6;

  const familyProgressStyle = useMemo(() => ({
    fontFamily: FONT_BODY, fontSize: 12, fill: allCompleted ? 0x22c55e : 0x64748b,
  }), [allCompleted]);

  return (
    <pixiContainer y={y}>
      <pixiGraphics draw={drawCard} />

      {/* Header */}
      <pixiContainer x={cardPadding} y={cardPadding}>
        <pixiText text={icon} x={0} y={12} anchor={{ x: 0, y: 0.5 }} style={FAMILY_ICON_STYLE} eventMode="none" />
        <pixiText
          text={family.name}
          x={32}
          y={12}
          anchor={{ x: 0, y: 0.5 }}
          style={FAMILY_NAME_STYLE}
          eventMode="none"
        />
        <pixiText
          text={`${family.currentTierIndex >= 0 ? family.currentTierIndex + 1 : family.totalTiers}/${family.totalTiers}`}
          x={width - cardPadding * 2}
          y={12}
          anchor={{ x: 1, y: 0.5 }}
          style={familyProgressStyle}
          eventMode="none"
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

      {/* Progress bar */}
      {!allCompleted && (
        <ProgressBar
          x={cardPadding}
          y={headerH + tiersHeight + 6}
          width={width - cardPadding * 2 - 60}
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
            height={36}
            variant="primary"
            fontSize={13}
            onClick={handleClaim}
            disabled={isClaiming}
          />
        </pixiContainer>
      )}
    </pixiContainer>
  );
};

// ============================================================================
// QUESTS PAGE
// ============================================================================

interface QuestsPageProps {
  questFamilies: QuestFamily[];
  loading: boolean;
  onClaim: (questId: string, intervalId: number) => Promise<void>;
  screenWidth: number;
  screenHeight: number;
  topBarHeight: number;
  cubeBalance?: number;
}

export const QuestsPage = ({
  questFamilies,
  loading,
  onClaim,
  screenWidth,
  screenHeight,
  topBarHeight,
  cubeBalance,
}: QuestsPageProps) => {
  const [scrollY, setScrollY] = useState(0);
  const isDragging = useRef(false);
  const lastY = useRef(0);

  const contentPadding = 16;
  const timerH = 32;
  const contentTop = topBarHeight + contentPadding;
  const contentWidth = screenWidth - contentPadding * 2;
  const listTop = contentTop + timerH;
  const listHeight = screenHeight - listTop - contentPadding;

  // Calculate total claimable rewards
  const claimableRewards = questFamilies.reduce((sum, f) => {
    if (f.claimableTier) return sum + f.claimableTier.reward;
    return sum;
  }, 0);

  // Separate main families from finisher
  const mainFamilies = questFamilies.filter((f) => f.id !== 'finisher');
  const finisherFamily = questFamilies.find((f) => f.id === 'finisher');
  const allFamilies = finisherFamily ? [...mainFamilies, finisherFamily] : mainFamilies;

  // Calculate card heights dynamically
  const getCardHeight = (family: QuestFamily) => {
    const tierRowH = 28;
    const tiersHeight = family.tiers.length * tierRowH;
    const headerH = 44;
    const progressH = !family.tiers.every((t) => t.completed) ? 26 : 0;
    const claimBtnH = family.claimableTier !== null ? 46 : 0;
    const cardPadding = 14;
    return headerH + tiersHeight + progressH + claimBtnH + cardPadding;
  };

  const cardGap = 14;
  const totalHeight = allFamilies.reduce((sum, f) => sum + getCardHeight(f) + cardGap, 0);
  const maxScroll = Math.max(0, totalHeight - listHeight);

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

  // Calculate y positions for each card
  let currentY = 0;
  const cardPositions = allFamilies.map((f) => {
    const y = currentY;
    currentY += getCardHeight(f) + cardGap;
    return y;
  });

  return (
    <pixiContainer>
      {/* Top bar */}
      <PageTopBar
        title="Daily Quests"
        subtitle={claimableRewards > 0 ? `${claimableRewards} CUBE ready!` : undefined}
        screenWidth={screenWidth}
        topBarHeight={topBarHeight}
        showCubeBalance
        cubeBalance={cubeBalance}
      />

      {/* Timer */}
      <CountdownTimer x={screenWidth / 2} y={contentTop + timerH / 2} />

      {/* Quest list */}
      <pixiContainer x={contentPadding} y={listTop}>
        {loading ? (
          <pixiText
            text="Loading quests..."
            x={contentWidth / 2}
            y={80}
            anchor={0.5}
            style={EMPTY_STATE_STYLE}
            eventMode="none"
          />
        ) : allFamilies.length === 0 ? (
          <pixiText
            text="No quests available"
            x={contentWidth / 2}
            y={80}
            anchor={0.5}
            style={EMPTY_STATE_STYLE}
            eventMode="none"
          />
        ) : (
          <pixiContainer
            eventMode="static"
            onPointerDown={handlePointerDown}
            onGlobalPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerUpOutside={handlePointerUp}
          >
            {/* Invisible hit area */}
            <pixiGraphics
              draw={(g) => {
                g.clear();
                g.rect(0, 0, contentWidth, listHeight);
                g.fill({ color: 0xffffff, alpha: 0.001 });
              }}
            />

            <pixiContainer y={-scrollY}>
              {allFamilies.map((family, i) => (
                <QuestFamilyCard
                  key={family.id}
                  family={family}
                  y={cardPositions[i]}
                  width={contentWidth}
                  onClaim={onClaim}
                />
              ))}
            </pixiContainer>
          </pixiContainer>
        )}
      </pixiContainer>
    </pixiContainer>
  );
};

export default QuestsPage;
