/**
 * MyGamesModal - PixiJS modal showing In Progress / Finished tabs
 * Each game card shows: #id, name, level, score, cubes, Resume button
 */

import { useState, useCallback, useMemo } from 'react';
import { Graphics as PixiGraphics, TextStyle } from 'pixi.js';
import { Modal, Button } from '../ui';

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

interface MyGamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  games: PlayerGame[];
  loading: boolean;
  screenWidth: number;
  screenHeight: number;
  onResumeGame: (tokenId: number) => void;
}

// ============================================================================
// TAB BUTTON
// ============================================================================

const TabButton = ({
  label, active, x, y, width, height, onClick,
}: {
  label: string; active: boolean; x: number; y: number;
  width: number; height: number; onClick: () => void;
}) => {
  const [hovered, setHovered] = useState(false);

  const draw = useCallback((g: PixiGraphics) => {
    g.clear();
    const r = 8;
    if (active) {
      g.setFillStyle({ color: 0x3B82F6, alpha: 0.9 });
    } else {
      g.setFillStyle({ color: hovered ? 0x334155 : 0x1E293B, alpha: 0.8 });
    }
    g.roundRect(0, 0, width, height, r);
    g.fill();
    if (active) {
      g.setStrokeStyle({ width: 1.5, color: 0x60A5FA, alpha: 0.6 });
      g.roundRect(0, 0, width, height, r);
      g.stroke();
    }
  }, [width, height, active, hovered]);

  return (
    <pixiContainer x={x} y={y}>
      <pixiGraphics draw={draw}
        eventMode="static" cursor="pointer"
        onPointerDown={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      />
      <pixiText text={label} x={width / 2} y={height / 2} anchor={0.5}
        style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: 13,
          fontWeight: active ? 'bold' : 'normal',
          fill: active ? 0xFFFFFF : 0x94A3B8,
        }}
      />
    </pixiContainer>
  );
};

// ============================================================================
// GAME CARD
// ============================================================================

const GameCard = ({
  game, y, width, onResume,
}: {
  game: PlayerGame; y: number; width: number;
  onResume: (tokenId: number) => void;
}) => {
  const [hovered, setHovered] = useState(false);
  const cardH = 80;
  const pad = 12;

  const drawCard = useCallback((g: PixiGraphics) => {
    g.clear();
    g.setFillStyle({ color: hovered ? 0x1E293B : 0x0F172A, alpha: 0.9 });
    g.roundRect(0, 0, width, cardH, 10);
    g.fill();
    g.setStrokeStyle({ width: 1, color: 0x334155, alpha: 0.5 });
    g.roundRect(0, 0, width, cardH, 10);
    g.stroke();
  }, [width, hovered]);

  const labelStyle = useMemo(() => ({
    fontFamily: 'Arial, sans-serif',
    fontSize: 10,
    fill: 0x64748B,
  }), []);

  const valueStyle = useMemo(() => ({
    fontFamily: 'Arial, sans-serif',
    fontSize: 14,
    fontWeight: 'bold' as const,
    fill: 0xFFFFFF,
  }), []);

  const resumeBtnW = 70;
  const resumeBtnH = 28;

  return (
    <pixiContainer y={y}>
      <pixiGraphics draw={drawCard}
        eventMode="static"
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      />

      {/* Title: #id Name */}
      <pixiText
        text={`#${game.tokenId}`}
        x={pad} y={10}
        style={{ fontFamily: 'Arial, sans-serif', fontSize: 12, fill: 0x64748B }}
      />
      <pixiText
        text={game.name}
        x={pad + 35} y={10}
        style={{ fontFamily: 'Arial, sans-serif', fontSize: 12, fontWeight: 'bold', fill: 0xFFFFFF }}
      />

      {/* Stats row */}
      <pixiText text="LEVEL" x={pad} y={36} style={labelStyle} />
      <pixiText text={String(game.level)} x={pad} y={50} style={valueStyle} />

      <pixiText text="SCORE" x={pad + 70} y={36} style={labelStyle} />
      <pixiText text={String(game.totalScore)} x={pad + 70} y={50} style={valueStyle} />

      <pixiText text="CUBES" x={pad + 145} y={36} style={labelStyle} />
      <pixiText text={String(game.cubesAvailable)} x={pad + 145} y={50}
        style={{ fontFamily: 'Arial, sans-serif', fontSize: 14, fontWeight: 'bold', fill: 0xFBBF24 }}
      />

      {/* Resume / Finished button */}
      {!game.gameOver ? (
        <pixiContainer x={width - resumeBtnW - pad} y={(cardH - resumeBtnH) / 2}>
          <Button
            text="Resume"
            width={resumeBtnW}
            height={resumeBtnH}
            variant="primary"
            fontSize={12}
            onClick={() => onResume(game.tokenId)}
          />
        </pixiContainer>
      ) : (
        <pixiText text="Finished"
          x={width - pad} y={cardH / 2}
          anchor={{ x: 1, y: 0.5 }}
          style={{ fontFamily: 'Arial, sans-serif', fontSize: 11, fill: 0x64748B }}
        />
      )}
    </pixiContainer>
  );
};

