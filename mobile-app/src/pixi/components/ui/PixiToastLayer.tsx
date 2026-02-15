import { useMemo, useCallback, useRef } from "react";
import { useTick } from "@pixi/react";
import { Graphics as PixiGraphics } from "pixi.js";
import { FONT_BODY, FONT_BOLD } from "../../utils/colors";
import { usePixiToastStore } from "../../notifications/store";

type Props = {
  screenWidth: number;
  screenHeight: number;
  bottomOffset?: number;
};

const toastColor = (type: string) => {
  if (type === "success") return 0x166534;
  if (type === "error") return 0x7f1d1d;
  if (type === "info") return 0x1e3a8a;
  return 0x1f2937;
};

const toastBorder = (type: string) => {
  if (type === "success") return 0x22c55e;
  if (type === "error") return 0xef4444;
  if (type === "info") return 0x60a5fa;
  return 0x94a3b8;
};

const ToastItem = ({
  type,
  message,
  description,
  width,
  textStyle,
  descStyle,
}: {
  type: string;
  message: string;
  description?: string;
  width: number;
  textStyle: Record<string, unknown>;
  descStyle: Record<string, unknown>;
}) => {
  const drawToast = useCallback((g: PixiGraphics) => {
    g.clear();
    g.roundRect(0, 0, width, 50, 10);
    g.fill({ color: toastColor(type), alpha: 0.92 });
    g.roundRect(0, 0, width, 50, 10);
    g.stroke({ color: toastBorder(type), width: 1.5, alpha: 0.65 });
  }, [width, type]);

  return (
    <>
      <pixiGraphics draw={drawToast} />
      <pixiText text={message} x={10} y={8} style={textStyle} />
      {description ? <pixiText text={description} x={10} y={27} style={descStyle} /> : null}
    </>
  );
};

export const PixiToastLayer = ({ screenWidth, screenHeight, bottomOffset = 24 }: Props) => {
  const toasts = usePixiToastStore((s) => s.toasts);
  const pruneExpired = usePixiToastStore((s) => s.pruneExpired);

  const lastPruneRef = useRef(0);
  const tickPrune = useCallback((ticker: { deltaMS: number }) => {
    lastPruneRef.current += ticker.deltaMS;
    if (lastPruneRef.current >= 1000) {
      lastPruneRef.current = 0;
      pruneExpired(Date.now());
    }
  }, [pruneExpired]);

  useTick(tickPrune);

  const TOAST_HEIGHT = 50;
  const TOAST_GAP = 8;
  const width = Math.min(360, Math.max(240, screenWidth - 24));
  const textStyle = useMemo(
    () => ({
      fontFamily: FONT_BOLD,
      fontSize: 13,
      fill: 0xffffff,
      wordWrap: true,
      wordWrapWidth: width - 20,
    }),
    [width]
  );
  const descStyle = useMemo(
    () => ({
      fontFamily: FONT_BODY,
      fontSize: 11,
      fill: 0xcbd5e1,
      wordWrap: true,
      wordWrapWidth: width - 20,
    }),
    [width]
  );

  const baseY = screenHeight - bottomOffset - TOAST_HEIGHT;

  return (
    <pixiContainer x={(screenWidth - width) / 2} y={0} eventMode="none">
      {toasts.map((toast, i) => (
        <pixiContainer key={toast.id} y={baseY - i * (TOAST_HEIGHT + TOAST_GAP)}>
          <ToastItem
            type={toast.type}
            message={toast.message}
            description={toast.description}
            width={width}
            textStyle={textStyle}
            descStyle={descStyle}
          />
        </pixiContainer>
      ))}
    </pixiContainer>
  );
};

export default PixiToastLayer;
