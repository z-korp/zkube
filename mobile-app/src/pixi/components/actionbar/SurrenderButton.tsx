import { useState, useRef, useEffect, useCallback } from 'react';
import { PixiButton } from '../../ui/PixiButton';
import { FONT_BOLD } from '../../utils/colors';

const CONFIRM_TIMEOUT_MS = 2000;

interface SurrenderButtonProps {
  x: number;
  y: number;
  width: number;
  height: number;
  onClick?: () => void;
  isDisabled?: boolean;
}

export const SurrenderButton = ({
  x,
  y,
  width,
  height,
  onClick,
  isDisabled = false,
}: SurrenderButtonProps) => {
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    };
  }, []);

  const handlePress = useCallback(() => {
    if (isDisabled) return;

    if (awaitingConfirm) {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      setAwaitingConfirm(false);
      onClick?.();
    } else {
      setAwaitingConfirm(true);
      confirmTimer.current = setTimeout(() => setAwaitingConfirm(false), CONFIRM_TIMEOUT_MS);
    }
  }, [isDisabled, awaitingConfirm, onClick]);

  return (
    <PixiButton
      x={x}
      y={y}
      width={width}
      height={height}
      variant="red"
      icon={awaitingConfirm ? undefined : 'surrender'}
      iconSize={Math.min(width, height) * 0.55}
      label={awaitingConfirm ? 'Sure?' : undefined}
      disabled={isDisabled}
      onPress={handlePress}
      textStyle={{ fontFamily: FONT_BOLD, fontSize: Math.min(width, height) * 0.3 }}
    />
  );
};

export default SurrenderButton;
