import { useState, useCallback, useMemo } from 'react';
import { Graphics as PixiGraphics, TextStyle } from 'pixi.js';
import { Modal, Button } from '../ui';
import { usePixiTheme } from '../../themes/ThemeContext';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSurrender: () => Promise<void>;
  screenWidth: number;
  screenHeight: number;
  currentLevel: number;
  cubesEarned: number;
}

/**
 * In-game menu modal with Resume and Surrender options
 * Includes two-step surrender confirmation
 */
export const MenuModal = ({
  isOpen,
  onClose,
  onSurrender,
  screenWidth,
  screenHeight,
  currentLevel,
  cubesEarned,
}: MenuModalProps) => {
  const { colors, isProcedural } = usePixiTheme();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSurrendering, setIsSurrendering] = useState(false);

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    setShowConfirm(false);
    setIsSurrendering(false);
    onClose();
  }, [onClose]);

  const handleSurrenderClick = useCallback(() => {
    setShowConfirm(true);
  }, []);

  const handleConfirmSurrender = useCallback(async () => {
    setIsSurrendering(true);
    try {
      await onSurrender();
      handleClose();
    } catch (error) {
      console.error('Surrender failed:', error);
      setIsSurrendering(false);
    }
  }, [onSurrender, handleClose]);

  const handleCancelConfirm = useCallback(() => {
    setShowConfirm(false);
  }, []);

  const modalWidth = 340;
  const buttonWidth = modalWidth - 48;
  const buttonHeight = 48;
  const buttonSpacing = 12;

  const labelColor = 0x94a3b8;
  const valueColor = 0xffffff;
  const cubeColor = 0xfbbf24;

  const labelStyle = useMemo(() => new TextStyle({
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: 13,
    fill: labelColor,
  }), [labelColor]);

  const valueStyle = useMemo(() => new TextStyle({
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: 15,
    fontWeight: 'bold',
    fill: valueColor,
  }), [valueColor]);

  const cubeStyle = useMemo(() => new TextStyle({
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: 15,
    fontWeight: 'bold',
    fill: cubeColor,
  }), [cubeColor]);

  // Draw info box for surrender confirmation
  const drawInfoBox = useCallback((g: PixiGraphics) => {
    g.clear();
    const boxWidth = buttonWidth;
    const boxHeight = 60;
    const radius = 8;
    
    g.roundRect(0, 0, boxWidth, boxHeight, radius);
    g.fill({ color: isProcedural ? 0x1a1a2e : 0x1e293b, alpha: 0.8 });
    g.stroke({ color: isProcedural ? colors.accent : 0x334155, width: 1, alpha: 0.3 });
  }, [buttonWidth, isProcedural, colors.accent]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={showConfirm ? "Confirm Surrender" : "Menu"}
      subtitle={showConfirm 
        ? "Are you sure? You'll keep cubes earned so far." 
        : "Game paused"
      }
      width={modalWidth}
      screenWidth={screenWidth}
      screenHeight={screenHeight}
      showCloseButton={!isSurrendering}
    >
      <pixiContainer x={24} y={0}>
        {showConfirm ? (
          // Surrender confirmation view
          <>
            {/* Info box with level and cubes */}
            <pixiContainer y={8}>
              <pixiGraphics draw={drawInfoBox} />
              
              {/* Level info */}
              <pixiText
                text="Current Level:"
                x={16}
                y={12}
                style={labelStyle}
              />
              <pixiText
                text={String(currentLevel)}
                x={buttonWidth - 16}
                y={12}
                anchor={{ x: 1, y: 0 }}
                style={valueStyle}
              />
              
              {/* Cubes info */}
              <pixiText
                text="Cubes Earned:"
                x={16}
                y={34}
                style={labelStyle}
              />
              <pixiText
                text={String(cubesEarned)}
                x={buttonWidth - 16}
                y={34}
                anchor={{ x: 1, y: 0 }}
                style={cubeStyle}
              />
            </pixiContainer>

            {/* Confirm button */}
            <Button
              text={isSurrendering ? "Surrendering..." : "Yes, Surrender"}
              y={80}
              width={buttonWidth}
              height={buttonHeight}
              variant="danger"
              disabled={isSurrendering}
              onClick={handleConfirmSurrender}
            />

            {/* Cancel button */}
            <Button
              text="Cancel"
              y={80 + buttonHeight + buttonSpacing}
              width={buttonWidth}
              height={buttonHeight}
              variant="secondary"
              disabled={isSurrendering}
              onClick={handleCancelConfirm}
            />
          </>
        ) : (
          // Main menu view
          <>
            {/* Resume button */}
            <Button
              text="Resume Game"
              y={8}
              width={buttonWidth}
              height={buttonHeight}
              variant="secondary"
              onClick={handleClose}
            />

            {/* Surrender button */}
            <Button
              text="Surrender"
              y={8 + buttonHeight + buttonSpacing}
              width={buttonWidth}
              height={buttonHeight}
              variant="danger"
              onClick={handleSurrenderClick}
            />
          </>
        )}
      </pixiContainer>
    </Modal>
  );
};

export default MenuModal;
