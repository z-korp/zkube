import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { useTick } from '@pixi/react';
import { PageTopBar } from './PageTopBar';
import { PixiScrollContainer } from '../../ui/PixiScrollContainer';
import type { LeaderboardEntry } from '@/hooks/useLeaderboardSlot';
import { FONT_TITLE, FONT_BODY } from '../../utils/colors';
import { color, space } from '@/pixi/design/tokens';

const MEDAL_STYLE = { fontSize: 22 };
const RANK_NUM_STYLE = { fontFamily: FONT_BODY, fontSize: 16, fontWeight: 'bold' as const, fill: color.text.secondary };
const PLAYER_NAME_STYLE = { fontFamily: FONT_TITLE, fontSize: 16, fill: color.text.primary };
const LEVEL_BADGE_STYLE = { fontFamily: FONT_BODY, fontSize: 14, fontWeight: 'bold' as const, fill: 0x60a5fa };
const HEADER_LABEL_STYLE = { fontFamily: FONT_BODY, fontSize: 11, fill: color.text.secondary };
const LB_EMPTY_STYLE = { fontFamily: FONT_TITLE, fontSize: 16, fill: color.text.muted };

const MEDAL_COLORS = [0xffd700, 0xc0c0c0, 0xcd7f32] as const;
const ROW_BG_COLORS = [0x4a3f00, 0x3a3a3a, 0x3d2a1a] as const;

const TAB_IDS = ['all', 'week', 'today'] as const;
const TAB_LABELS = ['All Time', 'This Week', 'Today'] as const;

const TabBar = ({
  activeTab,
  onTabChange,
  width,
}: {
  activeTab: typeof TAB_IDS[number];
  onTabChange: (tab: typeof TAB_IDS[number]) => void;
  width: number;
}) => {
  const tabW = width / TAB_IDS.length;
  const barH = 36;

  const drawBar = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.setFillStyle({ color: color.bg.secondary, alpha: 0.9 });
      g.roundRect(0, 0, width, barH, 8);
      g.fill();

      const activeIdx = TAB_IDS.indexOf(activeTab);
      if (activeIdx >= 0) {
        g.setFillStyle({ color: color.accent.orange, alpha: 1 });
        g.rect(activeIdx * tabW + 8, barH - 3, tabW - 16, 3);
        g.fill();
      }
    },
    [width, activeTab, tabW],
  );

  return (
    <pixiContainer>
      <pixiGraphics draw={drawBar} eventMode="none" />
      {TAB_IDS.map((id, i) => {
        const isActive = id === activeTab;
        const tabStyle = {
          fontFamily: FONT_TITLE,
          fontSize: 13,
          fill: isActive ? color.text.primary : color.text.secondary,
        };
        return (
          <pixiContainer
            key={id}
            x={i * tabW}
            eventMode="static"
            cursor="pointer"
            onPointerDown={() => onTabChange(id)}
          >
            <pixiGraphics
              draw={(g: PixiGraphics) => {
                g.clear();
                g.rect(0, 0, tabW, barH);
                g.fill({ color: 0xffffff, alpha: 0.001 });
              }}
            />
            <pixiText
              text={TAB_LABELS[i]}
              x={tabW / 2}
              y={barH / 2 - 2}
              anchor={0.5}
              style={tabStyle}
              eventMode="none"
            />
          </pixiContainer>
        );
      })}
    </pixiContainer>
  );
};

