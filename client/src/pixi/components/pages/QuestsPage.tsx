/**
 * QuestsPage - Full-screen daily quests with progress bars and claim buttons
 * V3 design tokens applied, PixiScrollContainer for scrolling
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { PageTopBar } from './PageTopBar';
import { PixiScrollContainer } from '../../ui/PixiScrollContainer';
import { PixiButton } from '../../ui/PixiButton';
import type { QuestFamily, QuestTier } from '@/types/questFamily';
import { FONT_TITLE, FONT_BODY } from '../../utils/colors';
import { color, space } from '@/pixi/design/tokens';

// Family icons
const FAMILY_ICONS: Record<string, string> = {
  player: '🎮',
  clearer: '📊',
  combo: '⚡',
  finisher: '🏆',
};

// ============================================================================
// COUNTDOWN TIMER
// ============================================================================

const TIMER_STYLE = { fontFamily: FONT_BODY, fontSize: 12, fill: color.text.muted };
const PROGRESS_TEXT_STYLE = { fontFamily: FONT_BODY, fontSize: 11, fill: color.text.secondary };
const TIER_REWARD_STYLE_BASE = { fontFamily: FONT_TITLE, fontSize: 12 };
const FAMILY_ICON_STYLE = { fontSize: 22 };
const FAMILY_NAME_STYLE = { fontFamily: FONT_TITLE, fontSize: 16, fill: color.text.primary };
const EMPTY_STATE_STYLE = { fontFamily: FONT_TITLE, fontSize: 16, fill: color.text.muted };
const EMPTY_SUB_STYLE = { fontFamily: FONT_BODY, fontSize: 12, fill: color.text.secondary };

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
      text={`RESETS IN ${timeLeft}`}
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
  progressColor,
}: {
  x: number;
  y: number;
  width: number;
  progress: number;
  target: number;
  progressColor: number;
}) => {
  const percent = target > 0 ? Math.min(progress / target, 1) : 1;
  const barH = 10;

  const draw = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      // Track
      g.setFillStyle({ color: color.bg.primary, alpha: 1 });
      g.roundRect(0, 0, width, barH, 5);
      g.fill();
      // Fill
      if (percent > 0) {
        g.setFillStyle({ color: progressColor, alpha: 1 });
        g.roundRect(0, 0, width * percent, barH, 5);
        g.fill();
      }
    },
    [width, percent, progressColor]
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

  let icon = '⚪';
  let textColor = color.text.secondary;
  let rewardColor = color.text.muted;

  if (tier.claimed) {
    icon = '✅';
    textColor = color.text.muted;
    rewardColor = color.text.muted;
  } else if (tier.completed) {
    icon = '✅';
    textColor = color.status.success;
    rewardColor = color.accent.gold;
  } else if (tier.locked) {
    icon = '🔒';
    textColor = color.state.hover;
    rewardColor = color.state.hover;
  }

  const drawBg = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      if (isClaimable) {
        g.setFillStyle({ color: color.status.successDark, alpha: 0.3 });
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

  const tierIconStyle = useMemo(() => ({ fontSize: 14 }), []);

  return (
    <pixiContainer y={y}>
      <pixiGraphics draw={drawBg} eventMode="none" />
      <pixiText text={icon} x={6} y={rowH / 2} anchor={{ x: 0, y: 0.5 }} style={tierIconStyle} eventMode="none" />
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
  const claimBtnH = hasClaimable ? 48 : 0;
  const cardPadding = 14;
  const cardH = headerH + tiersHeight + progressH + claimBtnH + cardPadding;

  const drawCard = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.setFillStyle({ color: allClaimed ? color.bg.secondary : color.bg.primary, alpha: 0.9 });
      g.roundRect(0, 0, width, cardH, 12);
      g.fill();
      if (hasClaimable) {
        g.setStrokeStyle({ width: 2, color: color.status.success, alpha: 0.6 });
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

  const progressColor = hasClaimable ? color.status.success : color.accent.blue;

  const familyProgressStyle = useMemo(() => ({
    fontFamily: FONT_BODY, fontSize: 12, fill: allCompleted ? color.status.success : color.text.muted,
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
          progressColor={progressColor}
        />
      )}

      {/* Claim button */}
      {hasClaimable && (
        <pixiContainer x={cardPadding} y={headerH + tiersHeight + progressH + 8}>
          <PixiButton
            label={isClaiming ? 'CLAIMING...' : `CLAIM T${family.claimableTier!.tier} (+${family.claimableTier!.reward})`}
            width={width - cardPadding * 2}
            height={44}
            variant="green"
            textStyle={{ fontFamily: FONT_TITLE, fontSize: 14 }}
            onPress={handleClaim}
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
  status?: 'loading' | 'error' | 'success';
  onClaim: (questId: string, intervalId: number) => Promise<void>;
  onRefresh?: () => Promise<void> | void;
  screenWidth: number;
  screenHeight: number;
  topBarHeight: number;
  cubeBalance?: number;
}

export const QuestsPage = ({
  questFamilies,
  loading,
  status = 'success',
  onClaim,
  onRefresh,
  screenWidth,
  screenHeight,
  topBarHeight,
  cubeBalance,
}: QuestsPageProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isLoadingState = loading || status === 'loading';
  const isErrorState = status === 'error';

  const contentPadding = space.lg;
  const timerH = 32;
  const contentTop = topBarHeight + contentPadding;
  const contentMaxWidth = 720;
  const contentWidth = Math.min(screenWidth - contentPadding * 2, contentMaxWidth);
  const contentX = Math.max(contentPadding, (screenWidth - contentWidth) / 2);
  const listTop = contentTop + timerH;
  const listHeight = screenHeight - listTop - contentPadding;

  // Calculate total claimable rewards
  const claimableRewards = questFamilies.reduce((sum, f) => {
    if (f.claimableTier) return sum + f.claimableTier.reward;
    return sum;
  }, 0);

  const subtitle = isLoadingState
    ? 'Syncing daily progress...'
    : isErrorState
      ? 'Quest sync unavailable'
      : claimableRewards > 0
        ? `${claimableRewards} CUBE ready!`
        : undefined;

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
    const claimBtnH = family.claimableTier !== null ? 48 : 0;
    const cardPadding = 14;
    return headerH + tiersHeight + progressH + claimBtnH + cardPadding;
  };

  const cardGap = 14;
  const totalHeight = allFamilies.reduce((sum, f) => sum + getCardHeight(f) + cardGap, 0);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, onRefresh]);

  // Calculate y positions for each card
  let currentY = 0;
  const cardPositions = allFamilies.map((f) => {
    const yPos = currentY;
    currentY += getCardHeight(f) + cardGap;
    return yPos;
  });

  return (
    <pixiContainer>
      {/* Top bar */}
      <PageTopBar
        title="DAILY QUESTS"
        subtitle={subtitle}
        screenWidth={screenWidth}
        topBarHeight={topBarHeight}
        showCubeBalance
        cubeBalance={cubeBalance}
      />

      {/* Timer */}
      <CountdownTimer x={screenWidth / 2} y={contentTop + timerH / 2} />

      {/* Quest list */}
      <pixiContainer x={contentX} y={listTop}>
        {isLoadingState ? (
          <pixiText
            text="SYNCING DAILY QUESTS..."
            x={contentWidth / 2}
            y={80}
            anchor={0.5}
            style={EMPTY_STATE_STYLE}
            eventMode="none"
          />
        ) : isErrorState ? (
          <pixiContainer>
            <pixiText
              text="COULDN'T LOAD QUESTS"
              x={contentWidth / 2}
              y={66}
              anchor={0.5}
              style={EMPTY_STATE_STYLE}
              eventMode="none"
            />
            <pixiText
              text="CHECK YOUR CONNECTION AND RETRY"
              x={contentWidth / 2}
              y={94}
              anchor={0.5}
              style={EMPTY_SUB_STYLE}
              eventMode="none"
            />
            <PixiButton
              label={isRefreshing ? 'RETRYING...' : 'RETRY'}
              x={(contentWidth - 140) / 2}
              y={122}
              width={140}
              height={44}
              variant="purple"
              textStyle={{ fontFamily: FONT_TITLE, fontSize: 14 }}
              onPress={handleRefresh}
              disabled={isRefreshing}
            />
          </pixiContainer>
        ) : allFamilies.length === 0 ? (
          <pixiContainer>
            <pixiText
              text="NO QUESTS YET"
              x={contentWidth / 2}
              y={72}
              anchor={0.5}
              style={EMPTY_STATE_STYLE}
              eventMode="none"
            />
            <pixiText
              text="PLAY A RUN TO START MAKING PROGRESS"
              x={contentWidth / 2}
              y={100}
              anchor={0.5}
              style={EMPTY_SUB_STYLE}
              eventMode="none"
            />
          </pixiContainer>
        ) : (
          <PixiScrollContainer
            width={contentWidth}
            height={listHeight}
            contentHeight={totalHeight}
          >
            {allFamilies.map((family, i) => (
              <QuestFamilyCard
                key={family.id}
                family={family}
                y={cardPositions[i]}
                width={contentWidth}
                onClaim={onClaim}
              />
            ))}
          </PixiScrollContainer>
        )}
      </pixiContainer>
    </pixiContainer>
  );
};

export default QuestsPage;
