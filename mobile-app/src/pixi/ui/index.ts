/**
 * PixiJS UI Kit - Tiki Theme
 * 
 * Exports all UI components for building the full PixiJS experience.
 */

// Core Components
export { PixiButton } from './PixiButton';
export type { PixiButtonProps } from './PixiButton';

export { PixiPanel, PixiPanelHeader, PixiPanelDivider } from './PixiPanel';
export type { PixiPanelProps, PixiPanelHeaderProps, PixiPanelDividerProps } from './PixiPanel';

export { PixiModal, PixiConfirmModal } from './PixiModal';
export type { PixiModalProps, PixiConfirmModalProps } from './PixiModal';

export { PixiScrollContainer, PixiScrollList } from './PixiScrollContainer';
export type { PixiScrollContainerProps, PixiScrollListProps } from './PixiScrollContainer';

// Supporting Components
export {
  PixiProgressBar,
  PixiStarRating,
  PixiBadge,
  PixiIcon,
  PixiLabel,
  PixiDivider,
  PixiSpacer,
} from './PixiComponents';

export type {
  PixiProgressBarProps,
  PixiStarRatingProps,
  PixiBadgeProps,
  PixiIconProps,
  PixiLabelProps,
  PixiDividerProps,
  PixiSpacerProps,
  LabelVariant,
} from './PixiComponents';

// Demo Component (for testing)
export { UIKitDemo } from './UIKitDemo';
export type { UIKitDemoProps } from './UIKitDemo';
