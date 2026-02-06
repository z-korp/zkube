/**
 * LeaderboardPage - Full-screen leaderboard with scrollable rankings
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Graphics as PixiGraphics, Assets, Texture } from 'pixi.js';
import { PageTopBar } from './PageTopBar';
import type { LeaderboardEntry } from '@/hooks/useLeaderboardSlot';

const FONT = 'Fredericka the Great, Bangers, Arial Black, sans-serif';
const T = '/assets/theme-1';

// ============================================================================
// TEXTURE HOOK
// ============================================================================

function useTexture(path: string): Texture | null {
  const [tex, setTex] = useState<Texture | null>(null);
  useEffect(() => {
    Assets.load(path)
      .then((t) => setTex(t as Texture))
      .catch(() => setTex(null));
  }, [path]);
  return tex;
}

// ============================================================================
// SKY BACKGROUND
// ============================================================================

const SkyBackground = ({ w, h }: { w: number; h: number }) => {
  const bgTex = useTexture(`${T}/theme-2-1.png`);

  const drawGradient = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      const steps = 20;
      const stepH = Math.ceil(h / steps) + 1;
      const top = { r: 0xd0, g: 0xea, b: 0xf8 };
      const bot = { r: 0xf5, g: 0xf0, b: 0xe0 };
      for (let i = 0; i < steps; i++) {
        const t = i / (steps - 1);
        const r = Math.round(top.r + (bot.r - top.r) * t);
        const gC = Math.round(top.g + (bot.g - top.g) * t);
        const b = Math.round(top.b + (bot.b - top.b) * t);
        g.setFillStyle({ color: (r << 16) | (gC << 8) | b });
        g.rect(0, i * stepH, w, stepH);
        g.fill();
      }
    },
    [w, h]
  );

  if (bgTex) {
    const scaleX = w / bgTex.width;
    const scaleY = h / bgTex.height;
    const scale = Math.max(scaleX, scaleY);
    const offX = (w - bgTex.width * scale) / 2;
    const offY = (h - bgTex.height * scale) / 2;
    return <pixiSprite texture={bgTex} x={offX} y={offY} scale={{ x: scale, y: scale }} />;
  }
  return <pixiGraphics draw={drawGradient} />;
};

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
  const rowH = 56;
  const isTop3 = rank <= 3;
  const medalColors = [0xffd700, 0xc0c0c0, 0xcd7f32]; // Gold, Silver, Bronze
  const medalIcons = ['\u{1F947}', '\u{1F948}', '\u{1F949}']; // 🥇🥈🥉

  const drawRow = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.setFillStyle({ color: rank % 2 === 0 ? 0x1e293b : 0x0f172a, alpha: 0.85 });
      g.roundRect(0, 0, width, rowH, 10);
      g.fill();
      if (isTop3) {
        g.setStrokeStyle({ width: 2, color: medalColors[rank - 1], alpha: 0.8 });
        g.roundRect(0, 0, width, rowH, 10);
        g.stroke();
      }
    },
    [width, rank, isTop3]
  );

  const rankDisplay = isTop3 ? medalIcons[rank - 1] : `#${rank}`;

  return (
    <pixiContainer y={y}>
      <pixiGraphics draw={drawRow} />

      {/* Rank */}
      <pixiText
        text={rankDisplay}
        x={isTop3 ? 28 : 28}
        y={rowH / 2}
        anchor={0.5}
        style={{ fontFamily: isTop3 ? 'Arial' : FONT, fontSize: isTop3 ? 24 : 16, fill: 0xffffff }}
      />

      {/* Player Name */}
      <pixiText
        text={entry.player_name || `Game #${entry.token_id}`}
        x={60}
        y={rowH / 2}
        anchor={{ x: 0, y: 0.5 }}
        style={{ fontFamily: FONT, fontSize: 15, fill: 0xffffff }}
      />

      {/* Level */}
      <pixiText
        text={`Lv ${entry.level}`}
        x={width - 100}
        y={rowH / 2}
        anchor={{ x: 0.5, y: 0.5 }}
        style={{ fontFamily: 'Arial, sans-serif', fontSize: 13, fill: 0x60a5fa }}
      />

      {/* Score */}
      <pixiText
        text={String(entry.totalScore)}
        x={width - 40}
        y={rowH / 2}
        anchor={{ x: 0.5, y: 0.5 }}
        style={{ fontFamily: FONT, fontSize: 16, fill: 0xffffff }}
      />

      {/* Status */}
      <pixiText
        text={entry.gameOver ? '\u{2705}' : '\u{25B6}'}
        x={width - 8}
        y={rowH / 2}
        anchor={{ x: 1, y: 0.5 }}
        style={{ fontSize: 14 }}
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
  const headerH = 36;
  const rowH = 56;
  const rowGap = 8;
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
      g.setFillStyle({ color: 0x334155, alpha: 0.6 });
      g.roundRect(0, 0, contentWidth, headerH, 8);
      g.fill();
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
      {/* Background */}
      <SkyBackground w={screenWidth} h={screenHeight} />

      {/* Top bar */}
      <PageTopBar
        title="Leaderboard"
        subtitle={loading ? 'Loading...' : `${entries.length} players`}
        screenWidth={screenWidth}
        topBarHeight={topBarHeight}
        actionIcon="\u{1F504}"
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
          style={{ fontFamily: 'Arial', fontSize: 11, fill: 0x94a3b8 }}
        />
        <pixiText
          text="PLAYER"
          x={60}
          y={headerH / 2}
          anchor={{ x: 0, y: 0.5 }}
          style={{ fontFamily: 'Arial', fontSize: 11, fill: 0x94a3b8 }}
        />
        <pixiText
          text="LVL"
          x={contentWidth - 100}
          y={headerH / 2}
          anchor={0.5}
          style={{ fontFamily: 'Arial', fontSize: 11, fill: 0x94a3b8 }}
        />
        <pixiText
          text="SCORE"
          x={contentWidth - 40}
          y={headerH / 2}
          anchor={0.5}
          style={{ fontFamily: 'Arial', fontSize: 11, fill: 0x94a3b8 }}
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
            style={{ fontFamily: FONT, fontSize: 16, fill: 0x64748b }}
          />
        ) : entries.length === 0 ? (
          <pixiText
            text="No games yet. Be the first!"
            x={contentWidth / 2}
            y={80}
            anchor={0.5}
            style={{ fontFamily: FONT, fontSize: 16, fill: 0x64748b }}
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
