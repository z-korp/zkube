import { useCallback, useMemo, useEffect } from 'react';
import { Graphics as PixiGraphics, TextStyle } from 'pixi.js';
import { usePixiTheme } from '../../themes/ThemeContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  width?: number;
  screenWidth: number;
  screenHeight: number;
  children?: React.ReactNode;
  showCloseButton?: boolean;
}

/**
 * Base modal component for PixiJS
 * Renders a centered modal with backdrop, title, and content area
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  width = 360,
  screenWidth,
  screenHeight,
  children,
  showCloseButton = true,
}: ModalProps) => {
  const { colors, isProcedural } = usePixiTheme();

  // Handle escape key to close
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const padding = 24;
  const titleHeight = 32;
  const subtitleHeight = subtitle ? 20 : 0;
  const headerHeight = titleHeight + subtitleHeight + padding;
  const contentHeight = 200; // Will be overridden by children
  const modalHeight = headerHeight + contentHeight + padding;
  const cornerRadius = 16;

  const modalX = (screenWidth - width) / 2;
  const modalY = (screenHeight - modalHeight) / 2;

  const bgColor = isProcedural ? 0x0f0f1a : 0x0f172a;
  const borderColor = isProcedural ? colors.accent : 0x334155;
  const titleColor = 0xffffff;
  const subtitleColor = 0x94a3b8;

  // Draw backdrop (semi-transparent overlay)
  const drawBackdrop = useCallback((g: PixiGraphics) => {
    g.clear();
    g.rect(0, 0, screenWidth, screenHeight);
    g.fill({ color: 0x000000, alpha: 0.7 });
  }, [screenWidth, screenHeight]);

  // Draw modal background
  const drawModalBg = useCallback((g: PixiGraphics) => {
    g.clear();
    
    // Shadow
    g.roundRect(4, 4, width, modalHeight, cornerRadius);
    g.fill({ color: 0x000000, alpha: 0.3 });
    
    // Main background
    g.roundRect(0, 0, width, modalHeight, cornerRadius);
    g.fill({ color: bgColor, alpha: 0.98 });
    
    // Border
    g.roundRect(0, 0, width, modalHeight, cornerRadius);
    g.stroke({ color: borderColor, width: 1.5, alpha: 0.6 });
    
    // Header separator line
    g.moveTo(padding, headerHeight - 8);
    g.lineTo(width - padding, headerHeight - 8);
    g.stroke({ color: borderColor, width: 1, alpha: 0.3 });
  }, [width, modalHeight, cornerRadius, bgColor, borderColor, padding, headerHeight]);

  // Draw close button (X)
  const drawCloseButton = useCallback((g: PixiGraphics) => {
    g.clear();
    const size = 24;
    const padding = 6;
    
    // Background circle on hover handled by container
    g.circle(size / 2, size / 2, size / 2);
    g.fill({ color: 0x000000, alpha: 0.001 }); // Nearly invisible hit area
    
    // X icon
    g.moveTo(padding, padding);
    g.lineTo(size - padding, size - padding);
    g.moveTo(size - padding, padding);
    g.lineTo(padding, size - padding);
    g.stroke({ color: 0x94a3b8, width: 2 });
  }, []);

  const titleStyle = useMemo(() => new TextStyle({
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: 22,
    fontWeight: 'bold',
    fill: titleColor,
  }), [titleColor]);

  const subtitleStyle = useMemo(() => new TextStyle({
    fontFamily: 'Arial, Helvetica, sans-serif',
    fontSize: 13,
    fill: subtitleColor,
  }), [subtitleColor]);

  return (
    <>
      {/* Backdrop */}
      <pixiGraphics
        draw={drawBackdrop}
        eventMode="static"
        onpointerdown={onClose}
      />

      {/* Modal container */}
      <pixiContainer x={modalX} y={modalY}>
        {/* Modal background */}
        <pixiGraphics 
          draw={drawModalBg}
          eventMode="static"
          onpointerdown={(e: any) => e.stopPropagation()}
        />

        {/* Title */}
        <pixiText
          text={title}
          x={width / 2}
          y={padding}
          anchor={{ x: 0.5, y: 0 }}
          style={titleStyle}
        />

        {/* Subtitle */}
        {subtitle && (
          <pixiText
            text={subtitle}
            x={width / 2}
            y={padding + titleHeight}
            anchor={{ x: 0.5, y: 0 }}
            style={subtitleStyle}
          />
        )}

        {/* Close button */}
        {showCloseButton && (
          <pixiContainer 
            x={width - 40} 
            y={12}
            eventMode="static"
            cursor="pointer"
            onpointerdown={onClose}
          >
            <pixiGraphics draw={drawCloseButton} />
          </pixiContainer>
        )}

        {/* Content area */}
        <pixiContainer x={0} y={headerHeight}>
          {children}
        </pixiContainer>
      </pixiContainer>
    </>
  );
};

export default Modal;
