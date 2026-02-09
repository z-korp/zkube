import { useCallback, useMemo, useEffect } from 'react';
import { Graphics as PixiGraphics, TextStyle } from 'pixi.js';
import { usePixiTheme } from '../../themes/ThemeContext';
import { FONT_TITLE, FONT_BODY } from '../../utils/colors';


interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  width?: number;
  contentHeight?: number;
  screenWidth: number;
  screenHeight: number;
  children?: React.ReactNode;
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEscape?: boolean;
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
  contentHeight = 320,
  screenWidth,
  screenHeight,
  children,
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
}: ModalProps) => {
  const { colors } = usePixiTheme();

  const padding = 24;
  const titleHeight = 32;
  const subtitleHeight = subtitle ? 20 : 0;
  const headerHeight = titleHeight + subtitleHeight + padding;
  const modalHeight = headerHeight + contentHeight + padding;
  const cornerRadius = 16;

  const modalX = (screenWidth - width) / 2;
  const modalY = Math.max(40, (screenHeight - modalHeight) / 2);

  const bgColor = 0x0f172a;
  const borderColor = 0x334155;
  const titleColor = 0xffffff;
  const subtitleColor = 0x94a3b8;

  // Handle escape key to close
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, closeOnEscape]);

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
    const size = 32;
    const pad = 8;
    
    // Background circle
    g.circle(size / 2, size / 2, size / 2);
    g.fill({ color: 0x334155, alpha: 0.5 });
    
    // X icon
    g.moveTo(pad, pad);
    g.lineTo(size - pad, size - pad);
    g.moveTo(size - pad, pad);
    g.lineTo(pad, size - pad);
    g.stroke({ color: 0xffffff, width: 2.5 });
  }, []);

  const titleStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_TITLE,
    fontSize: 24,
    fontWeight: 'bold',
    fill: titleColor,
  }), [titleColor]);

  const subtitleStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: 13,
    fill: subtitleColor,
  }), [subtitleColor]);

  // IMPORTANT: All hooks must be called before this return
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
        <pixiGraphics
          draw={drawBackdrop}
          eventMode="static"
          onPointerDown={(e: any) => {
            e.stopPropagation();
            if (closeOnBackdrop) onClose();
          }}
        />

      {/* Modal container */}
      <pixiContainer x={modalX} y={modalY}>
        {/* Modal background - blocks events from passing through */}
        <pixiGraphics 
          draw={drawModalBg}
          eventMode="static"
          onPointerDown={(e: any) => e.stopPropagation()}
        />

        {/* Title */}
        <pixiText
          text={title}
          x={width / 2}
          y={padding}
          anchor={{ x: 0.5, y: 0 }}
          style={titleStyle}
          eventMode="none"
        />

        {subtitle && (
          <pixiText
            text={subtitle}
            x={width / 2}
            y={padding + titleHeight}
            anchor={{ x: 0.5, y: 0 }}
            style={subtitleStyle}
            eventMode="none"
          />
        )}

        {/* Close button */}
        {showCloseButton && (
          <pixiContainer 
            x={width - 44} 
            y={10}
            eventMode="static"
            cursor="pointer"
            onPointerDown={(e: any) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <pixiGraphics draw={drawCloseButton} eventMode="none" />
          </pixiContainer>
        )}

        {/* Content area - children handle their own events */}
        <pixiContainer x={0} y={headerHeight} eventMode="static">
          {children}
        </pixiContainer>
      </pixiContainer>
    </>
  );
};

export default Modal;
