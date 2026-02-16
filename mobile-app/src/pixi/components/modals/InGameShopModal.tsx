import { useCallback, useMemo, useState } from 'react';
import { Graphics as PixiGraphics, TextStyle } from 'pixi.js';
import { Modal } from '../ui';
import { PixiButton } from '../../ui/PixiButton';
import { FONT_TITLE, FONT_BODY, FONT_BOLD } from '../../utils/colors';
import type { SelectedBonusData, UnselectedBonusData } from '../../hooks/usePlayGame';

interface InGameShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  screenWidth: number;
  screenHeight: number;
  isPurchasing: boolean;
  cubesAvailable: number;
  unallocatedCharges: number;
  chargeCost: number;
  swapBought: boolean;
  levelUpBought: boolean;
  selectedBonuses: SelectedBonusData[];
  unselectedBonuses: UnselectedBonusData[];
  onBuyCharge: () => Promise<void>;
  onAllocateCharge: (bonusSlot: number) => Promise<void>;
  onLevelUpBonus: (bonusSlot: number) => Promise<void>;
  onSwapBonus: (bonusSlot: number, newBonusType: number) => Promise<void>;
}

const SECTION_BORDER = 0x334155;
const GOLD = 0xfbbf24;
const TEXT_DIM = 0x94a3b8;

