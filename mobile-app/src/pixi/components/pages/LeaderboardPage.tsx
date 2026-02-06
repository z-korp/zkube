/**
 * LeaderboardPage - Full-screen leaderboard with scrollable rankings
 * Background is rendered by MainScreen (shared across all pages)
 */

import { useState, useCallback, useRef } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { PageTopBar } from './PageTopBar';
import type { LeaderboardEntry } from '@/hooks/useLeaderboardSlot';
import { FONT_TITLE, FONT_BODY } from '../../utils/colors';


// ============================================================================
// LEADERBOARD ROW
// ============================================================================

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
  const medalColors = [0xffd700, 0xc0c0c0, 0xcd7f32]; // Gold, Silver, Bronze
  const bgColors = [0x4a3f00, 0x3a3a3a, 0x3d2a1a]; // Darker bg for top 3

  const drawRow = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      
      // Background
      if (isTop3) {
        g.setFillStyle({ color: bgColors[rank - 1], alpha: 0.9 });
      } else {
        g.setFillStyle({ color: 0x1e293b, alpha: 0.95 });
      }
      g.roundRect(0, 0, width, rowH, 12);
      g.fill();
      
      // Border for top 3
      if (isTop3) {
        g.setStrokeStyle({ width: 3, color: medalColors[rank - 1], alpha: 1 });
        g.roundRect(0, 0, width, rowH, 12);
        g.stroke();
      } else {
        g.setStrokeStyle({ width: 1, color: 0x475569, alpha: 0.5 });
        g.roundRect(0, 0, width, rowH, 12);
        g.stroke();
      }
      
      // Rank badge background
      const badgeX = 8;
      const badgeSize = 40;
      g.setFillStyle({ color: isTop3 ? medalColors[rank - 1] : 0x475569, alpha: isTop3 ? 0.3 : 0.5 });
      g.roundRect(badgeX, (rowH - badgeSize) / 2, badgeSize, badgeSize, 8);
      g.fill();
    },
    [width, rank, isTop3]
  );

  // Rank display with medal emoji for top 3
  const getMedalEmoji = (r: number) => {
    if (r === 1) return '🥇';
    if (r === 2) return '🥈';
    if (r === 3) return '🥉';
    return '';
  };

  return (
    <pixiContainer y={y}>
      <pixiGraphics draw={drawRow} />

      {/* Rank */}
      {isTop3 ? (
        <pixiText
          text={getMedalEmoji(rank)}
          x={28}
          y={rowH / 2}
          anchor={0.5}
          style={{ fontSize: 22 }}
        />
      ) : (
        <pixiText
          text={String(rank)}
          x={28}
          y={rowH / 2}
          anchor={0.5}
          style={{ fontFamily: FONT_BODY, fontSize: 16, fontWeight: 'bold', fill: 0x94a3b8 }}
        />
      )}

      {/* Player Name */}
      <pixiText
        text={entry.player_name || `Game #${entry.token_id}`}
        x={58}
        y={rowH / 2 - 8}
        anchor={{ x: 0, y: 0.5 }}
        style={{ fontFamily: FONT_TITLE, fontSize: 16, fill: 0xffffff }}
      />
      
      {/* Status indicator under name */}
      <pixiText
        text={entry.gameOver ? '✓ Completed' : '▶ In Progress'}
        x={58}
        y={rowH / 2 + 12}
        anchor={{ x: 0, y: 0.5 }}
        style={{ fontFamily: FONT_BODY, fontSize: 11, fill: entry.gameOver ? 0x22c55e : 0xfbbf24 }}
      />

      {/* Level badge */}
      <pixiText
        text={`Lv ${entry.level}`}
        x={width - 90}
        y={rowH / 2}
        anchor={{ x: 0.5, y: 0.5 }}
        style={{ fontFamily: FONT_BODY, fontSize: 14, fontWeight: 'bold', fill: 0x60a5fa }}
      />

      {/* Score */}
      <pixiText
        text={String(entry.totalScore)}
        x={width - 28}
        y={rowH / 2}
        anchor={{ x: 1, y: 0.5 }}
        style={{ fontFamily: FONT_TITLE, fontSize: 20, fill: isTop3 ? medalColors[rank - 1] : 0xffffff }}
      />
    </pixiContainer>
  );
};

// ============================================================================
// LEADERBOARD PAGE
// ============================================================================

interface LeaderboardPageProps {
  entries: LeaderboardEntry[];
  loading: boolean;
  onRefresh: () => void;
  screenWidth: number;
  screenHeight: number;
  topBarHeight: number;
}

