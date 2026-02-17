import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsOptions {
  /** Callback for bonus 1 (key: 1) */
  onBonus1?: () => void;
  /** Callback for bonus 2 (key: 2) */
  onBonus2?: () => void;
  /** Callback for bonus 3 (key: 3) */
  onBonus3?: () => void;
  /** Callback for menu (key: Escape) */
  onMenu?: () => void;
  /** Callback for cancel/deselect (key: Escape when bonus selected) */
  onCancel?: () => void;
  /** Whether shortcuts are enabled */
  enabled?: boolean;
  /** Whether a bonus is currently selected (affects Escape behavior) */
  isBonusSelected?: boolean;
}

/**
 * Hook for keyboard shortcuts in fullscreen game
 * 
 * Shortcuts:
 * - 1, 2, 3: Select bonus slots
 * - Escape: Cancel bonus selection or open menu
 * - Space: (future) Pause game
 */
export function useKeyboardShortcuts({
  onBonus1,
  onBonus2,
  onBonus3,
  onMenu,
  onCancel,
  enabled = true,
  isBonusSelected = false,
}: KeyboardShortcutsOptions) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Ignore if user is typing in an input
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    switch (event.key) {
      case '1':
        event.preventDefault();
        onBonus1?.();
        break;
      case '2':
        event.preventDefault();
        onBonus2?.();
        break;
      case '3':
        event.preventDefault();
        onBonus3?.();
        break;
      case 'Escape':
        event.preventDefault();
        if (isBonusSelected) {
          onCancel?.();
        } else {
          onMenu?.();
        }
        break;
      default:
        break;
    }
  }, [enabled, onBonus1, onBonus2, onBonus3, onMenu, onCancel, isBonusSelected]);

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);
}

export default useKeyboardShortcuts;