export const InGameShopModal = ({
  isOpen,
  onClose,
  screenWidth,
  screenHeight,
  isPurchasing,
  cubesAvailable,
  unallocatedCharges,
  chargeCost,
  swapBought,
  levelUpBought,
  selectedBonuses,
  unselectedBonuses,
  onBuyCharge,
  onAllocateCharge,
  onLevelUpBonus,
  onSwapBonus,
}: InGameShopModalProps) => {
  const [swapOpenSlot, setSwapOpenSlot] = useState<number | null>(null);

  const modalWidth = 360;
  const sectionWidth = modalWidth - 48;
  const bonusCount = selectedBonuses.length;

  const chargesRowH = 42;
  const allocateBlockH = unallocatedCharges > 0 ? 20 + bonusCount * 36 : 0;
  const chargesSectionH = 34 + chargesRowH + 8 + allocateBlockH + 12;

  const levelUpRowsH = bonusCount * 40;
  const levelUpSectionH = 34 + levelUpRowsH + 20 + 12;

  const swapPickerH = swapOpenSlot !== null ? unselectedBonuses.length * 36 : 0;
  const swapRowsH = bonusCount * 40 + swapPickerH;
  const swapSectionH = 34 + swapRowsH + 20 + 12;

  const contentHeight = 56 + chargesSectionH + 2 + levelUpSectionH + 2 + swapSectionH + 56;

  const sectionTitleStyle = useMemo(
    () => new TextStyle({ fontFamily: FONT_TITLE, fontSize: 13, fontWeight: 'bold', fill: GOLD }),
    [],
  );
  const sectionDescStyle = useMemo(
    () => new TextStyle({ fontFamily: FONT_BODY, fontSize: 10, fill: TEXT_DIM }),
    [],
  );
  const cubesValueStyle = useMemo(
    () => new TextStyle({ fontFamily: FONT_TITLE, fontSize: 18, fontWeight: 'bold', fill: GOLD }),
    [],
  );
  const cubesLabelStyle = useMemo(
    () => new TextStyle({ fontFamily: FONT_BODY, fontSize: 10, fill: TEXT_DIM }),
    [],
  );
  const bonusNameStyle = useMemo(
    () => new TextStyle({ fontFamily: FONT_BOLD, fontSize: 12, fill: 0xffffff }),
    [],
  );
  const metaStyle = useMemo(
    () => new TextStyle({ fontFamily: FONT_BODY, fontSize: 10, fill: TEXT_DIM }),
    [],
  );
  const unallocStyle = useMemo(
    () => new TextStyle({ fontFamily: FONT_BOLD, fontSize: 11, fill: 0xf97316 }),
    [],
  );
  const footNoteStyle = useMemo(
    () => new TextStyle({ fontFamily: FONT_BODY, fontSize: 9, fill: TEXT_DIM, fontStyle: 'italic' }),
    [],
  );

  const drawCubesCard = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.roundRect(0, 0, sectionWidth, 44, 10);
      g.fill({ color: 0x1e293b, alpha: 0.9 });
      g.roundRect(0, 0, sectionWidth, 44, 10);
      g.stroke({ color: SECTION_BORDER, width: 1, alpha: 0.5 });
    },
    [sectionWidth],
  );

  const drawDivider = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.moveTo(0, 0);
      g.lineTo(sectionWidth, 0);
      g.stroke({ color: SECTION_BORDER, width: 1, alpha: 0.4 });
    },
    [sectionWidth],
  );

  const drawAllocRow = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      g.roundRect(0, 0, sectionWidth, 30, 6);
      g.fill({ color: 0x0f172a, alpha: 0.7 });
    },
    [sectionWidth],
  );

  const swapPickerCount = swapOpenSlot !== null ? unselectedBonuses.length : 0;
  const drawSwapPickerBg = useCallback(
    (g: PixiGraphics) => {
      g.clear();
      const h = swapPickerCount * 36;
      if (h <= 0) return;
      g.roundRect(0, 0, sectionWidth - 20, h, 6);
      g.fill({ color: 0x1e293b, alpha: 0.85 });
      g.roundRect(0, 0, sectionWidth - 20, h, 6);
      g.stroke({ color: GOLD, width: 1, alpha: 0.3 });
    },
    [sectionWidth, swapPickerCount],
  );

  let y = 0;
  const cubesY = y;
  y += 56;

  const chargesY = y;
  y += chargesSectionH;
  const div1Y = y;
  y += 2;

  const levelUpY = y;
  y += levelUpSectionH;
  const div2Y = y;
  y += 2;

  const swapY = y;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="IN-GAME SHOP"
      subtitle="SPEND CUBES ON UPGRADES"
      width={modalWidth}
      contentHeight={contentHeight}
      screenWidth={screenWidth}
      screenHeight={screenHeight}
      showCloseButton={!isPurchasing}
      closeOnBackdrop={!isPurchasing}
      closeOnEscape={!isPurchasing}
    >
      <pixiContainer x={24} y={0}>
        {/* Cubes header */}
        <pixiContainer y={cubesY}>
          <pixiGraphics draw={drawCubesCard} eventMode="none" />
          <pixiText text="CUBES AVAILABLE" x={12} y={7} style={cubesLabelStyle} eventMode="none" />
          <pixiText
            text={`🧊 ${cubesAvailable}`}
            x={sectionWidth - 12}
            y={22}
            anchor={{ x: 1, y: 0.5 }}
            style={cubesValueStyle}
            eventMode="none"
          />
        </pixiContainer>

        {/* ── BONUS CHARGES ── */}
        <pixiContainer y={chargesY}>
          <pixiText text="── BONUS CHARGES ──" x={sectionWidth / 2} y={4} anchor={{ x: 0.5, y: 0 }} style={sectionTitleStyle} eventMode="none" />
          <pixiText text="Buy charges, then assign to bonuses" x={sectionWidth / 2} y={20} anchor={{ x: 0.5, y: 0 }} style={sectionDescStyle} eventMode="none" />

          <PixiButton
            label={`BUY CHARGE · ${chargeCost}🧊`}
            y={34}
            width={sectionWidth}
            height={chargesRowH}
            variant={cubesAvailable >= chargeCost ? 'orange' : 'purple'}
            disabled={isPurchasing || cubesAvailable < chargeCost}
            textStyle={{ fontFamily: FONT_TITLE, fontSize: 12 }}
            onPress={() => { void onBuyCharge(); }}
          />

          {unallocatedCharges > 0 && (
            <pixiContainer y={34 + chargesRowH + 8}>
              <pixiText
                text={`${unallocatedCharges} unallocated charge${unallocatedCharges > 1 ? 's' : ''}:`}
                x={0}
                y={0}
                style={unallocStyle}
                eventMode="none"
              />
              {selectedBonuses.map((b, idx) => {
                const rowY = 18 + idx * 36;
                const isFull = b.inventory >= b.bagSize;
                return (
                  <pixiContainer key={`alloc-${b.slot}`} y={rowY}>
                    <pixiGraphics draw={drawAllocRow} eventMode="none" />
                    <pixiText text={`${b.icon} ${b.name}`} x={10} y={15} anchor={{ x: 0, y: 0.5 }} style={bonusNameStyle} eventMode="none" />
                    <pixiText text={`${b.inventory}/${b.bagSize}`} x={120} y={15} anchor={{ x: 0, y: 0.5 }} style={metaStyle} eventMode="none" />
                    <PixiButton
                      label={isFull ? 'FULL' : '+1'}
                      x={sectionWidth - 64}
                      y={2}
                      width={56}
                      height={26}
                      variant={isFull ? 'purple' : 'orange'}
                      disabled={isPurchasing || isFull}
                      textStyle={{ fontFamily: FONT_TITLE, fontSize: 11 }}
                      onPress={() => { void onAllocateCharge(b.slot); }}
                    />
                  </pixiContainer>
                );
              })}
            </pixiContainer>
          )}
        </pixiContainer>

        <pixiGraphics draw={drawDivider} y={div1Y} eventMode="none" />

        {/* ── LEVEL UP ── */}
        <pixiContainer y={levelUpY}>
          <pixiText text={`── LEVEL UP (50🧊) ──`} x={sectionWidth / 2} y={4} anchor={{ x: 0.5, y: 0 }} style={sectionTitleStyle} eventMode="none" />
          <pixiText text="Upgrade one bonus this shop visit" x={sectionWidth / 2} y={20} anchor={{ x: 0.5, y: 0 }} style={sectionDescStyle} eventMode="none" />

          {selectedBonuses.map((b, idx) => {
            const rowY = 34 + idx * 40;
            const isMax = b.level >= 3;
            const canAfford = cubesAvailable >= 50;
            const btnDisabled = isPurchasing || levelUpBought || isMax || !canAfford;
            const label = isMax ? 'MAX' : `LV${b.level}→${b.level + 1}`;
            return (
              <pixiContainer key={`lvl-${b.slot}`} y={rowY}>
                <pixiText text={`${b.icon} ${b.name} Lv${b.level}`} x={0} y={16} anchor={{ x: 0, y: 0.5 }} style={bonusNameStyle} eventMode="none" />
                <PixiButton
                  label={label}
                  x={sectionWidth - 90}
                  y={2}
                  width={82}
                  height={30}
                  variant={btnDisabled ? 'purple' : 'orange'}
                  disabled={btnDisabled}
                  textStyle={{ fontFamily: FONT_TITLE, fontSize: 11 }}
                  onPress={() => { void onLevelUpBonus(b.slot); }}
                />
              </pixiContainer>
            );
          })}

          <pixiText
            text={levelUpBought ? '(Already purchased)' : '(One per shop visit)'}
            x={sectionWidth / 2}
            y={34 + bonusCount * 40 + 4}
            anchor={{ x: 0.5, y: 0 }}
            style={footNoteStyle}
            eventMode="none"
          />
        </pixiContainer>

        <pixiGraphics draw={drawDivider} y={div2Y} eventMode="none" />

        {/* ── SWAP BONUS ── */}
        <pixiContainer y={swapY}>
          <pixiText text={`── SWAP BONUS (50🧊) ──`} x={sectionWidth / 2} y={4} anchor={{ x: 0.5, y: 0 }} style={sectionTitleStyle} eventMode="none" />
          <pixiText text="Replace a bonus with an unlocked one" x={sectionWidth / 2} y={20} anchor={{ x: 0.5, y: 0 }} style={sectionDescStyle} eventMode="none" />

          {selectedBonuses.map((b, idx) => {
            const rowY = 34 + idx * 40;
            const canAfford = cubesAvailable >= 50;
            const btnDisabled = isPurchasing || swapBought || !canAfford || unselectedBonuses.length === 0;
            const isPickerOpen = swapOpenSlot === b.slot;
            return (
              <pixiContainer key={`swap-${b.slot}`} y={rowY}>
                <pixiText text={`${b.icon} ${b.name}`} x={0} y={16} anchor={{ x: 0, y: 0.5 }} style={bonusNameStyle} eventMode="none" />
                <PixiButton
                  label={isPickerOpen ? 'CANCEL' : 'SWAP'}
                  x={sectionWidth - 80}
                  y={2}
                  width={72}
                  height={30}
                  variant={isPickerOpen ? 'red' : btnDisabled ? 'purple' : 'orange'}
                  disabled={!isPickerOpen && btnDisabled}
                  textStyle={{ fontFamily: FONT_TITLE, fontSize: 11 }}
                  onPress={() => setSwapOpenSlot(isPickerOpen ? null : b.slot)}
                />
              </pixiContainer>
            );
          })}

          {swapOpenSlot !== null && unselectedBonuses.length > 0 && (
            <pixiContainer x={10} y={34 + bonusCount * 40 + 4}>
              <pixiGraphics draw={drawSwapPickerBg} eventMode="none" />
              {unselectedBonuses.map((ub, idx) => {
                const pickY = idx * 36 + 4;
                return (
                  <pixiContainer key={`pick-${ub.contractValue}`} y={pickY}>
                    <pixiText text={`${ub.icon} ${ub.name}`} x={10} y={14} anchor={{ x: 0, y: 0.5 }} style={bonusNameStyle} eventMode="none" />
                    <PixiButton
                      label="SELECT"
                      x={sectionWidth - 100}
                      y={2}
                      width={64}
                      height={26}
                      variant="orange"
                      disabled={isPurchasing}
                      textStyle={{ fontFamily: FONT_TITLE, fontSize: 10 }}
                      onPress={() => {
                        void onSwapBonus(swapOpenSlot, ub.contractValue);
                        setSwapOpenSlot(null);
                      }}
                    />
                  </pixiContainer>
                );
              })}
            </pixiContainer>
          )}

          <pixiText
            text={swapBought ? '(Already purchased)' : '(One per shop visit)'}
            x={sectionWidth / 2}
            y={34 + bonusCount * 40 + (swapPickerH > 0 ? swapPickerH + 12 : 4)}
            anchor={{ x: 0.5, y: 0 }}
            style={footNoteStyle}
            eventMode="none"
          />
        </pixiContainer>

        {/* Continue Run */}
        <PixiButton
          label={isPurchasing ? 'PURCHASING...' : 'CONTINUE RUN'}
          y={contentHeight - 52}
          width={sectionWidth}
          height={44}
          variant="purple"
          disabled={isPurchasing}
          onPress={onClose}
        />
      </pixiContainer>
    </Modal>
  );
};

export default InGameShopModal;
