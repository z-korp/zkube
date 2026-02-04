import { Application } from '@pixi/react';
import { useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { GameGrid } from './GameGrid';
import { GridBackground } from './GridBackground';
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
  const explosionRef = useRef<{ trigger: (x: number, y: number) => void } | null>(null);

  const triggerExplosion = useCallback((x: number, y: number) => {
    explosionRef.current?.trigger(x, y);
  }, []);

  useImperativeHandle(ref, () => ({
    triggerExplosion,
  }), [triggerExplosion]);

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
