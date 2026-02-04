import { Application } from '@pixi/react';
import { forwardRef, useImperativeHandle, useCallback, useMemo } from 'react';
import type { Block } from '@/types/types';
import type { GameStageRef } from '../../types';
import type { GameLayout } from '../../hooks/useGameLayout';
import { PixiThemeProvider, usePixiTheme } from '../../themes/ThemeContext';
import { GameGrid } from '../GameGrid';
import { GridBackground } from '../GridBackground';
import { ParticleSystem, useParticles } from '../effects/ParticleSystem';
import { ScorePopup, useScorePopup } from '../effects/ScorePopup';
import { ScreenShakeContainer, useScreenShake } from '../effects/ScreenShake';
import { HUDBar } from '../hud';
import type { ConstraintData } from '../hud';
import { ActionBar } from '../actionbar';
import { NextLinePreview } from './NextLinePreview';
import { BonusType } from '@/dojo/game/types/bonus';

export interface BonusSlotData {
  type: number;
  bonusType: BonusType;
  level: number;
  count: number;
  icon: string;
  tooltip?: string;
  onClick: () => void;
}

interface GameCanvasProps {
  // Layout
  layout: GameLayout;
  
  // Grid data
  blocks: Block[];
  nextLine: Block[];
  nextLineConsumed: boolean;
  
  // Level info
  level: number;
  levelScore: number;
  targetScore: number;
  moves: number;
  maxMoves?: number;
  
  // Constraints
  constraint1?: ConstraintData;
  constraint2?: ConstraintData;
  
  // Combo and stars
  combo: number;
  maxCombo: number;
  stars: number;
  
  // Bonus system
  bonusSlots: BonusSlotData[];
  selectedBonus: BonusType;
  
  // State
  isTxProcessing: boolean;
  isPlayerInDanger: boolean;
  
  // Callbacks
  onMove: (rowIndex: number, startX: number, finalX: number) => void;
  onBonusApply: (block: Block) => void;
}

/**
 * Inner canvas component that uses theme context
 */
