import { Application } from '@pixi/react';
import { forwardRef, useImperativeHandle, useCallback, useMemo } from 'react';
import type { Block } from '@/types/types';
import type { GameStageRef } from '../../types';
import { useFullscreenLayout } from '../../hooks/useFullscreenLayout';
import { PixiThemeProvider, usePixiTheme } from '../../themes/ThemeContext';
import { ThemeBackground } from '../background/ThemeBackground';
import { TopBar } from '../topbar';
import { GameGrid } from '../GameGrid';
import { GridBackground } from '../GridBackground';
import { ParticleSystem, useParticles } from '../effects/ParticleSystem';
import { ScorePopup, useScorePopup } from '../effects/ScorePopup';
import { ScreenShakeContainer, useScreenShake } from '../effects/ScreenShake';
import type { ConstraintData } from '../hud';
import { ActionBar } from '../actionbar';
import { NextLinePreview } from './NextLinePreview';
import { LevelDisplay } from './LevelDisplay';
import { ScorePanel } from './ScorePanel';
import { MovesPanel } from './MovesPanel';
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

interface FullscreenGameProps {
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
  
  // Player info
  cubeBalance?: number;
  
  // State
  isTxProcessing: boolean;
  isPlayerInDanger: boolean;
  
  // Callbacks
  onMove: (rowIndex: number, startX: number, finalX: number) => void;
  onBonusApply: (block: Block) => void;
  
  // Navigation callbacks (trigger React dialogs)
  onMenuClick?: () => void;
  onQuestsClick?: () => void;
  onTrophyClick?: () => void;
  onShopClick?: () => void;
  onSurrenderClick?: () => void;
}

/**
 * Inner fullscreen game component that uses theme context
 */
const FullscreenGameInner = forwardRef<GameStageRef, FullscreenGameProps>(({
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
  cubeBalance = 0,
  isTxProcessing,
  isPlayerInDanger,
  onMove,
  onBonusApply,
  onMenuClick,
  onQuestsClick,
  onTrophyClick,
  onShopClick,
  onSurrenderClick,
}, ref) => {
  const { colors } = usePixiTheme();
  const layout = useFullscreenLayout();
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
      className={`fixed inset-0 ${isTxProcessing ? 'cursor-wait' : 'cursor-move'}`}
      style={{ 
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <Application
        width={layout.screenWidth}
        height={layout.screenHeight}
        backgroundAlpha={0}
        resolution={layout.devicePixelRatio}
        autoDensity={true}
        antialias={true}
      >
        {/* Background layer */}
        <ThemeBackground layout={layout} />
        
        {/* Top bar with navigation */}
        <TopBar
          layout={layout}
          cubeBalance={cubeBalance}
          onMenuClick={onMenuClick}
          onQuestsClick={onQuestsClick}
          onTrophyClick={onTrophyClick}
          onShopClick={onShopClick}
        />
        
        {/* Level display (centered above grid) */}
        <LevelDisplay
          level={level}
          stars={stars}
          constraint1={constraint1}
          constraint2={constraint2}
          x={0}
          y={layout.levelDisplayY}
          width={layout.screenWidth}
          height={layout.levelDisplayHeight}
          uiScale={layout.uiScale}
        />

        {/* Side panels (desktop only) */}
        {layout.showSidePanels && (
          <>
            {/* Left panel - Score */}
            <ScorePanel
              score={levelScore}
              targetScore={targetScore}
              x={layout.leftPanelX}
              y={layout.sidePanelY}
              width={layout.sidePanelWidth}
              height={layout.sidePanelHeight}
              uiScale={layout.uiScale}
            />
            
            {/* Right panel - Moves & Combo */}
            <MovesPanel
              moves={moves}
              maxMoves={maxMoves ?? 30}
              combo={combo}
              maxCombo={maxCombo}
              x={layout.rightPanelX}
              y={layout.sidePanelY}
              width={layout.sidePanelWidth}
              height={layout.sidePanelHeight}
              uiScale={layout.uiScale}
              isInDanger={isPlayerInDanger}
            />
          </>
        )}

        {/* Main game area with screen shake */}
        <ScreenShakeContainer offset={offset}>
          {/* Grid container at calculated position */}
          <pixiContainer x={layout.gridX} y={layout.gridY}>
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
          <pixiContainer x={layout.gridX}>
            <NextLinePreview
              blocks={nextLine}
              cellSize={layout.cellSize}
              gridCols={layout.gridCols}
              y={layout.nextLineY}
              isConsumed={nextLineConsumed}
            />
          </pixiContainer>
        </ScreenShakeContainer>

        {/* Action Bar at bottom */}
        <ActionBar
          bonusSlots={actionBarSlots}
          selectedBonus={selectedBonus}
          combo={combo}
          maxCombo={maxCombo}
          stars={stars}
          width={layout.screenWidth}
          height={layout.actionBarHeight}
          y={layout.actionBarY}
          isDisabled={isTxProcessing}
          onSurrender={onSurrenderClick}
          showSurrender={!!onSurrenderClick}
        />
        
        {/* Particle system layer (above blocks) */}
        <pixiContainer x={layout.gridX} y={layout.gridY}>
          <ParticleSystem gridSize={layout.cellSize} />
        </pixiContainer>
        
        {/* Score popups (topmost) */}
        <pixiContainer x={layout.gridX} y={layout.gridY}>
          <ScorePopup
            gridWidth={layout.gridCols}
            gridHeight={layout.gridRows}
            gridSize={layout.cellSize}
          />
        </pixiContainer>
      </Application>

      {/* Danger border overlay */}
      {isPlayerInDanger && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 40px rgba(239, 68, 68, 0.4)',
          }}
        />
      )}
    </div>
  );
});

FullscreenGameInner.displayName = 'FullscreenGameInner';

/**
 * Fullscreen game canvas - Candy Crush style
 * 
 * Covers the entire viewport with a single PixiJS canvas.
 * Includes:
 * - Themed background (covers whole screen)
 * - Top bar with menu/quests/trophy/shop buttons
 * - Level display with stars and constraints (centered above grid)
 * - Side panels with score/moves (desktop only)
 * - Centered game grid with blocks
 * - Next line preview
 * - Action bar with bonuses
 * - All visual effects (particles, shake, popups)
 */
export const FullscreenGame = forwardRef<GameStageRef, FullscreenGameProps>((props, ref) => {
  return (
    <PixiThemeProvider>
      <FullscreenGameInner ref={ref} {...props} />
    </PixiThemeProvider>
  );
});

FullscreenGame.displayName = 'FullscreenGame';

export default FullscreenGame;
