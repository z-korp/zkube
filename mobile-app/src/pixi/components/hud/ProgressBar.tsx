import { useCallback, useMemo, useRef } from 'react';
import { TextStyle, Graphics as PixiGraphics } from 'pixi.js';
import { useTick } from '@pixi/react';
import { FONT_BODY } from '../../utils/colors';

interface ProgressBarProps {
  current: number;
  target: number;
  x: number;
  y: number;
  width: number;
  height: number;
  showScore?: boolean;
  isDanger?: boolean;
}

export const ProgressBar = ({
  current,
  target,
  x,
  y,
  width,
  height,
  showScore = true,
  isDanger = false,
}: ProgressBarProps) => {
  const targetProgress = Math.min(1, Math.max(0, current / target));
  const progressRef = useRef(0);
  const fillGraphicsRef = useRef<PixiGraphics | null>(null);

  const barHeight = height - 8;
  const cornerRadius = barHeight / 2;
  const innerPadding = 2;
  const innerHeight = barHeight - innerPadding * 2;
  const innerCornerRadius = innerHeight / 2;

  const bgColor = 0x0f172a;
  const fillColor = isDanger ? 0xef4444 : 0x3b82f6;

  const tickCallback = useCallback((ticker: { deltaMS: number }) => {
    const diff = targetProgress - progressRef.current;
    if (Math.abs(diff) < 0.001) {
      return;
    }

    // Lerp factor normalized to ~60fps
    const lerpFactor = 1 - Math.pow(1 - 0.15, ticker.deltaMS / 16.667);
    const step = diff * lerpFactor;
    progressRef.current += step;

    const g = fillGraphicsRef.current;
    if (!g) return;
    const animatedProgress = progressRef.current;
    const fillWidth = Math.max(0, (width - innerPadding * 2) * animatedProgress);

    g.clear();

    if (fillWidth < innerCornerRadius * 2) {
      if (fillWidth > 0) {
        g.circle(innerPadding + innerHeight / 2, innerPadding + innerHeight / 2, fillWidth / 2);
        g.fill({ color: fillColor });
      }
      return;
    }

    g.roundRect(innerPadding, innerPadding, fillWidth, innerHeight, innerCornerRadius);
    g.fill({ color: fillColor });
    g.roundRect(innerPadding, innerPadding, fillWidth, innerHeight / 2, innerCornerRadius);
    g.fill({ color: 0xffffff, alpha: 0.15 });
  }, [targetProgress, width, innerPadding, innerCornerRadius, innerHeight, fillColor]);

  useTick(tickCallback);

  const drawBackground = useCallback((g: PixiGraphics) => {
    g.clear();
    g.roundRect(0, 0, width, barHeight, cornerRadius);
    g.fill({ color: bgColor, alpha: 0.9 });
    g.roundRect(0, 0, width, barHeight, cornerRadius);
    g.stroke({ color: 0x1e293b, width: 1, alpha: 0.5 });
  }, [width, barHeight, cornerRadius]);

  const drawFill = useCallback((g: PixiGraphics) => {
    fillGraphicsRef.current = g;
    const fillWidth = Math.max(0, (width - innerPadding * 2) * progressRef.current);

    g.clear();

    if (fillWidth < innerCornerRadius * 2) {
      if (fillWidth > 0) {
        g.circle(innerPadding + innerHeight / 2, innerPadding + innerHeight / 2, fillWidth / 2);
        g.fill({ color: fillColor });
      }
      return;
    }

    g.roundRect(innerPadding, innerPadding, fillWidth, innerHeight, innerCornerRadius);
    g.fill({ color: fillColor });
    g.roundRect(innerPadding, innerPadding, fillWidth, innerHeight / 2, innerCornerRadius);
    g.fill({ color: 0xffffff, alpha: 0.15 });
  }, [width, innerHeight, innerCornerRadius, innerPadding, fillColor]);

  const textStyle = useMemo(() => new TextStyle({
    fontFamily: FONT_BODY,
    fontSize: 12,
    fontWeight: 'bold',
    fill: 0xffffff,
  }), []);

  return (
    <pixiContainer x={x} y={y + 4}>
      <pixiGraphics draw={drawBackground} />
      <pixiGraphics draw={drawFill} />

      {showScore && (
        <pixiText
          text={`${current} / ${target}`}
          x={width / 2}
          y={barHeight / 2}
          anchor={0.5}
          style={textStyle}
        />
      )}
    </pixiContainer>
  );
};

export default ProgressBar;
