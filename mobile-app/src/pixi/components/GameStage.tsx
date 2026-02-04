import { Application } from '@pixi/react';
import { useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { GameGrid } from './GameGrid';
import { GridBackground } from './GridBackground';
import { ParticleSystem, useParticles } from './effects/ParticleSystem';
import { ScorePopup, useScorePopup } from './effects/ScorePopup';
import { ScreenShakeContainer, useScreenShake } from './effects/ScreenShake';
import type { Block } from '@/types/types';
import { BonusType } from '@/dojo/game/types/bonus';
import type { GameStageRef } from '../types';
import { PixiThemeProvider, usePixiTheme } from '../themes/ThemeContext';

interface GameStageProps {
  blocks: Block[];
  nextLine: Block[];
  gridSize: number;
  gridWidth: number;
  gridHeight: number;
  onMove: (rowIndex: number, startX: number, finalX: number) => void;
  onBonusApply: (block: Block) => void;
  bonus: BonusType;
  isTxProcessing: boolean;
  isPlayerInDanger: boolean;
}

// Inner component that uses theme context
const GameStageInner = forwardRef<GameStageRef, GameStageProps>(({
  blocks,
  gridSize,
  gridWidth,
  gridHeight,
  onMove,
  onBonusApply,
  bonus,
  isTxProcessing,
  isPlayerInDanger,
}, ref) => {
  const { colors } = usePixiTheme();
  const { offset, shake, lineClear, combo, bigCombo } = useScreenShake();

  // Expose methods to parent
  const triggerExplosion = useCallback((x: number, y: number) => {
    // Get particle system and emit
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
      particles.emitLine(y * gridSize, gridWidth * gridSize, 50 * lineCount);
    }
    
    if (scorePopup && lineCount > 1) {
      scorePopup.showCombo(lineCount, y);
    }
    
    // Shake based on combo size
    if (lineCount >= 4) {
      bigCombo();
    } else if (lineCount >= 2) {
      combo();
    } else {
      lineClear();
    }
  }, [gridSize, gridWidth, lineClear, combo, bigCombo]);

  useImperativeHandle(ref, () => ({
    triggerExplosion,
    triggerLineExplosion,
  }), [triggerExplosion, triggerLineExplosion]);

  const stageWidth = gridWidth * gridSize;
  const stageHeight = gridHeight * gridSize;

  return (
    <div 
      className={`relative ${isTxProcessing ? 'cursor-wait' : 'cursor-move'}`}
      style={{ 
        width: stageWidth + 4,
        height: stageHeight + 4,
      }}
    >
      <Application
        width={stageWidth}
        height={stageHeight}
        background={colors.background}
        resolution={window.devicePixelRatio || 1}
        autoDensity={true}
        antialias={true}
      >
        <ScreenShakeContainer offset={offset}>
          {/* Grid background with lines */}
          <GridBackground
            gridSize={gridSize}
            gridWidth={gridWidth}
            gridHeight={gridHeight}
            isPlayerInDanger={isPlayerInDanger}
          />

          {/* Game grid with blocks */}
          <GameGrid
            blocks={blocks}
            gridSize={gridSize}
            gridWidth={gridWidth}
            gridHeight={gridHeight}
            onMove={onMove}
            onBonusApply={onBonusApply}
            bonus={bonus}
            isTxProcessing={isTxProcessing}
            onExplosion={triggerExplosion}
          />
        </ScreenShakeContainer>
        
        {/* Particle system layer (above blocks) */}
        <ParticleSystem gridSize={gridSize} />
        
        {/* Score popups (topmost) */}
        <ScorePopup
          gridWidth={gridWidth}
          gridHeight={gridHeight}
          gridSize={gridSize}
        />
      </Application>

      {/* Border overlay */}
      <div 
        className={`absolute inset-0 pointer-events-none rounded ${
          isTxProcessing ? 'border-2 border-blue-400 animate-pulse' : 'border-2 border-slate-800'
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

GameStageInner.displayName = 'GameStageInner';

// Wrapper that provides theme context
export const GameStage = forwardRef<GameStageRef, GameStageProps>((props, ref) => {
  return (
    <PixiThemeProvider>
      <GameStageInner ref={ref} {...props} />
    </PixiThemeProvider>
  );
});

GameStage.displayName = 'GameStage';

export default GameStage;