const LeaderboardRow = ({
  entry,
  rank,
  y,
  width,
}: {
  entry: LeaderboardEntry;
  rank: number;
  y: number;
  width: number;
}) => {
  const rowH = 64;
  const isTop3 = rank <= 3;

  const statusStyle = useMemo(() => ({
    fontFamily: FONT_BODY, fontSize: 11, fill: entry.gameOver ? color.status.success : color.accent.gold,
  }), [entry.gameOver]);

  const scoreStyle = useMemo(() => ({
    fontFamily: FONT_TITLE, fontSize: 20, fill: isTop3 ? MEDAL_COLORS[rank - 1] : color.text.primary,
  }), [isTop3, rank]);

  const drawRow = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      if (isTop3) {
        g.setFillStyle({ color: ROW_BG_COLORS[rank - 1], alpha: 0.9 });
      } else {
        g.setFillStyle({ color: color.bg.primary, alpha: 0.95 });
      }
      g.roundRect(0, 0, width, rowH, 12);
      g.fill();
      if (isTop3) {
        g.setStrokeStyle({ width: 3, color: MEDAL_COLORS[rank - 1], alpha: 1 });
        g.roundRect(0, 0, width, rowH, 12);
        g.stroke();
      } else {
        g.setStrokeStyle({ width: 1, color: color.state.hover, alpha: 0.5 });
        g.roundRect(0, 0, width, rowH, 12);
        g.stroke();
      }
      const badgeX = 8;
      const badgeSize = 40;
      g.setFillStyle({ color: isTop3 ? MEDAL_COLORS[rank - 1] : color.state.hover, alpha: isTop3 ? 0.3 : 0.5 });
      g.roundRect(badgeX, (rowH - badgeSize) / 2, badgeSize, badgeSize, 8);
      g.fill();
    },
    [width, rank, isTop3],
  );

  const getMedalEmoji = (r: number) => {
    if (r === 1) return '🥇';
    if (r === 2) return '🥈';
    if (r === 3) return '🥉';
    return '';
  };

  return (
    <pixiContainer y={y}>
      <pixiGraphics draw={drawRow} />
      {isTop3 ? (
        <pixiText text={getMedalEmoji(rank)} x={28} y={rowH / 2} anchor={0.5} style={MEDAL_STYLE} eventMode="none" />
      ) : (
        <pixiText text={String(rank)} x={28} y={rowH / 2} anchor={0.5} style={RANK_NUM_STYLE} eventMode="none" />
      )}
      <pixiText text={entry.player_name || `Game #${entry.token_id}`} x={58} y={rowH / 2 - 8} anchor={{ x: 0, y: 0.5 }} style={PLAYER_NAME_STYLE} eventMode="none" />
      <pixiText text={entry.gameOver ? '✓ Completed' : '▶ In Progress'} x={58} y={rowH / 2 + 12} anchor={{ x: 0, y: 0.5 }} style={statusStyle} eventMode="none" />
      <pixiText text={`Lv ${entry.level}`} x={width - 90} y={rowH / 2} anchor={{ x: 0.5, y: 0.5 }} style={LEVEL_BADGE_STYLE} eventMode="none" />
      <pixiText text={String(entry.totalScore)} x={width - 28} y={rowH / 2} anchor={{ x: 1, y: 0.5 }} style={scoreStyle} eventMode="none" />
    </pixiContainer>
  );
};

const StickyPlayerRow = ({
  entry,
  rank,
  width,
  y,
}: {
  entry: LeaderboardEntry;
  rank: number;
  width: number;
  y: number;
}) => {
  const rowH = 52;

  const drawBg = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.setFillStyle({ color: color.accent.blue, alpha: 0.15 });
      g.roundRect(0, 0, width, rowH, 10);
      g.fill();
      g.setStrokeStyle({ width: 2, color: color.accent.blue, alpha: 0.6 });
      g.roundRect(0, 0, width, rowH, 10);
      g.stroke();
    },
    [width],
  );

  const rankStyle = useMemo(() => ({
    fontFamily: FONT_TITLE, fontSize: 16, fill: color.accent.blue,
  }), []);

  const nameStyle = useMemo(() => ({
    fontFamily: FONT_TITLE, fontSize: 16, fill: color.text.primary,
  }), []);

  const scoreStyle = useMemo(() => ({
    fontFamily: FONT_TITLE, fontSize: 18, fill: color.text.primary,
  }), []);

  return (
    <pixiContainer y={y}>
      <pixiGraphics draw={drawBg} />
      <pixiText text={`#${rank}`} x={16} y={rowH / 2} anchor={{ x: 0, y: 0.5 }} style={rankStyle} eventMode="none" />
      <pixiText text="You" x={60} y={rowH / 2} anchor={{ x: 0, y: 0.5 }} style={nameStyle} eventMode="none" />
      <pixiText text={String(entry.totalScore)} x={width - 16} y={rowH / 2} anchor={{ x: 1, y: 0.5 }} style={scoreStyle} eventMode="none" />
    </pixiContainer>
  );
};

interface LeaderboardPageProps {
  entries: LeaderboardEntry[];
  loading: boolean;
  onRefresh: () => void;
  screenWidth: number;
  screenHeight: number;
  topBarHeight: number;
  playerAddress?: string;
}

