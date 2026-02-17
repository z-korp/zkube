import { useState, useCallback, useRef, useMemo } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { PageTopBar } from './PageTopBar';
import { PixiScrollContainer } from '../../ui/PixiScrollContainer';
import { PixiButton } from '../../ui/PixiButton';
import { FONT_TITLE, FONT_BODY } from '../../utils/colors';
import { color, space } from '@/pixi/design/tokens';
import type { PlayerGame } from './MainScreen';

const GAME_LEVEL_STYLE = { fontFamily: FONT_TITLE, fontSize: 16, fill: color.text.primary };
const GAME_SCORE_STYLE = { fontFamily: FONT_BODY, fontSize: 13, fill: color.text.primary };
const GAME_CUBES_STYLE = { fontSize: 13, fill: color.accent.gold };
const GAME_PLAY_STYLE = { fontFamily: FONT_BODY, fontSize: 13, fontWeight: 'bold' as const, fill: color.status.success };
const GAME_DONE_STYLE = { fontSize: 16, fill: color.text.secondary };
const SECTION_STYLE = { fontFamily: FONT_TITLE, fontSize: 14, fill: color.text.primary, alpha: 0.9 };
const LOADING_STYLE = { fontFamily: FONT_TITLE, fontSize: 16, fill: color.text.muted };
const EMPTY_TITLE_STYLE = { fontFamily: FONT_TITLE, fontSize: 20, fill: color.text.muted };
const EMPTY_SUB_STYLE = { fontFamily: FONT_BODY, fontSize: 13, fill: color.text.secondary };

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
  const height = 52;
  const bgColor = isActive ? color.accent.blue : color.state.hover;
  const borderColor = isActive ? color.status.success : color.text.muted;
  const scale = pressed ? 0.98 : hovered ? 1.01 : 1;

  const drawRow = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.setFillStyle({ color: bgColor, alpha: isActive ? 0.2 : 0.6 });
      g.roundRect(0, 0, width, height, 10);
      g.fill();
      g.setStrokeStyle({ width: isActive ? 2 : 1, color: borderColor, alpha: isActive ? 0.8 : 0.5 });
      g.roundRect(0, 0, width, height, 10);
      g.stroke();
    },
    [width, bgColor, borderColor, isActive],
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

      <pixiText text={`Lv ${game.level}`} x={12} y={centerY} anchor={{ x: 0, y: 0.5 }} style={GAME_LEVEL_STYLE} eventMode="none" />
      <pixiText text={`${game.totalScore} pts`} x={width * 0.32} y={centerY} anchor={{ x: 0.5, y: 0.5 }} style={GAME_SCORE_STYLE} eventMode="none" />
      <pixiText text={`🧊 ${game.cubesAvailable}`} x={width * 0.55} y={centerY} anchor={{ x: 0.5, y: 0.5 }} style={GAME_CUBES_STYLE} eventMode="none" />

      {isActive ? (
        <pixiText text="Play ▶" x={width - 12} y={centerY} anchor={{ x: 1, y: 0.5 }} style={GAME_PLAY_STYLE} eventMode="none" />
      ) : (
        <pixiText text="✓" x={width - 12} y={centerY} anchor={{ x: 1, y: 0.5 }} style={GAME_DONE_STYLE} eventMode="none" />
      )}
    </pixiContainer>
  );
};

const SectionHeader = ({ title, count, y }: { title: string; count: number; y: number }) => (
  <pixiText text={`${title} (${count})`} x={0} y={y} style={SECTION_STYLE} eventMode="none" />
);

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
  const contentPadding = space.lg;
  const contentTop = topBarHeight + contentPadding;
  const contentWidth = screenWidth - contentPadding * 2;
  const listHeight = screenHeight - contentTop - contentPadding;

  const ongoingGames = useMemo(() => games.filter((g) => !g.gameOver).sort((a, b) => b.level - a.level), [games]);
  const finishedGames = useMemo(() => games.filter((g) => g.gameOver).sort((a, b) => b.totalScore - a.totalScore), [games]);

  const rowHeight = 52;
  const rowGap = 8;
  const sectionHeaderHeight = 24;
  const sectionGap = 16;

  const ongoingHeight = ongoingGames.length > 0
    ? sectionHeaderHeight + ongoingGames.length * (rowHeight + rowGap)
    : 0;
  const finishedHeight = finishedGames.length > 0
    ? sectionHeaderHeight + finishedGames.length * (rowHeight + rowGap)
    : 0;
  const totalHeight = ongoingHeight + (ongoingHeight > 0 && finishedHeight > 0 ? sectionGap : 0) + finishedHeight + 20;

  return (
    <pixiContainer>
      <PageTopBar
        title="MY GAMES"
        subtitle={`${ongoingGames.length} ONGOING, ${finishedGames.length} FINISHED`}
        screenWidth={screenWidth}
        topBarHeight={topBarHeight}
      />

      <pixiContainer x={contentPadding} y={contentTop}>
        {loading ? (
          <pixiText text="LOADING GAMES..." x={contentWidth / 2} y={80} anchor={0.5} style={LOADING_STYLE} eventMode="none" />
        ) : games.length === 0 ? (
          <pixiContainer>
            <pixiText text="NO GAMES YET!" x={contentWidth / 2} y={80} anchor={0.5} style={EMPTY_TITLE_STYLE} eventMode="none" />
            <pixiText text="START A NEW GAME FROM THE HOME SCREEN" x={contentWidth / 2} y={110} anchor={0.5} style={EMPTY_SUB_STYLE} eventMode="none" />
          </pixiContainer>
        ) : (
          <PixiScrollContainer
            width={contentWidth}
            height={listHeight}
            contentHeight={totalHeight}
          >
            {ongoingGames.length > 0 && (
              <pixiContainer y={0}>
                <SectionHeader title="ONGOING" count={ongoingGames.length} y={0} />
                {ongoingGames.map((game, index) => (
                  <GameRow
                    key={game.tokenId}
                    game={game}
                    x={0}
                    y={sectionHeaderHeight + index * (rowHeight + rowGap)}
                    width={contentWidth - 10}
                    onPress={() => onResumeGame(game.tokenId)}
                  />
                ))}
              </pixiContainer>
            )}

            {finishedGames.length > 0 && (
              <pixiContainer y={ongoingHeight + (ongoingHeight > 0 ? sectionGap : 0)}>
                <SectionHeader title="FINISHED" count={finishedGames.length} y={0} />
                {finishedGames.map((game, index) => (
                  <GameRow
                    key={game.tokenId}
                    game={game}
                    x={0}
                    y={sectionHeaderHeight + index * (rowHeight + rowGap)}
                    width={contentWidth - 10}
                    onPress={() => onResumeGame(game.tokenId)}
                  />
                ))}
              </pixiContainer>
            )}
          </PixiScrollContainer>
        )}
      </pixiContainer>
    </pixiContainer>
  );
};

export default MyGamesPage;
