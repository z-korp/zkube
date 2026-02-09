import { useCallback, useMemo } from 'react';
import { Graphics as PixiGraphics, TextStyle } from 'pixi.js';
import { Modal, Button } from '../ui';
import { FONT_TITLE, FONT_BODY } from '../../utils/colors';

export interface InGameShopBonusItem {
  slot: number;
  name: string;
  icon: string;
  inventory: number;
  bagSize: number;
  level: number;
  bought: boolean;
  isFull: boolean;
  primaryCost: number;
  canPrimary: boolean;
  canLevelUp: boolean;
  isMaxLevel: boolean;
  onPrimary: () => Promise<void> | void;
  onLevelUp: () => Promise<void> | void;
}

interface InGameShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  screenWidth: number;
  screenHeight: number;
  cubesAvailable: number;
  items: InGameShopBonusItem[];
  isPurchasing: boolean;
}

export const InGameShopModal = ({
  isOpen,
  onClose,
  screenWidth,
  screenHeight,
  cubesAvailable,
  items,
  isPurchasing,
}: InGameShopModalProps) => {
  const modalWidth = 360;
  const contentHeight = Math.max(220, 94 + items.length * 88);
  const sectionWidth = modalWidth - 48;

  const titleStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: FONT_TITLE,
        fontSize: 20,
        fontWeight: 'bold',
        fill: 0xffffff,
      }),
    []
  );

  const subtitleStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: FONT_BODY,
        fontSize: 12,
        fill: 0x94a3b8,
      }),
    []
  );

  const cubesStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: FONT_TITLE,
        fontSize: 18,
        fontWeight: 'bold',
        fill: 0xfbbf24,
      }),
    []
  );

  const itemTitleStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: FONT_TITLE,
        fontSize: 14,
        fill: 0xffffff,
      }),
    []
  );

  const itemMetaStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: FONT_BODY,
        fontSize: 11,
        fill: 0x94a3b8,
      }),
    []
  );

  const emptyStyle = useMemo(
    () =>
      new TextStyle({
        fontFamily: FONT_BODY,
        fontSize: 13,
        fill: 0x94a3b8,
      }),
    []
  );

  const drawCubesCard = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.roundRect(0, 0, sectionWidth, 44, 10);
      g.fill({ color: 0x1e293b, alpha: 0.9 });
      g.roundRect(0, 0, sectionWidth, 44, 10);
      g.stroke({ color: 0x334155, width: 1, alpha: 0.5 });
    },
    [sectionWidth]
  );

  const drawItemCard = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.roundRect(0, 0, sectionWidth, 78, 10);
      g.fill({ color: 0x0f172a, alpha: 0.92 });
      g.roundRect(0, 0, sectionWidth, 78, 10);
      g.stroke({ color: 0x334155, width: 1, alpha: 0.45 });
    },
    [sectionWidth]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="In-Game Shop"
      subtitle="Spend cubes and keep the run rolling"
      width={modalWidth}
      contentHeight={contentHeight}
      screenWidth={screenWidth}
      screenHeight={screenHeight}
      showCloseButton={!isPurchasing}
      closeOnBackdrop={!isPurchasing}
      closeOnEscape={!isPurchasing}
    >
      <pixiContainer x={24} y={0}>
        <pixiGraphics draw={drawCubesCard} eventMode="none" />
        <pixiText text="Cubes Available" x={12} y={7} style={subtitleStyle} eventMode="none" />
        <pixiText text={`🧊 ${cubesAvailable}`} x={sectionWidth - 12} y={22} anchor={{ x: 1, y: 0.5 }} style={cubesStyle} eventMode="none" />

        {items.length === 0 ? (
          <pixiText text="No bonus slots active for this run." x={sectionWidth / 2} y={74} anchor={0.5} style={emptyStyle} />
        ) : (
          <pixiContainer y={56}>
            {items.map((item, idx) => {
              const itemY = idx * 88;
              const primaryLabel = item.bought
                ? item.isFull
                  ? 'Full'
                  : `Refill ${item.primaryCost}`
                : item.isFull
                  ? 'Full'
                  : `+1 ${item.primaryCost}`;

              const levelLabel = item.isMaxLevel ? 'Max Lv' : `Lv↑ 50`;

              return (
                <pixiContainer key={`${item.slot}-${item.name}`} y={itemY}>
                  <pixiGraphics draw={drawItemCard} eventMode="none" />

                  <pixiText text={item.icon} x={12} y={17} style={titleStyle} eventMode="none" />
                  <pixiText text={item.name} x={42} y={14} style={itemTitleStyle} eventMode="none" />
                  <pixiText
                    text={`${item.inventory}/${item.bagSize} in bag • Lv${item.level}`}
                    x={42}
                    y={36}
                    style={itemMetaStyle}
                    eventMode="none"
                  />

                  <Button
                    text={primaryLabel}
                    x={sectionWidth - 162}
                    y={20}
                    width={74}
                    height={40}
                    variant={item.canPrimary ? 'primary' : 'secondary'}
                    fontSize={11}
                    disabled={isPurchasing || !item.canPrimary}
                    onClick={() => {
                      void item.onPrimary();
                    }}
                  />

                  <Button
                    text={levelLabel}
                    x={sectionWidth - 80}
                    y={20}
                    width={74}
                    height={40}
                    variant={item.canLevelUp ? 'primary' : 'secondary'}
                    fontSize={11}
                    disabled={isPurchasing || !item.canLevelUp}
                    onClick={() => {
                      void item.onLevelUp();
                    }}
                  />
                </pixiContainer>
              );
            })}
          </pixiContainer>
        )}

        <Button
          text={isPurchasing ? 'Purchasing...' : 'Continue Run'}
          y={contentHeight - 58}
          width={sectionWidth}
          height={44}
          variant="secondary"
          disabled={isPurchasing}
          onClick={onClose}
        />
      </pixiContainer>
    </Modal>
  );
};

export default InGameShopModal;