export const LeaderboardPage = ({
  entries,
  loading,
  onRefresh,
  screenWidth,
  screenHeight,
  topBarHeight,
  playerAddress,
}: LeaderboardPageProps) => {
  const [activeTab, setActiveTab] = useState<typeof TAB_IDS[number]>('all');

  const contentPadding = space.lg;
  const tabBarH = 36;
  const tabGap = space.sm;
  const headerH = 40;
  const rowH = 64;
  const rowGap = 10;
  const stickyRowH = 52;
  const stickyGap = space.sm;
  const contentMaxWidth = 720;
  const contentWidth = Math.min(screenWidth - contentPadding * 2, contentMaxWidth);
  const contentX = Math.max(contentPadding, (screenWidth - contentWidth) / 2);
  const contentTop = topBarHeight + contentPadding;
  const listTop = contentTop + tabBarH + tabGap + headerH + space.sm;

  const playerEntry = useMemo(() => {
    if (!playerAddress) return null;
    return entries.find(e =>
      e.player_address?.toLowerCase() === playerAddress.toLowerCase() ||
      e.owner?.toLowerCase() === playerAddress.toLowerCase()
    );
  }, [entries, playerAddress]);

  const playerRank = useMemo(() => {
    if (!playerEntry) return 0;
    return entries.indexOf(playerEntry) + 1;
  }, [entries, playerEntry]);

  const hasStickyRow = playerEntry != null && playerRank > 0;
  const stickyAreaH = hasStickyRow ? stickyRowH + stickyGap : 0;
  const listHeight = screenHeight - listTop - contentPadding - stickyAreaH;
  const totalHeight = entries.length * (rowH + rowGap);

  const drawHeader = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.setFillStyle({ color: color.bg.secondary, alpha: 0.9 });
      g.roundRect(0, 0, contentWidth, headerH, 10);
      g.fill();
      g.setStrokeStyle({ width: 1, color: color.state.hover, alpha: 0.5 });
      g.roundRect(0, 0, contentWidth, headerH, 10);
      g.stroke();
    },
    [contentWidth],
  );

  return (
    <pixiContainer>
      <PageTopBar
        title="LEADERBOARD"
        subtitle={loading ? 'LOADING...' : `${entries.length} PLAYERS`}
        screenWidth={screenWidth}
        topBarHeight={topBarHeight}
        actionIcon="🔄"
        onAction={onRefresh}
      />

      <pixiContainer x={contentX} y={contentTop}>
        <TabBar activeTab={activeTab} onTabChange={setActiveTab} width={contentWidth} />
      </pixiContainer>

      <pixiContainer x={contentX} y={contentTop + tabBarH + tabGap}>
        <pixiGraphics draw={drawHeader} eventMode="none" />
        <pixiText text="#" x={28} y={headerH / 2} anchor={0.5} style={HEADER_LABEL_STYLE} eventMode="none" />
        <pixiText text="PLAYER" x={60} y={headerH / 2} anchor={{ x: 0, y: 0.5 }} style={HEADER_LABEL_STYLE} eventMode="none" />
        <pixiText text="LVL" x={contentWidth - 100} y={headerH / 2} anchor={0.5} style={HEADER_LABEL_STYLE} eventMode="none" />
        <pixiText text="SCORE" x={contentWidth - 40} y={headerH / 2} anchor={0.5} style={HEADER_LABEL_STYLE} eventMode="none" />
      </pixiContainer>

      <pixiContainer x={contentX} y={listTop}>
        {loading ? (
          <pixiText text="LOADING LEADERBOARD..." x={contentWidth / 2} y={80} anchor={0.5} style={LB_EMPTY_STYLE} eventMode="none" />
        ) : entries.length === 0 ? (
          <pixiText text="NO GAMES YET. BE THE FIRST!" x={contentWidth / 2} y={80} anchor={0.5} style={LB_EMPTY_STYLE} eventMode="none" />
        ) : (
          <PixiScrollContainer
            width={contentWidth}
            height={listHeight}
            contentHeight={totalHeight}
          >
            {entries.map((entry, i) => (
              <LeaderboardRow
                key={entry.token_id}
                entry={entry}
                rank={i + 1}
                y={i * (rowH + rowGap)}
                width={contentWidth - 10}
              />
            ))}
          </PixiScrollContainer>
        )}
      </pixiContainer>

      {hasStickyRow && playerEntry && (
        <StickyPlayerRow
          entry={playerEntry}
          rank={playerRank}
          width={contentWidth}
          y={screenHeight - contentPadding - stickyRowH}
        />
      )}
    </pixiContainer>
  );
};

export default LeaderboardPage;
