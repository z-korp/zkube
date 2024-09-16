import React, { useState, useEffect } from 'react';
import { Game } from '@/dojo/game/models/game';
import { Block } from '@/dojo/game/models/TutorialGrid';
import { CubeSlidingTutorial } from '@/dojo/game/models/CubeSlidingTutorial';

interface TutorialComponentProps {
  tutorial: CubeSlidingTutorial;
  onEndTutorial: () => void;
}

export const TutorialComponent: React.FC<TutorialComponentProps> = ({ tutorial, onEndTutorial }) => {
  const [gridState, setGridState] = useState<Block[][]>([]);
  const [instruction, setInstruction] = useState<string>('');

  useEffect(() => {
    if (tutorial) {
      setGridState(tutorial.getGridState());
      setInstruction(tutorial.getCurrentInstruction());
    }
  }, [tutorial]);

  const handleCubeClick = (row: number, col: number) => {
    // Implement cube selection logic
  };

  const handleCubeMove = (fromRow: number, fromCol: number, toRow: number, toCol: number) => {
    if (tutorial) {
      const moved = tutorial.handleCubeSlide(fromRow, fromCol, toRow, toCol);
      if (moved) {
        setGridState(tutorial.getGridState());
        setInstruction(tutorial.getCurrentInstruction());
        
        if (tutorial.isTutorialComplete()) {
        onEndTutorial();
          // Handle tutorial completion (e.g., show a completion message, return to main game)
        }
      }
    }
  };

  return (
    <div className="tutorial">
      <div className="instruction">{instruction}</div>
      <div className="grid">
        {gridState.map((row, rowIndex) => (
          <div key={rowIndex} className="row">
            {row.map((block, colIndex) => (
              <div
                key={colIndex}
                className={`block ${block.value ? 'filled' : 'empty'}`}
                style={{ backgroundColor: `color-${block.color}` }}
                onClick={() => handleCubeClick(rowIndex, colIndex)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};