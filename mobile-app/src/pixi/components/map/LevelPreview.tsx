import { useCallback, useMemo, useRef, useState } from 'react';
import { Graphics as PixiGraphics, TextStyle, Container } from 'pixi.js';
import { useTick } from '@pixi/react';
import type { MapNodeData } from '../../hooks/useMapData';
import { getThemeColors, THEME_META, FONT_BOLD, FONT_BODY, FONT_TITLE, UI } from '../../utils/colors';
import { ConstraintType } from '@/dojo/game/types/constraint';

export interface LevelPreviewProps {
  node: MapNodeData;
  screenWidth: number;
  screenHeight: number;
  isGameOver?: boolean;
  onPlay?: () => void;
  onClose?: () => void;
}

const PANEL_W = 280;
const PANEL_H_BASE = 200;
const PANEL_RADIUS = 16;
const BUTTON_H = 44;
const BUTTON_W = 140;

const DIFFICULTY_LABELS: Record<string, { label: string; color: number }> = {
  VeryEasy:   { label: 'Very Easy',   color: 0x4ade80 },
  Easy:       { label: 'Easy',        color: 0x22c55e },
  Medium:     { label: 'Medium',      color: 0xfbbf24 },
  MediumHard: { label: 'Medium Hard', color: 0xf97316 },
  Hard:       { label: 'Hard',        color: 0xef4444 },
  VeryHard:   { label: 'Very Hard',   color: 0xdc2626 },
  Expert:     { label: 'Expert',      color: 0xb91c1c },
  Master:     { label: 'Master',      color: 0x7f1d1d },
};

const ENTRANCE_DURATION = 200;
const BACKDROP_DURATION = 150;
const PANEL_SLIDE_OFFSET = 30;

