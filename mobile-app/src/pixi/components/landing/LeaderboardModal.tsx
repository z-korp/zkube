/**
 * LeaderboardModal - PixiJS modal showing game rankings
 * Displays: rank, player name, level, score, cubes, status
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { Modal, Button } from '../ui';
import type { LeaderboardEntry } from '@/hooks/useLeaderboardSlot';

const FONT = 'Fredericka the Great, Bangers, Arial Black, sans-serif';

// ============================================================================
// TYPES
// ============================================================================

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  entries: LeaderboardEntry[];
  loading: boolean;
  onRefresh: () => void;
  screenWidth: number;
  screenHeight: number;
}

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
  const rowH = 50;
  const isTop3 = rank <= 3;
  const medalColors = [0xFFD700, 0xC0C0C0, 0xCD7F32]; // Gold, Silver, Bronze

  const drawRow = useCallback((g: PixiGraphics) => {
    g.clear();
    g.setFillStyle({ color: rank % 2 === 0 ? 0x1E293B : 0x0F172A, alpha: 0.8 });
    g.roundRect(0, 0, width, rowH, 6);
    g.fill();
    if (isTop3) {
      g.setStrokeStyle({ width: 2, color: medalColors[rank - 1], alpha: 0.6 });
      g.roundRect(0, 0, width, rowH, 6);
      g.stroke();
    }
  }, [width, rank, isTop3]);

  const rankDisplay = isTop3 ? ['🥇', '🥈', '🥉'][rank - 1] : `#${rank}`;

  return (
    <pixiContainer y={y}>
      <pixiGraphics draw={drawRow} />
      
      {/* Rank */}
      <pixiText
        text={rankDisplay}
        x={isTop3 ? 20 : 24}
        y={rowH / 2}
        anchor={{ x: 0.5, y: 0.5 }}
        style={{ fontFamily: FONT, fontSize: isTop3 ? 20 : 14, fill: 0xFFFFFF }}
      />
      
      {/* Player Name */}
      <pixiText
        text={entry.player_name || `Game #${entry.token_id}`}
        x={50}
        y={rowH / 2}
        anchor={{ x: 0, y: 0.5 }}
        style={{ fontFamily: FONT, fontSize: 13, fill: 0xFFFFFF }}
      />
      
      {/* Level */}
      <pixiText
        text={`Lv ${entry.level}`}
        x={width - 130}
        y={rowH / 2}
        anchor={{ x: 0.5, y: 0.5 }}
        style={{ fontFamily: 'Arial, sans-serif', fontSize: 12, fill: 0x60A5FA }}
      />
      
      {/* Score */}
      <pixiText
        text={String(entry.totalScore)}
        x={width - 70}
        y={rowH / 2}
        anchor={{ x: 0.5, y: 0.5 }}
        style={{ fontFamily: FONT, fontSize: 14, fill: 0xFFFFFF }}
      />
      
      {/* Status */}
      <pixiText
        text={entry.gameOver ? '✓' : '▶'}
        x={width - 20}
        y={rowH / 2}
        anchor={{ x: 0.5, y: 0.5 }}
        style={{ fontSize: 14, fill: entry.gameOver ? 0x22C55E : 0xFBBF24 }}
      />
    </pixiContainer>
  );
};

// ============================================================================
// SCROLLABLE LEADERBOARD LIST
// ============================================================================