export const LeaderboardPage = ({
  entries,
  loading,
  onRefresh,
  screenWidth,
  screenHeight,
  topBarHeight,
}: LeaderboardPageProps) => {
  const [scrollY, setScrollY] = useState(0);
  const isDragging = useRef(false);
  const lastY = useRef(0);

  const contentPadding = 16;
  const headerH = 40;
  const rowH = 64;
  const rowGap = 10;
  const contentWidth = screenWidth - contentPadding * 2;
  const contentTop = topBarHeight + contentPadding;
  const listTop = contentTop + headerH + 8;
  const listHeight = screenHeight - listTop - contentPadding;
  const totalHeight = entries.length * (rowH + rowGap);
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

  // Draw header
  const drawHeader = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.setFillStyle({ color: 0x0f172a, alpha: 0.9 });
      g.roundRect(0, 0, contentWidth, headerH, 10);
      g.fill();
      g.setStrokeStyle({ width: 1, color: 0x475569, alpha: 0.5 });
      g.roundRect(0, 0, contentWidth, headerH, 10);
      g.stroke();
    },
    [contentWidth]
  );

  // Draw scroll track
  const drawScrollTrack = useCallback(
    (g: PixiGraphics) => {
      if (totalHeight <= listHeight) return;
      g.clear();
      const trackH = listHeight - 20;
      const thumbH = Math.max(40, (listHeight / totalHeight) * trackH);
      const thumbY = maxScroll > 0 ? (scrollY / maxScroll) * (trackH - thumbH) : 0;

      g.roundRect(contentWidth + 6, 10, 6, trackH, 3);
      g.fill({ color: 0x334155, alpha: 0.3 });

      g.roundRect(contentWidth + 6, 10 + thumbY, 6, thumbH, 3);
      g.fill({ color: 0x64748b, alpha: 0.8 });
    },
    [contentWidth, listHeight, totalHeight, scrollY, maxScroll]
  );

  return (
    <pixiContainer>
      {/* Top bar */}
      <PageTopBar
        title="Leaderboard"
        subtitle={loading ? 'Loading...' : `${entries.length} players`}
        screenWidth={screenWidth}
        topBarHeight={topBarHeight}
        actionIcon="🔄"
        onAction={onRefresh}
      />

      {/* Content */}
      <pixiContainer x={contentPadding} y={contentTop}>
        {/* Header */}
        <pixiGraphics draw={drawHeader} />
        <pixiText
          text="#"
          x={28}
          y={headerH / 2}
          anchor={0.5}
          style={{ fontFamily: FONT_BODY, fontSize: 11, fill: 0x94a3b8 }}
        />
        <pixiText
          text="PLAYER"
          x={60}
          y={headerH / 2}
          anchor={{ x: 0, y: 0.5 }}
          style={{ fontFamily: FONT_BODY, fontSize: 11, fill: 0x94a3b8 }}
        />
        <pixiText
          text="LVL"
          x={contentWidth - 100}
          y={headerH / 2}
          anchor={0.5}
          style={{ fontFamily: FONT_BODY, fontSize: 11, fill: 0x94a3b8 }}
        />
        <pixiText
          text="SCORE"
          x={contentWidth - 40}
          y={headerH / 2}
          anchor={0.5}
          style={{ fontFamily: FONT_BODY, fontSize: 11, fill: 0x94a3b8 }}
        />
      </pixiContainer>

      {/* Scrollable list */}
      <pixiContainer x={contentPadding} y={listTop}>
        {loading ? (
          <pixiText
            text="Loading leaderboard..."
            x={contentWidth / 2}
            y={80}
            anchor={0.5}
            style={{ fontFamily: FONT_TITLE, fontSize: 16, fill: 0x64748b }}
          />
        ) : entries.length === 0 ? (
          <pixiText
            text="No games yet. Be the first!"
            x={contentWidth / 2}
            y={80}
            anchor={0.5}
            style={{ fontFamily: FONT_TITLE, fontSize: 16, fill: 0x64748b }}
          />
        ) : (
          <pixiContainer
            eventMode="static"
            onPointerDown={handlePointerDown}
            onGlobalPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerUpOutside={handlePointerUp}
          >
            {/* Invisible hit area for scrolling */}
            <pixiGraphics
              draw={(g) => {
                g.clear();
                g.rect(0, 0, contentWidth, listHeight);
                g.fill({ color: 0xffffff, alpha: 0.001 });
              }}
            />

            {/* Scrollable content */}
            <pixiContainer y={-scrollY}>
              {entries.map((entry, i) => (
                <LeaderboardRow
                  key={entry.token_id}
                  entry={entry}
                  rank={i + 1}
                  y={i * (rowH + rowGap)}
                  width={contentWidth}
                />
              ))}
            </pixiContainer>

            {/* Scroll indicator */}
            <pixiGraphics draw={drawScrollTrack} />
          </pixiContainer>
        )}
      </pixiContainer>
    </pixiContainer>
  );
};

export default LeaderboardPage;
