/**
 * MyGamesPage - Full-screen view of player's games
 * Split into "Ongoing" and "Finished" sections
 */

import { useState, useCallback, useRef } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { PageTopBar } from './PageTopBar';
import { FONT_TITLE, FONT_BODY } from '../../utils/colors';


// ============================================================================
// TYPES
// ============================================================================

export interface PlayerGame {
  tokenId: number;
  name: string;
  level: number;
  totalScore: number;
  cubesAvailable: number;
  gameOver: boolean;
}

// ============================================================================
// GAME ROW - Single line: Lv X - XXX pts - XX cubes - Play
// ============================================================================

const GameRow = ({
  game,
  x,
  y,
  width,
  onPress,
}: {
  game: PlayerGame;
  x: number;
  y: number;
  width: number;
  onPress: () => void;
}) => {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  
  const isActive = !game.gameOver;
  const height = 44;
  const bgColor = isActive ? 0x3b82f6 : 0x475569;
  const borderColor = isActive ? 0x60a5fa : 0x64748b;
  const scale = pressed ? 0.98 : hovered ? 1.01 : 1;

  const drawRow = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.setFillStyle({ color: bgColor, alpha: 0.9 });
      g.roundRect(0, 0, width, height, 10);
      g.fill();
      g.setStrokeStyle({ width: 1.5, color: borderColor, alpha: 0.7 });
      g.roundRect(0, 0, width, height, 10);
      g.stroke();
    },
    [width, bgColor, borderColor]
  );

  const centerY = height / 2;

  return (
    <pixiContainer x={x} y={y} scale={scale}>
      <pixiGraphics
        draw={drawRow}
        eventMode="static"
        cursor="pointer"
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => { setPressed(false); onPress(); }}
        onPointerUpOutside={() => { setPressed(false); setHovered(false); }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => { setHovered(false); setPressed(false); }}
      />

      {/* Lv X */}
      <pixiText
        text={`Lv ${game.level}`}
        x={12}
        y={centerY}
        anchor={{ x: 0, y: 0.5 }}
        style={{ fontFamily: FONT_TITLE, fontSize: 16, fill: 0xffffff }}
      />

      {/* XXX pts */}
      <pixiText
        text={`${game.totalScore} pts`}
        x={width * 0.32}
        y={centerY}
        anchor={{ x: 0.5, y: 0.5 }}
        style={{ fontFamily: FONT_BODY, fontSize: 13, fill: 0xffffff }}
      />

      {/* XX cubes */}
      <pixiText
        text={`🧊 ${game.cubesAvailable}`}
        x={width * 0.55}
        y={centerY}
        anchor={{ x: 0.5, y: 0.5 }}
        style={{ fontSize: 13, fill: 0xfbbf24 }}
      />

      {/* Play button or checkmark */}
      {isActive ? (
        <pixiText
          text="Play ▶"
          x={width - 12}
          y={centerY}
          anchor={{ x: 1, y: 0.5 }}
          style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 'bold', fill: 0x22c55e }}
        />
      ) : (
        <pixiText
          text="✓"
          x={width - 12}
          y={centerY}
          anchor={{ x: 1, y: 0.5 }}
          style={{ fontSize: 16, fill: 0x94a3b8 }}
        />
      )}
    </pixiContainer>
  );
};

// ============================================================================
// SECTION HEADER
// ============================================================================

const SectionHeader = ({
  title,
  count,
  y,
}: {
  title: string;
  count: number;
  y: number;
}) => {
  return (
    <pixiText
      text={`${title} (${count})`}
      x={0}
      y={y}
      style={{ fontFamily: FONT_TITLE, fontSize: 14, fill: 0xffffff, alpha: 0.9 }}
    />
  );
};

// ============================================================================
// MY GAMES PAGE
// ============================================================================

interface MyGamesPageProps {
  games: PlayerGame[];
  loading: boolean;
  screenWidth: number;
  screenHeight: number;
  topBarHeight: number;
  onResumeGame: (tokenId: number) => void;
}

