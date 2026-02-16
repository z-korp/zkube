import { useState, useCallback, useMemo } from 'react';
import { Graphics as PixiGraphics, TextStyle } from 'pixi.js';
import { Modal } from '../ui';
import { PixiButton } from '../../ui/PixiButton';
import { FONT_BODY } from '../../utils/colors';

interface MenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSurrender: () => Promise<void>;
  onGoHome: () => void;
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
  onGoHome,
  screenWidth,
  screenHeight,
  currentLevel,
  cubesEarned,
}: MenuModalProps) => {
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
    fontFamily: FONT_BODY,
    fontSize: 13,
    fill: labelColor,
  }), [labelColor]);

  const valueStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: 15,
    fontWeight: 'bold',
    fill: valueColor,
  }), [valueColor]);

  const cubeStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
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
    g.fill({ color: 0x1e293b, alpha: 0.8 });
    g.stroke({ color: 0x334155, width: 1, alpha: 0.3 });
  }, [buttonWidth]);

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
      contentHeight={showConfirm ? 220 : 210}
      screenWidth={screenWidth}
      screenHeight={screenHeight}
      showCloseButton={!isSurrendering}
      closeOnBackdrop={!isSurrendering}
      closeOnEscape={!isSurrendering}
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
            <PixiButton
              label={isSurrendering ? "SURRENDERING..." : "YES, SURRENDER"}
              y={80}
              width={buttonWidth}
              height={buttonHeight}
              variant="red"
              disabled={isSurrendering}
              onPress={handleConfirmSurrender}
            />

            {/* Cancel button */}
            <PixiButton
              label="CANCEL"
              y={80 + buttonHeight + buttonSpacing}
              width={buttonWidth}
              height={buttonHeight}
              variant="purple"
              disabled={isSurrendering}
              onPress={handleCancelConfirm}
            />
          </>
        ) : (
          // Main menu view
          <>
            <PixiButton
              label="RESUME GAME"
              y={8}
              width={buttonWidth}
              height={buttonHeight}
              variant="purple"
              onPress={handleClose}
            />

            <PixiButton
              label="GO HOME"
              y={8 + buttonHeight + buttonSpacing}
              width={buttonWidth}
              height={buttonHeight}
              variant="purple"
              onPress={onGoHome}
            />

            <PixiButton
              label="SURRENDER"
              y={8 + (buttonHeight + buttonSpacing) * 2}
              width={buttonWidth}
              height={buttonHeight}
              variant="red"
              onPress={handleSurrenderClick}
            />
          </>
        )}
      </pixiContainer>
    </Modal>
  );
};

export default MenuModal;