export const LevelPreview = ({ node, screenWidth, screenHeight, isGameOver = false, onPlay, onClose }: LevelPreviewProps) => {
  const [playPressed, setPlayPressed] = useState(false);
  const [closePressed, setClosePressed] = useState(false);
  const themeColors = getThemeColors(node.zoneTheme);
  const themeMeta = THEME_META[node.zoneTheme];
  const levelConfig = node.levelConfig;
  const isPlayable = !isGameOver && (node.state === 'current' || node.state === 'available');
  const isCleared = node.state === 'cleared';
  const isDeathLevel = isGameOver && node.state === 'current';

  const hasConstraint3 = levelConfig && levelConfig.constraint3.constraintType !== ConstraintType.None;
  const showConstraints = isPlayable || isCleared || isDeathLevel;
  const constraintRows = levelConfig ? [
    levelConfig.constraint.constraintType !== ConstraintType.None,
    levelConfig.constraint2.constraintType !== ConstraintType.None,
    levelConfig.constraint3.constraintType !== ConstraintType.None,
  ].filter(Boolean).length : 0;
  const panelH = node.type === 'shop' ? 160
    : isDeathLevel ? PANEL_H_BASE + constraintRows * 22 + 10
    : isCleared ? PANEL_H_BASE + constraintRows * 22
    : hasConstraint3 ? PANEL_H_BASE + 22
    : PANEL_H_BASE;
  const panelX = (screenWidth - PANEL_W) / 2;
  const panelY = (screenHeight - panelH) / 2;

  const backdropRef = useRef<PixiGraphics | null>(null);
  const panelContainerRef = useRef<Container | null>(null);
  const entranceRef = useRef({ elapsed: 0, done: false });

  const tickEntrance = useCallback(
    (ticker: { deltaMS: number }) => {
      if (entranceRef.current.done) return;
      entranceRef.current.elapsed += ticker.deltaMS;
      const t = entranceRef.current.elapsed;

      const bg = backdropRef.current;
      if (bg) {
        bg.alpha = Math.min(t / BACKDROP_DURATION, 1);
      }

      const panel = panelContainerRef.current;
      if (panel) {
        const progress = Math.min(t / ENTRANCE_DURATION, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        panel.alpha = eased;
        panel.y = panelY + PANEL_SLIDE_OFFSET * (1 - eased);
      }

      if (t >= ENTRANCE_DURATION) {
        entranceRef.current.done = true;
      }
    },
    [panelY],
  );
  useTick(tickEntrance, !entranceRef.current.done);

  const drawBackdrop = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.rect(0, 0, screenWidth, screenHeight);
      g.fill({ color: 0x000000, alpha: 0.6 });
    },
    [screenWidth, screenHeight],
  );

  const drawPanel = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.roundRect(0, 0, PANEL_W, panelH, PANEL_RADIUS);
      g.fill({ color: 0x0f172a, alpha: 0.95 });
      g.roundRect(0, 0, PANEL_W, panelH, PANEL_RADIUS);
      g.stroke({ color: themeColors.accent, width: 2, alpha: 0.6 });
    },
    [panelH, themeColors.accent],
  );

  const drawPlayBtn = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      const s = playPressed ? 0.95 : 1;
      const w = BUTTON_W * s;
      const h = BUTTON_H * s;
      const ox = (BUTTON_W - w) / 2;
      const oy = (BUTTON_H - h) / 2;
      g.roundRect(ox, oy, w, h, 10);
      g.fill({ color: 0xf97316 });
      g.roundRect(ox, oy, w, h, 10);
      g.stroke({ color: 0xffffff, width: 1.5, alpha: 0.3 });
    },
    [playPressed],
  );

  const drawCloseBtn = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      const s = closePressed ? 0.9 : 1;
      const sz = 32 * s;
      const o = (32 - sz) / 2;
      g.roundRect(o, o, sz, sz, 6);
      g.fill({ color: 0x374151, alpha: 0.8 });
      g.roundRect(o, o, sz, sz, 6);
      g.stroke({ color: 0x6b7280, width: 1, alpha: 0.5 });
    },
    [closePressed],
  );

  const titleStyle = useMemo(() => new TextStyle({ fontFamily: FONT_TITLE, fontSize: 18, fill: UI.text.primary }), []);
  const labelStyle = useMemo(() => new TextStyle({ fontFamily: FONT_BODY, fontSize: 11, fill: UI.text.secondary }), []);
  const valueStyle = useMemo(() => new TextStyle({ fontFamily: FONT_BOLD, fontSize: 13, fontWeight: 'bold', fill: UI.text.primary }), []);
  const closeBtnTextStyle = useMemo(() => new TextStyle({ fontSize: 14, fill: UI.text.secondary }), []);
  const playBtnTextStyle = useMemo(() => new TextStyle({ fontFamily: FONT_BOLD, fontSize: 16, fontWeight: 'bold', fill: 0xffffff }), []);

  const diffInfo = levelConfig
    ? DIFFICULTY_LABELS[levelConfig.difficulty.value] ?? { label: levelConfig.difficulty.value, color: 0xffffff }
    : null;
  const diffStyle = useMemo(() => {
    if (!diffInfo) return valueStyle;
    return new TextStyle({ fontFamily: FONT_BOLD, fontSize: 13, fontWeight: 'bold', fill: diffInfo.color });
  }, [diffInfo, valueStyle]);

  const title = node.type === 'boss'
    ? `Boss - Level ${node.contractLevel}`
    : node.type === 'shop'
      ? `${themeMeta.icon} Shop Stop`
      : `Level ${node.contractLevel}`;

  let infoY = 50;
  const lineH = 22;

  return (
    <pixiContainer>
      <pixiGraphics
        ref={(ref) => { backdropRef.current = ref; }}
        draw={drawBackdrop}
        alpha={0}
        eventMode="static"
        onPointerUp={() => onClose?.()}
      />

      <pixiContainer
        ref={(ref: Container | null) => { panelContainerRef.current = ref; }}
        x={panelX}
        y={panelY + PANEL_SLIDE_OFFSET}
        alpha={0}
      >
        <pixiGraphics draw={drawPanel} eventMode="static" onPointerDown={(e: any) => e.stopPropagation()} />

        <pixiContainer x={PANEL_W - 40} y={8}>
          <pixiGraphics
            draw={drawCloseBtn}
            eventMode="static"
            cursor="pointer"
            onPointerDown={() => setClosePressed(true)}
            onPointerUp={() => { setClosePressed(false); onClose?.(); }}
            onPointerUpOutside={() => setClosePressed(false)}
          />
          <pixiText text="✕" x={16} y={16} anchor={0.5} style={closeBtnTextStyle} eventMode="none" />
        </pixiContainer>

        <pixiText text={title} x={PANEL_W / 2} y={20} anchor={{ x: 0.5, y: 0 }} style={titleStyle} eventMode="none" />

        <pixiText
          text={`${themeMeta.icon} ${themeMeta.name}`}
          x={PANEL_W / 2}
          y={42}
          anchor={{ x: 0.5, y: 0 }}
          style={labelStyle}
          eventMode="none"
        />

        {node.type === 'shop' ? (
          <pixiContainer>
            <pixiText text="Spend cubes on consumables" x={PANEL_W / 2} y={80} anchor={0.5} style={labelStyle} eventMode="none" />
            <pixiText text="for the upcoming boss level" x={PANEL_W / 2} y={96} anchor={0.5} style={labelStyle} eventMode="none" />
          </pixiContainer>
        ) : levelConfig ? (
          <pixiContainer y={infoY + 14}>
            <pixiText text="Difficulty" x={20} y={0} style={labelStyle} eventMode="none" />
            <pixiText text={diffInfo?.label ?? ''} x={PANEL_W - 20} y={0} anchor={{ x: 1, y: 0 }} style={diffStyle} eventMode="none" />

            {(isCleared || isDeathLevel) && (
              <pixiContainer>
                <pixiText text="Status" x={20} y={lineH} style={labelStyle} eventMode="none" />
                <pixiText
                  text={isDeathLevel ? "💀 Died here" : "✓ Cleared"}
                  x={PANEL_W - 20}
                  y={lineH}
                  anchor={{ x: 1, y: 0 }}
                  style={new TextStyle({ fontFamily: FONT_BOLD, fontSize: 13, fontWeight: 'bold', fill: isDeathLevel ? 0xef4444 : 0x22c55e })}
                  eventMode="none"
                />
              </pixiContainer>
            )}

            {showConstraints && (
              <pixiContainer>
                {(() => {
                  const startRow = (isCleared || isDeathLevel) ? 2 : 1;
                  return (
                    <>
                      <pixiText text="Target Score" x={20} y={lineH * startRow} style={labelStyle} eventMode="none" />
                      <pixiText text={String(levelConfig.pointsRequired)} x={PANEL_W - 20} y={lineH * startRow} anchor={{ x: 1, y: 0 }} style={valueStyle} eventMode="none" />

                      <pixiText text="Max Moves" x={20} y={lineH * (startRow + 1)} style={labelStyle} eventMode="none" />
                      <pixiText text={String(levelConfig.maxMoves)} x={PANEL_W - 20} y={lineH * (startRow + 1)} anchor={{ x: 1, y: 0 }} style={valueStyle} eventMode="none" />

                      {levelConfig.constraint.constraintType !== ConstraintType.None && (
                        <pixiContainer>
                          <pixiText text="Constraint" x={20} y={lineH * (startRow + 2)} style={labelStyle} eventMode="none" />
                          <pixiText
                            text={levelConfig.constraint.getLabel()}
                            x={PANEL_W - 20}
                            y={lineH * (startRow + 2)}
                            anchor={{ x: 1, y: 0 }}
                            style={valueStyle}
                            eventMode="none"
                          />
                        </pixiContainer>
                      )}

                      {levelConfig.constraint2.constraintType !== ConstraintType.None && (
                        <pixiContainer>
                          <pixiText text="Constraint 2" x={20} y={lineH * (startRow + 3)} style={labelStyle} eventMode="none" />
                          <pixiText
                            text={levelConfig.constraint2.getLabel()}
                            x={PANEL_W - 20}
                            y={lineH * (startRow + 3)}
                            anchor={{ x: 1, y: 0 }}
                            style={valueStyle}
                            eventMode="none"
                          />
                        </pixiContainer>
                      )}

                      {levelConfig.constraint3.constraintType !== ConstraintType.None && (
                        <pixiContainer>
                          <pixiText text="Constraint 3" x={20} y={lineH * (startRow + 4)} style={labelStyle} eventMode="none" />
                          <pixiText
                            text={levelConfig.constraint3.getLabel()}
                            x={PANEL_W - 20}
                            y={lineH * (startRow + 4)}
                            anchor={{ x: 1, y: 0 }}
                            style={valueStyle}
                            eventMode="none"
                          />
                        </pixiContainer>
                      )}
                    </>
                  );
                })()}
              </pixiContainer>
            )}
          </pixiContainer>
        ) : null}

        {isPlayable && (
          <pixiContainer x={(PANEL_W - BUTTON_W) / 2} y={panelH - BUTTON_H - 16}>
            <pixiGraphics
              draw={drawPlayBtn}
              eventMode="static"
              cursor="pointer"
              onPointerDown={() => setPlayPressed(true)}
              onPointerUp={() => { setPlayPressed(false); onPlay?.(); }}
              onPointerUpOutside={() => setPlayPressed(false)}
            />
            <pixiText text="Play" x={BUTTON_W / 2} y={BUTTON_H / 2} anchor={0.5} style={playBtnTextStyle} eventMode="none" />
          </pixiContainer>
        )}
      </pixiContainer>
    </pixiContainer>
  );
};

export default LevelPreview;