export const MyGamesPage = ({
  games,
  loading,
  screenWidth,
  screenHeight,
  topBarHeight,
  onResumeGame,
}: MyGamesPageProps) => {
  const [scrollY, setScrollY] = useState(0);
  const isDragging = useRef(false);
  const lastY = useRef(0);

  const contentPadding = 16;
  const contentTop = topBarHeight + contentPadding;
  const contentWidth = screenWidth - contentPadding * 2;
  const listHeight = screenHeight - contentTop - contentPadding;

  // Split games into ongoing and finished
  const ongoingGames = games.filter((g) => !g.gameOver).sort((a, b) => b.level - a.level);
  const finishedGames = games.filter((g) => g.gameOver).sort((a, b) => b.totalScore - a.totalScore);

  // Row dimensions
  const rowHeight = 44;
  const rowGap = 8;
  const sectionHeaderHeight = 24;
  const sectionGap = 16;

  // Calculate total content height
  const ongoingHeight = ongoingGames.length > 0 
    ? sectionHeaderHeight + ongoingGames.length * (rowHeight + rowGap) 
    : 0;
  const finishedHeight = finishedGames.length > 0 
    ? sectionHeaderHeight + finishedGames.length * (rowHeight + rowGap) 
    : 0;
  const totalHeight = ongoingHeight + (ongoingHeight > 0 && finishedHeight > 0 ? sectionGap : 0) + finishedHeight;
  const maxScroll = Math.max(0, totalHeight - listHeight + 20);

  const dragStartY = useRef(0);
  const dragThreshold = 8;

  const handlePointerDown = useCallback((e: any) => {
    lastY.current = e.data.global.y;
    dragStartY.current = e.data.global.y;
    isDragging.current = false;
  }, []);

  const handlePointerMove = useCallback(
    (e: any) => {
      const currentY = e.data.global.y;
      const totalDelta = Math.abs(currentY - dragStartY.current);

      if (!isDragging.current && totalDelta > dragThreshold) {
        isDragging.current = true;
      }

      if (!isDragging.current) return;
      const dy = lastY.current - currentY;
      lastY.current = currentY;
      setScrollY((prev) => Math.max(0, Math.min(maxScroll, prev + dy)));
    },
    [maxScroll]
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Draw scroll indicator
  const drawScrollTrack = useCallback(
    (g: PixiGraphics) => {
      if (totalHeight <= listHeight) return;
      g.clear();
      const trackH = listHeight - 20;
      const thumbH = Math.max(40, (listHeight / totalHeight) * trackH);
      const thumbY = maxScroll > 0 ? (scrollY / maxScroll) * (trackH - thumbH) : 0;

      g.roundRect(contentWidth + 6, 10, 5, trackH, 2);
      g.fill({ color: 0x334155, alpha: 0.3 });

      g.roundRect(contentWidth + 6, 10 + thumbY, 5, thumbH, 2);
      g.fill({ color: 0x64748b, alpha: 0.8 });
    },
    [contentWidth, listHeight, totalHeight, scrollY, maxScroll]
  );

  return (
    <pixiContainer>
      {/* Top bar */}
      <PageTopBar
        title="My Games"
        subtitle={`${ongoingGames.length} ongoing, ${finishedGames.length} finished`}
        screenWidth={screenWidth}
        topBarHeight={topBarHeight}
      />

      {/* Content */}
      <pixiContainer x={contentPadding} y={contentTop}>
        {loading ? (
          <pixiText
            text="Loading games..."
            x={contentWidth / 2}
            y={80}
            anchor={0.5}
            style={{ fontFamily: FONT_TITLE, fontSize: 16, fill: 0x64748b }}
          />
        ) : games.length === 0 ? (
          <pixiContainer>
            <pixiText
              text="No games yet!"
              x={contentWidth / 2}
              y={80}
              anchor={0.5}
              style={{ fontFamily: FONT_TITLE, fontSize: 20, fill: 0x64748b }}
            />
            <pixiText
              text="Start a new game from the home screen"
              x={contentWidth / 2}
              y={110}
              anchor={0.5}
              style={{ fontFamily: FONT_BODY, fontSize: 13, fill: 0x94a3b8 }}
            />
          </pixiContainer>
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

            {/* Scrollable content */}
            <pixiContainer y={-scrollY}>
              {/* Ongoing Games Section */}
              {ongoingGames.length > 0 && (
                <pixiContainer y={0}>
                  <SectionHeader title="Ongoing" count={ongoingGames.length} y={0} />
                  {ongoingGames.map((game, index) => (
                    <GameRow
                      key={game.tokenId}
                      game={game}
                      x={0}
                      y={sectionHeaderHeight + index * (rowHeight + rowGap)}
                      width={contentWidth}
                      onPress={() => onResumeGame(game.tokenId)}
                    />
                  ))}
                </pixiContainer>
              )}

              {/* Finished Games Section */}
              {finishedGames.length > 0 && (
                <pixiContainer y={ongoingHeight + (ongoingHeight > 0 ? sectionGap : 0)}>
                  <SectionHeader title="Finished" count={finishedGames.length} y={0} />
                  {finishedGames.map((game, index) => (
                    <GameRow
                      key={game.tokenId}
                      game={game}
                      x={0}
                      y={sectionHeaderHeight + index * (rowHeight + rowGap)}
                      width={contentWidth}
                      onPress={() => onResumeGame(game.tokenId)}
                    />
                  ))}
                </pixiContainer>
              )}
            </pixiContainer>

            {/* Scroll indicator */}
            <pixiGraphics draw={drawScrollTrack} />
          </pixiContainer>
        )}
      </pixiContainer>
    </pixiContainer>
  );
};

export default MyGamesPage;