const GameCanvasInner = forwardRef<GameStageRef, GameCanvasProps>(({
  layout,
  blocks,
  nextLine,
  nextLineConsumed,
  level,
  levelScore,
  targetScore,
  moves,
  maxMoves,
  constraint1,
  constraint2,
  combo,
  maxCombo,
  stars,
  bonusSlots,
  selectedBonus,
  isTxProcessing,
  isPlayerInDanger,
  onMove,
  onBonusApply,
}, ref) => {
  const { colors } = usePixiTheme();
  const { offset, shake, lineClear, combo: comboShake, bigCombo } = useScreenShake();

  // Expose methods to parent for triggering effects
  const triggerExplosion = useCallback((x: number, y: number) => {
    const particles = useParticles();
    if (particles) {
      particles.emit(x, y, 30);
    }
    lineClear();
  }, [lineClear]);

  const triggerLineExplosion = useCallback((y: number, lineCount: number) => {
    const particles = useParticles();
    const scorePopup = useScorePopup();
    
    if (particles) {
      particles.emitLine(y * layout.cellSize, layout.gridWidth, 50 * lineCount);
    }
    
    if (scorePopup && lineCount > 1) {
      scorePopup.showCombo(lineCount, y);
    }
    
    // Shake based on combo size
    if (lineCount >= 4) {
      bigCombo();
    } else if (lineCount >= 2) {
      comboShake();
    } else {
      lineClear();
    }
  }, [layout.cellSize, layout.gridWidth, lineClear, comboShake, bigCombo]);

  useImperativeHandle(ref, () => ({
    triggerExplosion,
    triggerLineExplosion,
  }), [triggerExplosion, triggerLineExplosion]);

  // Convert bonus slots to ActionBar format
  const actionBarSlots = useMemo(() => 
    bonusSlots.map(slot => ({
      ...slot,
      onClick: slot.onClick,
    })),
    [bonusSlots]
  );

  return (
    <div 
      className={`relative ${isTxProcessing ? 'cursor-wait' : 'cursor-move'}`}
      style={{ 
        width: layout.canvasWidth,
        height: layout.canvasHeight,
      }}
    >
      <Application
        width={layout.canvasWidth}
        height={layout.canvasHeight}
        backgroundAlpha={0}
        resolution={layout.devicePixelRatio}
        autoDensity={true}
        antialias={true}
      >
        {/* HUD Bar at top */}
        <HUDBar
          level={level}
          levelScore={levelScore}
          targetScore={targetScore}
          moves={moves}
          maxMoves={maxMoves}
          constraint1={constraint1}
          constraint2={constraint2}
          width={layout.canvasWidth}
          height={layout.hudHeight}
          y={layout.hudY}
          isInDanger={isPlayerInDanger}
        />

        {/* Main game area with screen shake */}
        <ScreenShakeContainer offset={offset}>
          {/* Grid container at calculated position */}
          <pixiContainer y={layout.gridY}>
            {/* Grid background with lines */}
            <GridBackground
              gridSize={layout.cellSize}
              gridWidth={layout.gridCols}
              gridHeight={layout.gridRows}
              isPlayerInDanger={isPlayerInDanger}
            />

            {/* Game grid with blocks */}
            <GameGrid
              blocks={blocks}
              gridSize={layout.cellSize}
              gridWidth={layout.gridCols}
              gridHeight={layout.gridRows}
              onMove={onMove}
              onBonusApply={onBonusApply}
              bonus={selectedBonus}
              isTxProcessing={isTxProcessing}
              onExplosion={triggerExplosion}
            />
          </pixiContainer>

          {/* Next line preview */}
          <NextLinePreview
            blocks={nextLine}
            cellSize={layout.cellSize}
            gridCols={layout.gridCols}
            y={layout.nextLineY}
            isConsumed={nextLineConsumed}
          />
        </ScreenShakeContainer>

        {/* Action Bar at bottom */}
        <ActionBar
          bonusSlots={actionBarSlots}
          selectedBonus={selectedBonus}
          combo={combo}
          maxCombo={maxCombo}
          stars={stars}
          width={layout.canvasWidth}
          height={layout.actionBarHeight}
          y={layout.actionBarY}
          isDisabled={isTxProcessing}
        />
        
        {/* Particle system layer (above blocks) */}
        <pixiContainer y={layout.gridY}>
          <ParticleSystem gridSize={layout.cellSize} />
        </pixiContainer>
        
        {/* Score popups (topmost) */}
        <pixiContainer y={layout.gridY}>
          <ScorePopup
            gridWidth={layout.gridCols}
            gridHeight={layout.gridRows}
            gridSize={layout.cellSize}
          />
        </pixiContainer>
      </Application>

      {/* Border overlay */}
      <div 
        className={`absolute inset-0 pointer-events-none rounded-lg ${
          isTxProcessing ? 'border-2 border-blue-400 animate-pulse' : 'border border-slate-700'
        }`}
        style={{
          boxShadow: isPlayerInDanger 
            ? 'inset 0 0 20px rgba(239, 68, 68, 0.5)' 
            : undefined
        }}
      />
    </div>
  );
});

GameCanvasInner.displayName = 'GameCanvasInner';

/**
 * Main game canvas component with unified PixiJS rendering
 * 
 * Includes:
 * - HUD bar (level, progress, moves)
 * - Game grid with blocks
 * - Next line preview
 * - Action bar (bonuses, combo, stars)
 * - All visual effects (particles, shake, popups)
 */
export const GameCanvas = forwardRef<GameStageRef, GameCanvasProps>((props, ref) => {
  return (
    <PixiThemeProvider>
      <GameCanvasInner ref={ref} {...props} />
    </PixiThemeProvider>
  );
});

GameCanvas.displayName = 'GameCanvas';

export default GameCanvas;
