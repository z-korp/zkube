/**
 * MyGamesPage - Full-screen view of player's games
 * Split into "Ongoing" and "Finished" sections
 */

import { useState, useCallback, useRef } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { PageTopBar } from './PageTopBar';

const FONT = 'Fredericka the Great, Bangers, Arial Black, sans-serif';

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
// GAME CARD - Redesigned to show level, cubes, score
// ============================================================================

const GameCard = ({
  game,
  x,
  y,
  width,
  height,
  onPress,
}: {
  game: PlayerGame;
  x: number;
  y: number;
  width: number;
  height: number;
  onPress: () => void;
}) => {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const scale = pressed ? 0.98 : hovered ? 1.01 : 1;

  const isActive = !game.gameOver;
  const cardColor = isActive ? 0x3b82f6 : 0x475569;
  const borderColor = isActive ? 0x60a5fa : 0x64748b;

  const drawCard = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      // Shadow
      g.setFillStyle({ color: 0x000000, alpha: 0.25 });
      g.roundRect(3, 3, width, height, 14);
      g.fill();
      // Card background
      g.setFillStyle({ color: cardColor, alpha: 0.95 });
      g.roundRect(0, 0, width, height, 14);
      g.fill();
      // Top highlight
      g.setFillStyle({ color: 0xffffff, alpha: 0.15 });
      g.roundRect(4, 4, width - 8, height * 0.25, 10);
      g.fill();
      // Border
      g.setStrokeStyle({ width: 2, color: borderColor, alpha: 0.9 });
      g.roundRect(0, 0, width, height, 14);
      g.stroke();
    },
    [width, height, cardColor, borderColor]
  );

  return (
    <pixiContainer x={x} y={y} scale={scale}>
      <pixiGraphics
        draw={drawCard}
        eventMode="static"
        cursor="pointer"
        onPointerDown={() => setPressed(true)}
        onPointerUp={() => {
          setPressed(false);
          onPress();
        }}
        onPointerUpOutside={() => {
          setPressed(false);
          setHovered(false);
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => {
          setHovered(false);
          setPressed(false);
        }}
      />

      {/* Left section: Level */}
      <pixiContainer x={12} y={height / 2}>
        <pixiText
          text="Lv"
          x={0}
          y={-12}
          anchor={{ x: 0, y: 0.5 }}
          style={{ fontFamily: 'Arial, sans-serif', fontSize: 11, fill: 0xffffff, alpha: 0.7 }}
        />
        <pixiText
          text={String(game.level)}
          x={0}
          y={8}
          anchor={{ x: 0, y: 0.5 }}
          style={{
            fontFamily: FONT,
            fontSize: 28,
            fill: 0xffffff,
            dropShadow: { alpha: 0.3, angle: Math.PI / 4, blur: 2, distance: 1, color: 0x000000 },
          }}
        />
      </pixiContainer>

      {/* Middle section: Cubes */}
      <pixiContainer x={width / 2} y={height / 2}>
        <pixiText
          text="🧊"
          x={-20}
          y={0}
          anchor={0.5}
          style={{ fontSize: 18 }}
        />
        <pixiText
          text={String(game.cubesAvailable)}
          x={8}
          y={0}
          anchor={{ x: 0, y: 0.5 }}
          style={{
            fontFamily: FONT,
            fontSize: 20,
            fill: 0xfbbf24,
          }}
        />
      </pixiContainer>

      {/* Right section: Score */}
      <pixiContainer x={width - 12} y={height / 2}>
        <pixiText
          text={String(game.totalScore)}
          x={0}
          y={0}
          anchor={{ x: 1, y: 0.5 }}
          style={{
            fontFamily: FONT,
            fontSize: 18,
            fill: 0xffffff,
          }}
        />
        <pixiText
          text="pts"
          x={0}
          y={14}
          anchor={{ x: 1, y: 0.5 }}
          style={{ fontFamily: 'Arial, sans-serif', fontSize: 10, fill: 0xffffff, alpha: 0.6 }}
        />
      </pixiContainer>

      {/* Play indicator for active games */}
      {isActive && (
        <pixiText
          text="▶"
          x={width - 10}
          y={10}
          anchor={{ x: 1, y: 0 }}
          style={{ fontSize: 12, fill: 0x22c55e }}
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
  x,
  y,
  width,
}: {
  title: string;
  count: number;
  x: number;
  y: number;
  width: number;
}) => {
  const drawLine = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.setStrokeStyle({ width: 1, color: 0x64748b, alpha: 0.5 });
      g.moveTo(0, 12);
      g.lineTo(width, 12);
      g.stroke();
    },
    [width]
  );

  return (
    <pixiContainer x={x} y={y}>
      <pixiText
        text={title}
        x={0}
        y={0}
        style={{
          fontFamily: FONT,
          fontSize: 16,
          fill: 0xffffff,
        }}
      />
      <pixiText
        text={`(${count})`}
        x={title.length * 10 + 8}
        y={2}
        style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: 12,
          fill: 0x94a3b8,
        }}
      />
      <pixiGraphics draw={drawLine} y={12} />
    </pixiContainer>
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

  // Card dimensions
  const cardHeight = 70;
  const cardGap = 10;
  const sectionHeaderHeight = 32;
  const sectionGap = 20;

  // Calculate total content height
  const ongoingHeight = ongoingGames.length > 0 
    ? sectionHeaderHeight + ongoingGames.length * (cardHeight + cardGap) 
    : 0;
  const finishedHeight = finishedGames.length > 0 
    ? sectionHeaderHeight + finishedGames.length * (cardHeight + cardGap) 
    : 0;
  const totalHeight = ongoingHeight + (ongoingHeight > 0 && finishedHeight > 0 ? sectionGap : 0) + finishedHeight;
  const maxScroll = Math.max(0, totalHeight - listHeight + 20);

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

  // Draw scroll indicator
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
            style={{ fontFamily: FONT, fontSize: 16, fill: 0x64748b }}
          />
        ) : games.length === 0 ? (
          <pixiContainer>
            <pixiText
              text="No games yet!"
              x={contentWidth / 2}
              y={80}
              anchor={0.5}
              style={{ fontFamily: FONT, fontSize: 20, fill: 0x64748b }}
            />
            <pixiText
              text="Start a new game from the home screen"
              x={contentWidth / 2}
              y={110}
              anchor={0.5}
              style={{ fontFamily: 'Arial, sans-serif', fontSize: 13, fill: 0x94a3b8 }}
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
                  <SectionHeader
                    title="Ongoing"
                    count={ongoingGames.length}
                    x={0}
                    y={0}
                    width={contentWidth}
                  />
                  {ongoingGames.map((game, index) => (
                    <GameCard
                      key={game.tokenId}
                      game={game}
                      x={0}
                      y={sectionHeaderHeight + index * (cardHeight + cardGap)}
                      width={contentWidth}
                      height={cardHeight}
                      onPress={() => onResumeGame(game.tokenId)}
                    />
                  ))}
                </pixiContainer>
              )}

              {/* Finished Games Section */}
              {finishedGames.length > 0 && (
                <pixiContainer y={ongoingHeight + (ongoingHeight > 0 ? sectionGap : 0)}>
                  <SectionHeader
                    title="Finished"
                    count={finishedGames.length}
                    x={0}
                    y={0}
                    width={contentWidth}
                  />
                  {finishedGames.map((game, index) => (
                    <GameCard
                      key={game.tokenId}
                      game={game}
                      x={0}
                      y={sectionHeaderHeight + index * (cardHeight + cardGap)}
                      width={contentWidth}
                      height={cardHeight}
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
