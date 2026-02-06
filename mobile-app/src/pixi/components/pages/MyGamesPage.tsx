/**
 * MyGamesPage - Full-screen grid view of player's games
 * Grid layout similar to level select in puzzle games
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
// GAME CARD
// ============================================================================

const GameCard = ({
  game,
  x,
  y,
  size,
  onPress,
}: {
  game: PlayerGame;
  x: number;
  y: number;
  size: number;
  onPress: () => void;
}) => {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const scale = pressed ? 0.95 : hovered ? 1.02 : 1;

  const isActive = !game.gameOver;
  const cardColor = isActive ? 0x3b82f6 : 0x64748b;
  const borderColor = isActive ? 0x60a5fa : 0x94a3b8;

  const drawCard = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      // Shadow
      g.setFillStyle({ color: 0x000000, alpha: 0.2 });
      g.roundRect(4, 4, size, size, 16);
      g.fill();
      // Card
      g.setFillStyle({ color: cardColor, alpha: 0.95 });
      g.roundRect(0, 0, size, size, 16);
      g.fill();
      // Highlight
      g.setFillStyle({ color: 0xffffff, alpha: 0.2 });
      g.roundRect(4, 4, size - 8, size * 0.3, 12);
      g.fill();
      // Border
      g.setStrokeStyle({ width: 2, color: borderColor, alpha: 0.8 });
      g.roundRect(0, 0, size, size, 16);
      g.stroke();
    },
    [size, cardColor, borderColor]
  );

  // Star rating based on level (max 3 stars per 10 levels)
  const stars = Math.min(3, Math.floor(game.level / 10) + (game.level > 0 ? 1 : 0));
  const starDisplay = '\u{2B50}'.repeat(stars) + '\u{2606}'.repeat(3 - stars);

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

      {/* Level number */}
      <pixiText
        text={String(game.level)}
        x={size / 2}
        y={size * 0.35}
        anchor={0.5}
        style={{
          fontFamily: FONT,
          fontSize: size * 0.28,
          fill: 0xffffff,
          dropShadow: {
            alpha: 0.4,
            angle: Math.PI / 4,
            blur: 2,
            distance: 2,
            color: 0x000000,
          },
        }}
      />

      {/* Stars */}
      <pixiText
        text={starDisplay}
        x={size / 2}
        y={size * 0.65}
        anchor={0.5}
        style={{ fontSize: size * 0.12 }}
      />

      {/* Score */}
      <pixiText
        text={String(game.totalScore)}
        x={size / 2}
        y={size * 0.82}
        anchor={0.5}
        style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: size * 0.1,
          fill: 0xffffff,
          alpha: 0.9,
        }}
      />

      {/* Game over indicator */}
      {game.gameOver && (
        <pixiText
          text="\u{2705}"
          x={size - 8}
          y={8}
          anchor={{ x: 1, y: 0 }}
          style={{ fontSize: size * 0.15 }}
        />
      )}

      {/* Active indicator (play icon) */}
      {isActive && (
        <pixiText
          text="\u{25B6}"
          x={size - 10}
          y={10}
          anchor={{ x: 1, y: 0 }}
          style={{ fontSize: size * 0.12, fill: 0x22c55e }}
        />
      )}
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

  // Grid configuration
  const columns = 3;
  const cardGap = 12;
  const cardSize = Math.floor((contentWidth - cardGap * (columns - 1)) / columns);

  // Sort games: active first, then by level descending
  const sortedGames = [...games].sort((a, b) => {
    if (a.gameOver !== b.gameOver) return a.gameOver ? 1 : -1;
    return b.level - a.level;
  });

  const rows = Math.ceil(sortedGames.length / columns);
  const totalHeight = rows * (cardSize + cardGap);
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

  const activeCount = games.filter((g) => !g.gameOver).length;

  return (
    <pixiContainer>
      {/* Top bar */}
      <PageTopBar
        title="My Games"
        subtitle={`${activeCount} active, ${games.length} total`}
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
        ) : sortedGames.length === 0 ? (
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

            {/* Grid of cards */}
            <pixiContainer y={-scrollY}>
              {sortedGames.map((game, index) => {
                const col = index % columns;
                const row = Math.floor(index / columns);
                const cardX = col * (cardSize + cardGap);
                const cardY = row * (cardSize + cardGap);

                return (
                  <GameCard
                    key={game.tokenId}
                    game={game}
                    x={cardX}
                    y={cardY}
                    size={cardSize}
                    onPress={() => onResumeGame(game.tokenId)}
                  />
                );
              })}
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