// ============================================================================
// MY GAMES MODAL
// ============================================================================

export const MyGamesModal = ({
  isOpen, onClose, games, loading,
  screenWidth, screenHeight, onResumeGame,
}: MyGamesModalProps) => {
  const [activeTab, setActiveTab] = useState<'progress' | 'finished'>('progress');

  const modalW = Math.min(380, screenWidth - 40);
  const contentW = modalW - 48;
  const tabW = (contentW - 8) / 2;
  const tabH = 32;

  const activeGames = useMemo(() => games.filter(g => !g.gameOver), [games]);
  const finishedGames = useMemo(() => games.filter(g => g.gameOver), [games]);
  const displayGames = activeTab === 'progress' ? activeGames : finishedGames;

  // Max visible games (scrolling not possible in PixiJS easily, so cap at ~4)
  const maxVisible = 4;
  const visibleGames = displayGames.slice(0, maxVisible);
  const cardH = 80;
  const cardGap = 8;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="My Games"
      subtitle={loading ? "Loading..." : `${activeGames.length} in progress`}
      width={modalW}
      screenWidth={screenWidth}
      screenHeight={screenHeight}
    >
      <pixiContainer x={24} y={0}>
        {/* Tabs */}
        <TabButton
          label={`In Progress (${activeGames.length})`}
          active={activeTab === 'progress'}
          x={0} y={0} width={tabW} height={tabH}
          onClick={() => setActiveTab('progress')}
        />
        <TabButton
          label={`Finished (${finishedGames.length})`}
          active={activeTab === 'finished'}
          x={tabW + 8} y={0} width={tabW} height={tabH}
          onClick={() => setActiveTab('finished')}
        />

        {/* Game cards */}
        <pixiContainer y={tabH + 12}>
          {loading ? (
            <pixiText text="Loading games..."
              x={contentW / 2} y={40} anchor={{ x: 0.5, y: 0.5 }}
              style={{ fontFamily: 'Arial, sans-serif', fontSize: 14, fill: 0x94A3B8 }}
            />
          ) : visibleGames.length === 0 ? (
            <pixiText
              text={activeTab === 'progress' ? "No active games" : "No finished games"}
              x={contentW / 2} y={40} anchor={{ x: 0.5, y: 0.5 }}
              style={{ fontFamily: 'Arial, sans-serif', fontSize: 14, fill: 0x64748B }}
            />
          ) : (
            visibleGames.map((game, i) => (
              <GameCard
                key={game.tokenId}
                game={game}
                y={i * (cardH + cardGap)}
                width={contentW}
                onResume={onResumeGame}
              />
            ))
          )}

          {/* "More" indicator */}
          {displayGames.length > maxVisible && (
            <pixiText
              text={`+${displayGames.length - maxVisible} more`}
              x={contentW / 2}
              y={maxVisible * (cardH + cardGap) + 4}
              anchor={{ x: 0.5, y: 0 }}
              style={{ fontFamily: 'Arial, sans-serif', fontSize: 11, fill: 0x64748B }}
            />
          )}
        </pixiContainer>
      </pixiContainer>
    </Modal>
  );
};

export default MyGamesModal;
