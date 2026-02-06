/**
 * MyGamesModal - PixiJS modal showing In Progress / Finished tabs
 * Each game card shows: #id, name, level, score, cubes, Resume button
 * Supports scrolling for overflow
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { Graphics as PixiGraphics } from 'pixi.js';
import { Modal, Button } from '../ui';

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
        onPointerDown={(e: any) => {
          e.stopPropagation();
          onClick();
        }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      />
      <pixiText text={label} x={width / 2} y={height / 2} anchor={0.5}
        style={{
          fontFamily: FONT,
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

  const resumeBtnW = 80;
  const resumeBtnH = 32;

  return (
    <pixiContainer y={y} eventMode="static">
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
        x={pad + 40} y={10}
        style={{ fontFamily: FONT, fontSize: 14, fontWeight: 'bold', fill: 0xFFFFFF }}
      />

      {/* Stats row */}
      <pixiText text="LEVEL" x={pad} y={36}
        style={{ fontFamily: 'Arial, sans-serif', fontSize: 10, fill: 0x64748B }} />
      <pixiText text={String(game.level)} x={pad} y={50}
        style={{ fontFamily: FONT, fontSize: 16, fontWeight: 'bold', fill: 0xFFFFFF }} />

      <pixiText text="SCORE" x={pad + 70} y={36}
        style={{ fontFamily: 'Arial, sans-serif', fontSize: 10, fill: 0x64748B }} />
      <pixiText text={String(game.totalScore)} x={pad + 70} y={50}
        style={{ fontFamily: FONT, fontSize: 16, fontWeight: 'bold', fill: 0xFFFFFF }} />

      <pixiText text="CUBES" x={pad + 145} y={36}
        style={{ fontFamily: 'Arial, sans-serif', fontSize: 10, fill: 0x64748B }} />
      <pixiText text={String(game.cubesAvailable)} x={pad + 145} y={50}
        style={{ fontFamily: FONT, fontSize: 16, fontWeight: 'bold', fill: 0xFBBF24 }} />

      {/* Resume / Finished button */}
      {!game.gameOver ? (
        <Button
          text="Resume"
          x={width - resumeBtnW - pad}
          y={(cardH - resumeBtnH) / 2}
          width={resumeBtnW}
          height={resumeBtnH}
          variant="primary"
          fontSize={13}
          onClick={() => onResume(game.tokenId)}
        />
      ) : (
        <pixiText text="Finished"
          x={width - pad} y={cardH / 2}
          anchor={{ x: 1, y: 0.5 }}
          style={{ fontFamily: FONT, fontSize: 12, fill: 0x64748B }}
        />
      )}
    </pixiContainer>
  );
};

// ============================================================================
// SCROLLABLE CONTAINER
// ============================================================================

const ScrollableGamesList = ({
  games,
  width,
  maxHeight,
  onResumeGame,
  loading,
  emptyText,
}: {
  games: PlayerGame[];
  width: number;
  maxHeight: number;
  onResumeGame: (tokenId: number) => void;
  loading: boolean;
  emptyText: string;
}) => {
  const [scrollY, setScrollY] = useState(0);
  const isDragging = useRef(false);
  const lastY = useRef(0);

  const cardH = 80;
  const cardGap = 10;
  const totalHeight = games.length * (cardH + cardGap);
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

  // Draw mask for scrollable area
  const drawMask = useCallback((g: PixiGraphics) => {
    g.clear();
    g.rect(0, 0, width, maxHeight);
    g.fill({ color: 0xffffff });
  }, [width, maxHeight]);

  // Draw scroll track
  const drawScrollTrack = useCallback((g: PixiGraphics) => {
    if (totalHeight <= maxHeight) return;
    g.clear();
    const trackH = maxHeight - 20;
    const thumbH = Math.max(30, (maxHeight / totalHeight) * trackH);
    const thumbY = maxScroll > 0 ? (scrollY / maxScroll) * (trackH - thumbH) : 0;
    
    // Track
    g.roundRect(width - 6, 10, 4, trackH, 2);
    g.fill({ color: 0x334155, alpha: 0.3 });
    
    // Thumb
    g.roundRect(width - 6, 10 + thumbY, 4, thumbH, 2);
    g.fill({ color: 0x64748B, alpha: 0.8 });
  }, [width, maxHeight, totalHeight, scrollY, maxScroll]);

  if (loading) {
    return (
      <pixiText text="Loading games..."
        x={width / 2} y={40} anchor={{ x: 0.5, y: 0.5 }}
        style={{ fontFamily: FONT, fontSize: 14, fill: 0x94A3B8 }}
      />
    );
  }

  if (games.length === 0) {
    return (
      <pixiText text={emptyText}
        x={width / 2} y={40} anchor={{ x: 0.5, y: 0.5 }}
        style={{ fontFamily: FONT, fontSize: 14, fill: 0x64748B }}
      />
    );
  }

  return (
    <pixiContainer>
      {/* Scrollable area with mask */}
      <pixiContainer
        eventMode="static"
        onPointerDown={handlePointerDown}
        onGlobalPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerUpOutside={handlePointerUp}
      >
        <pixiGraphics draw={drawMask} alpha={0.001} />
        
        {/* Content container - shifted by scrollY */}
        <pixiContainer y={-scrollY}>
          {games.map((game, i) => (
            <GameCard
              key={game.tokenId}
              game={game}
              y={i * (cardH + cardGap)}
              width={width - 12}
              onResume={onResumeGame}
            />
          ))}
        </pixiContainer>
      </pixiContainer>

      {/* Scroll indicator */}
      <pixiGraphics draw={drawScrollTrack} />
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

  const modalW = Math.min(400, screenWidth - 40);
  const contentW = modalW - 48;
  const tabW = (contentW - 8) / 2;
  const tabH = 36;
  const listMaxH = 300; // Max height for scrollable list

  const activeGames = useMemo(() => games.filter(g => !g.gameOver), [games]);
  const finishedGames = useMemo(() => games.filter(g => g.gameOver), [games]);
  const displayGames = activeTab === 'progress' ? activeGames : finishedGames;

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

        {/* Scrollable game cards */}
        <pixiContainer y={tabH + 16}>
          <ScrollableGamesList
            games={displayGames}
            width={contentW}
            maxHeight={listMaxH}
            onResumeGame={onResumeGame}
            loading={loading}
            emptyText={activeTab === 'progress' ? "No active games" : "No finished games"}
          />
        </pixiContainer>

        {/* Close button at bottom */}
        <Button
          text="Close"
          x={0}
          y={tabH + 16 + listMaxH + 20}
          width={contentW}
          height={44}
          variant="secondary"
          fontSize={16}
          onClick={onClose}
        />
      </pixiContainer>
    </Modal>
  );
};

export default MyGamesModal;
