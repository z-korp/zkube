import { describe, it, expect } from 'vitest';
import { unpackRunData, createInitialRunData, getCubesAvailable, isBossLevel, isInGameShopAvailable, getBonusChargeCost } from './runDataPacking';

describe('unpackRunData', () => {
  it('returns all zeros for 0n', () => {
    const data = unpackRunData(0n);
    expect(data.currentLevel).toBe(0);
    expect(data.levelScore).toBe(0);
    expect(data.levelMoves).toBe(0);
    expect(data.totalCubes).toBe(0);
    expect(data.totalScore).toBe(0);
    expect(data.comboCount).toBe(0);
    expect(data.bonusUsedThisLevel).toBe(false);
    expect(data.runCompleted).toBe(false);
    expect(data.bossLevelUpPending).toBe(false);
  });

  it('extracts currentLevel from bits 0-7', () => {
    const packed = BigInt(42);
    expect(unpackRunData(packed).currentLevel).toBe(42);
  });

  it('extracts levelScore from bits 8-15', () => {
    const packed = BigInt(100) << BigInt(8);
    expect(unpackRunData(packed).levelScore).toBe(100);
  });

  it('extracts levelMoves from bits 16-23', () => {
    const packed = BigInt(15) << BigInt(16);
    expect(unpackRunData(packed).levelMoves).toBe(15);
  });

  it('extracts bonusUsedThisLevel from bit 40', () => {
    const packed = BigInt(1) << BigInt(40);
    expect(unpackRunData(packed).bonusUsedThisLevel).toBe(true);
  });

  it('extracts comboCount from bits 41-48', () => {
    const packed = BigInt(5) << BigInt(41);
    expect(unpackRunData(packed).comboCount).toBe(5);
  });

  it('extracts totalCubes from bits 121-136', () => {
    const packed = BigInt(1000) << BigInt(121);
    expect(unpackRunData(packed).totalCubes).toBe(1000);
  });

  it('extracts totalScore from bits 137-152', () => {
    const packed = BigInt(500) << BigInt(137);
    expect(unpackRunData(packed).totalScore).toBe(500);
  });

  it('extracts runCompleted from bit 153', () => {
    const packed = BigInt(1) << BigInt(153);
    expect(unpackRunData(packed).runCompleted).toBe(true);
  });

  it('extracts selectedBonus values from bits 154-162', () => {
    const b1 = BigInt(1) << BigInt(154);
    const b2 = BigInt(3) << BigInt(157);
    const b3 = BigInt(5) << BigInt(160);
    const packed = b1 | b2 | b3;
    const data = unpackRunData(packed);
    expect(data.selectedBonus1).toBe(1);
    expect(data.selectedBonus2).toBe(3);
    expect(data.selectedBonus3).toBe(5);
  });

  it('extracts shop state from new bit positions', () => {
    const lastShopLevel = BigInt(3) << BigInt(172);
    const shopPurchases = BigInt(5) << BigInt(184);
    const unallocatedCharges = BigInt(2) << BigInt(188);
    const shopLevelUpBought = BigInt(1) << BigInt(192);
    const packed = lastShopLevel | shopPurchases | unallocatedCharges | shopLevelUpBought;
    const data = unpackRunData(packed);
    expect(data.lastShopLevel).toBe(3);
    expect(data.shopPurchases).toBe(5);
    expect(data.unallocatedCharges).toBe(2);
    expect(data.shopLevelUpBought).toBe(true);
    expect(data.shopSwapBought).toBe(false);
  });

  it('extracts bossLevelUpPending from bit 194', () => {
    const packed = BigInt(1) << BigInt(194);
    expect(unpackRunData(packed).bossLevelUpPending).toBe(true);
  });

  it('handles combined fields without cross-contamination', () => {
    const level = BigInt(10);
    const score = BigInt(50) << BigInt(8);
    const moves = BigInt(20) << BigInt(16);
    const cubes = BigInt(100) << BigInt(121);
    const packed = level | score | moves | cubes;
    const data = unpackRunData(packed);
    expect(data.currentLevel).toBe(10);
    expect(data.levelScore).toBe(50);
    expect(data.levelMoves).toBe(20);
    expect(data.totalCubes).toBe(100);
    expect(data.comboCount).toBe(0);
  });
});

describe('createInitialRunData', () => {
  it('starts at level 1 with default bonuses', () => {
    const data = createInitialRunData();
    expect(data.currentLevel).toBe(1);
    expect(data.selectedBonus1).toBe(1);
    expect(data.selectedBonus2).toBe(2);
    expect(data.selectedBonus3).toBe(3);
    expect(data.totalCubes).toBe(0);
    expect(data.totalScore).toBe(0);
    expect(data.shopPurchases).toBe(0);
    expect(data.unallocatedCharges).toBe(0);
    expect(data.bossLevelUpPending).toBe(false);
  });
});

describe('getCubesAvailable', () => {
  it('returns brought + earned - spent', () => {
    const data = { ...createInitialRunData(), cubesBrought: 50, totalCubes: 30, cubesSpent: 20 };
    expect(getCubesAvailable(data)).toBe(60);
  });

  it('clamps to zero if overspent', () => {
    const data = { ...createInitialRunData(), cubesBrought: 10, totalCubes: 5, cubesSpent: 100 };
    expect(getCubesAvailable(data)).toBe(0);
  });
});

describe('level helpers', () => {
  it('isBossLevel returns true for multiples of 10', () => {
    expect(isBossLevel(10)).toBe(true);
    expect(isBossLevel(20)).toBe(true);
    expect(isBossLevel(50)).toBe(true);
    expect(isBossLevel(15)).toBe(false);
    expect(isBossLevel(0)).toBe(false);
  });

  it('isInGameShopAvailable returns true for levels ending in 9 (before boss)', () => {
    expect(isInGameShopAvailable(9)).toBe(true);
    expect(isInGameShopAvailable(19)).toBe(true);
    expect(isInGameShopAvailable(29)).toBe(true);
    expect(isInGameShopAvailable(39)).toBe(true);
    expect(isInGameShopAvailable(49)).toBe(true);
    expect(isInGameShopAvailable(5)).toBe(false);
    expect(isInGameShopAvailable(10)).toBe(false);
    expect(isInGameShopAvailable(15)).toBe(false);
    expect(isInGameShopAvailable(0)).toBe(false);
  });

  it('getBonusChargeCost scales with purchases', () => {
    expect(getBonusChargeCost(0)).toBe(5);
    expect(getBonusChargeCost(1)).toBe(8);
    expect(getBonusChargeCost(2)).toBe(12);
    expect(getBonusChargeCost(3)).toBe(18);
    expect(getBonusChargeCost(4)).toBe(27);
    expect(getBonusChargeCost(5)).toBe(41);
  });
});
