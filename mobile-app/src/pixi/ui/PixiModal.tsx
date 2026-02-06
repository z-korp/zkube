/**
 * PixiModal - Tiki-themed modal component
 * 
 * Full-screen overlay with centered panel containing:
 * - Semi-transparent backdrop that blocks interaction
 * - 9-slice panel background
 * - Optional title
 * - Close button
 * - Content area
 */

import { useCallback, useMemo, ReactNode } from 'react';
import { FederatedPointerEvent, Graphics as PixiGraphics } from 'pixi.js';
import { PixiPanel, PixiPanelHeader } from './PixiPanel';
import { PixiButton } from './PixiButton';
import type { PanelType } from '../assets/manifest';
import { FONT_BODY } from '../utils/colors';

export interface PixiModalProps {
  /** Screen width for centering */
  screenWidth: number;
  /** Screen height for centering */
  screenHeight: number;
  /** Modal panel width */
  width: number;
  /** Modal panel height */
  height: number;
  /** Panel style variant */
  variant?: PanelType;
  /** Modal title */
  title?: string;
  /** Whether modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose?: () => void;
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Whether clicking backdrop closes modal */
  closeOnBackdrop?: boolean;
  /** Backdrop color */
  backdropColor?: number;
  /** Backdrop alpha */
  backdropAlpha?: number;
  /** Content padding */
  padding?: number;
  /** Child content */
  children?: ReactNode;
  /** Z-index for layering (higher = on top) */
  zIndex?: number;
}

export function PixiModal({
  screenWidth,
  screenHeight,
  width,
  height,
  variant = 'wood',
  title,
  isOpen,
  onClose,
  showCloseButton = true,
  closeOnBackdrop = true,
  backdropColor = 0x000000,
  backdropAlpha = 0.7,
  padding = 20,
  children,
  zIndex = 1000,
}: PixiModalProps) {
  // Calculate centered position
  const modalX = (screenWidth - width) / 2;
  const modalY = (screenHeight - height) / 2;

  // Content area dimensions (accounting for title if present)
  const titleHeight = title ? 40 : 0;
  const contentY = titleHeight;
  const contentHeight = height - padding * 2 - titleHeight;
  const contentWidth = width - padding * 2;

  // Draw backdrop
  const drawBackdrop = useCallback((g: PixiGraphics) => {
    g.clear();
    g.setFillStyle({ color: backdropColor, alpha: backdropAlpha });
    g.rect(0, 0, screenWidth, screenHeight);
    g.fill();
  }, [screenWidth, screenHeight, backdropColor, backdropAlpha]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e: FederatedPointerEvent) => {
    e.stopPropagation();
    if (closeOnBackdrop && onClose) {
      onClose();
    }
  }, [closeOnBackdrop, onClose]);

  // Prevent clicks on modal from bubbling to backdrop
  const handleModalClick = useCallback((e: FederatedPointerEvent) => {
    e.stopPropagation();
  }, []);

  if (!isOpen) return null;

  return (
    <pixiContainer zIndex={zIndex} sortableChildren>
      {/* Backdrop */}
      <pixiGraphics
        draw={drawBackdrop}
        eventMode="static"
        onPointerDown={handleBackdropClick}
      />

      {/* Modal panel */}
      <pixiContainer
        x={modalX}
        y={modalY}
        eventMode="static"
        onPointerDown={handleModalClick}
      >
        <PixiPanel
          width={width}
          height={height}
          variant={variant}
          padding={padding}
        >
          {/* Title */}
          {title && (
            <PixiPanelHeader
              title={title}
              width={contentWidth}
              fontSize={22}
            />
          )}

          {/* Close button */}
          {showCloseButton && onClose && (
            <pixiContainer
              x={contentWidth - 16}
              y={-padding + 8}
            >
              <PixiButton
                width={36}
                height={36}
                iconOnly
                icon="close"
                iconSize={20}
                onPress={onClose}
                anchor={0.5}
              />
            </pixiContainer>
          )}

          {/* Content area */}
          <pixiContainer y={contentY}>
            {children}
          </pixiContainer>
        </PixiPanel>
      </pixiContainer>
    </pixiContainer>
  );
}

/**
 * PixiConfirmModal - Simple confirmation dialog
 */
export interface PixiConfirmModalProps {
  screenWidth: number;
  screenHeight: number;
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmVariant?: 'orange' | 'green' | 'red';
}

export function PixiConfirmModal({
  screenWidth,
  screenHeight,
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  confirmVariant = 'orange',
}: PixiConfirmModalProps) {
  const width = Math.min(400, screenWidth - 40);
  const height = 200;

  return (
    <PixiModal
      screenWidth={screenWidth}
      screenHeight={screenHeight}
      width={width}
      height={height}
      title={title}
      isOpen={isOpen}
      onClose={onCancel}
      showCloseButton={false}
      closeOnBackdrop={false}
    >
      {/* Message */}
      <pixiText
        text={message}
        y={10}
        style={{
          fontFamily: FONT_BODY,
          fontSize: 16,
          fill: 0xFFFFFF,
          wordWrap: true,
          wordWrapWidth: width - 60,
          align: 'center',
        }}
      />

      {/* Button row */}
      <pixiContainer y={80}>
        <PixiButton
          x={0}
          label={cancelLabel}
          variant="purple"
          width={140}
          height={44}
          onPress={onCancel}
        />
        <PixiButton
          x={160}
          label={confirmLabel}
          variant={confirmVariant}
          width={140}
          height={44}
          onPress={onConfirm}
        />
      </pixiContainer>
    </PixiModal>
  );
}

export default PixiModal;
