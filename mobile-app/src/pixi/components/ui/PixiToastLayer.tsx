import { useMemo } from "react";
import { useTick } from "@pixi/react";
import { Graphics as PixiGraphics } from "pixi.js";
import { FONT_BODY, FONT_BOLD } from "../../utils/colors";
import { usePixiToastStore } from "../../notifications/store";

type Props = {
  screenWidth: number;
  topOffset?: number;
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

export const PixiToastLayer = ({ screenWidth, topOffset = 12 }: Props) => {
  const toasts = usePixiToastStore((s) => s.toasts);
  const pruneExpired = usePixiToastStore((s) => s.pruneExpired);

  useTick(() => {
    pruneExpired(Date.now());
  });

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

  return (
    <pixiContainer x={(screenWidth - width) / 2} y={topOffset} eventMode="none">
      {toasts.map((toast, i) => {
        const y = i * 58;
        return (
          <pixiContainer key={toast.id} y={y}>
            <pixiGraphics
              draw={(g: PixiGraphics) => {
                g.clear();
                g.roundRect(0, 0, width, 50, 10);
                g.fill({ color: toastColor(toast.type), alpha: 0.92 });
                g.roundRect(0, 0, width, 50, 10);
                g.stroke({ color: toastBorder(toast.type), width: 1.5, alpha: 0.65 });
              }}
            />
            <pixiText text={toast.message} x={10} y={8} style={textStyle} />
            {toast.description ? <pixiText text={toast.description} x={10} y={27} style={descStyle} /> : null}
          </pixiContainer>
        );
      })}
    </pixiContainer>
  );
};

export default PixiToastLayer;