const ScrollableLeaderboard = ({
  entries,
  width,
  maxHeight,
  loading,
}: {
  entries: LeaderboardEntry[];
  width: number;
  maxHeight: number;
  loading: boolean;
}) => {
  const [scrollY, setScrollY] = useState(0);
  const isDragging = useRef(false);
  const lastY = useRef(0);

  const rowH = 50;
  const rowGap = 6;
  const totalHeight = entries.length * (rowH + rowGap);
  const maxScroll = Math.max(0, totalHeight - maxHeight);

  const handlePointerDown = useCallback((e: any) => {
    isDragging.current = true;
    lastY.current = e.data.global.y;
  }, []);

  const handlePointerMove = useCallback((e: any) => {
    if (!isDragging.current) return;
    const dy = lastY.current - e.data.global.y;
    lastY.current = e.data.global.y;
    setScrollY(prev => Math.max(0, Math.min(maxScroll, prev + dy)));
  }, [maxScroll]);

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const drawMask = useCallback((g: PixiGraphics) => {
    g.clear();
    g.rect(0, 0, width, maxHeight);
    g.fill({ color: 0xffffff });
  }, [width, maxHeight]);

  const drawScrollTrack = useCallback((g: PixiGraphics) => {
    if (totalHeight <= maxHeight) return;
    g.clear();
    const trackH = maxHeight - 20;
    const thumbH = Math.max(30, (maxHeight / totalHeight) * trackH);
    const thumbY = maxScroll > 0 ? (scrollY / maxScroll) * (trackH - thumbH) : 0;
    
    g.roundRect(width - 6, 10, 4, trackH, 2);
    g.fill({ color: 0x334155, alpha: 0.3 });
    
    g.roundRect(width - 6, 10 + thumbY, 4, thumbH, 2);
    g.fill({ color: 0x64748B, alpha: 0.8 });
  }, [width, maxHeight, totalHeight, scrollY, maxScroll]);

  if (loading) {
    return (
      <pixiText text="Loading leaderboard..."
        x={width / 2} y={60} anchor={{ x: 0.5, y: 0.5 }}
        style={{ fontFamily: FONT, fontSize: 14, fill: 0x94A3B8 }}
      />
    );
  }

  if (entries.length === 0) {
    return (
      <pixiText text="No games yet"
        x={width / 2} y={60} anchor={{ x: 0.5, y: 0.5 }}
        style={{ fontFamily: FONT, fontSize: 14, fill: 0x64748B }}
      />
    );
  }

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
          {entries.map((entry, i) => (
            <LeaderboardRow
              key={entry.token_id}
              entry={entry}
              rank={i + 1}
              y={i * (rowH + rowGap)}
              width={width - 12}
            />
          ))}
        </pixiContainer>
      </pixiContainer>

      <pixiGraphics draw={drawScrollTrack} />
    </pixiContainer>
  );
};

// ============================================================================
// LEADERBOARD MODAL
// ============================================================================

export const LeaderboardModal = ({
  isOpen,
  onClose,
  entries,
  loading,
  onRefresh,
  screenWidth,
  screenHeight,
}: LeaderboardModalProps) => {
  const modalW = Math.min(420, screenWidth - 40);
  const contentW = modalW - 48;
  const listMaxH = 320;

  // Header row
  const drawHeader = useCallback((g: PixiGraphics) => {
    g.clear();
    g.setFillStyle({ color: 0x334155, alpha: 0.5 });
    g.roundRect(0, 0, contentW, 28, 4);
    g.fill();
  }, [contentW]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Leaderboard"
      subtitle={loading ? "Loading..." : `${entries.length} players`}
      width={modalW}
      screenWidth={screenWidth}
      screenHeight={screenHeight}
    >
      <pixiContainer x={24} y={0}>
        {/* Header */}
        <pixiContainer>
          <pixiGraphics draw={drawHeader} />
          <pixiText text="#" x={20} y={14} anchor={{ x: 0.5, y: 0.5 }}
            style={{ fontFamily: 'Arial', fontSize: 10, fill: 0x94A3B8 }} />
          <pixiText text="PLAYER" x={50} y={14} anchor={{ x: 0, y: 0.5 }}
            style={{ fontFamily: 'Arial', fontSize: 10, fill: 0x94A3B8 }} />
          <pixiText text="LVL" x={contentW - 130} y={14} anchor={{ x: 0.5, y: 0.5 }}
            style={{ fontFamily: 'Arial', fontSize: 10, fill: 0x94A3B8 }} />
          <pixiText text="SCORE" x={contentW - 70} y={14} anchor={{ x: 0.5, y: 0.5 }}
            style={{ fontFamily: 'Arial', fontSize: 10, fill: 0x94A3B8 }} />
        </pixiContainer>

        {/* Scrollable list */}
        <pixiContainer y={36}>
          <ScrollableLeaderboard
            entries={entries}
            width={contentW}
            maxHeight={listMaxH}
            loading={loading}
          />
        </pixiContainer>

        {/* Buttons */}
        <Button
          text="Refresh"
          x={0}
          y={36 + listMaxH + 16}
          width={(contentW - 12) / 2}
          height={40}
          variant="secondary"
          fontSize={14}
          onClick={onRefresh}
        />
        <Button
          text="Close"
          x={(contentW + 12) / 2}
          y={36 + listMaxH + 16}
          width={(contentW - 12) / 2}
          height={40}
          variant="primary"
          fontSize={14}
          onClick={onClose}
        />
      </pixiContainer>
    </Modal>
  );
};

export default LeaderboardModal;
