import { describe, it, expect } from 'vitest';
import { unpackRunData, createInitialRunData, getCubesAvailable, isBossLevel, isInGameShopAvailable, getRefillCost } from './runDataPacking';

describe('unpackRunData', () => {
  it('returns all zeros for 0n', () => {
    const data = unpackRunData(0n);
    expect(data.currentLevel).toBe(0);
    expect(data.levelScore).toBe(0);
    expect(data.levelMoves).toBe(0);
    expect(data.totalCubes).toBe(0);
    expect(data.totalScore).toBe(0);
    expect(data.hammerCount).toBe(0);
    expect(data.bonusUsedThisLevel).toBe(false);
    expect(data.runCompleted).toBe(false);
    expect(data.pendingLevelUp).toBe(false);
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

  it('extracts hammerCount from bits 43-50', () => {
    const packed = BigInt(5) << BigInt(43);
    expect(unpackRunData(packed).hammerCount).toBe(5);
  });

  it('extracts totalCubes from bits 131-146', () => {
    const packed = BigInt(1000) << BigInt(131);
    expect(unpackRunData(packed).totalCubes).toBe(1000);
  });

  it('extracts totalScore from bits 147-162', () => {
    const packed = BigInt(500) << BigInt(147);
    expect(unpackRunData(packed).totalScore).toBe(500);
  });

  it('extracts runCompleted from bit 163', () => {
    const packed = BigInt(1) << BigInt(163);
    expect(unpackRunData(packed).runCompleted).toBe(true);
  });

  it('extracts selectedBonus values from bits 164-172', () => {
    const b1 = BigInt(1) << BigInt(164);
    const b2 = BigInt(3) << BigInt(167);
    const b3 = BigInt(5) << BigInt(170);
    const packed = b1 | b2 | b3;
    const data = unpackRunData(packed);
    expect(data.selectedBonus1).toBe(1);
    expect(data.selectedBonus2).toBe(3);
    expect(data.selectedBonus3).toBe(5);
  });

  it('extracts shop state from bits 183-195', () => {
    const lastShopLevel = BigInt(15) << BigInt(183);
    const shopBonus1 = BigInt(1) << BigInt(189);
    const shopRefills = BigInt(3) << BigInt(192);
    const packed = lastShopLevel | shopBonus1 | shopRefills;
    const data = unpackRunData(packed);
    expect(data.lastShopLevel).toBe(15);
    expect(data.shopBonus1Bought).toBe(true);
    expect(data.shopBonus2Bought).toBe(false);
    expect(data.shopRefills).toBe(3);
  });

  it('handles combined fields without cross-contamination', () => {
    const level = BigInt(10);
    const score = BigInt(50) << BigInt(8);
    const moves = BigInt(20) << BigInt(16);
    const cubes = BigInt(100) << BigInt(131);
    const packed = level | score | moves | cubes;
    const data = unpackRunData(packed);
    expect(data.currentLevel).toBe(10);
    expect(data.levelScore).toBe(50);
    expect(data.levelMoves).toBe(20);
    expect(data.totalCubes).toBe(100);
    expect(data.hammerCount).toBe(0);
  });
});

describe('createInitialRunData', () => {
  it('starts at level 1 with default bonuses', () => {
    const data = createInitialRunData();
    expect(data.currentLevel).toBe(1);
    expect(data.selectedBonus1).toBe(1);
    expect(data.selectedBonus2).toBe(3);
    expect(data.selectedBonus3).toBe(2);
    expect(data.totalCubes).toBe(0);
    expect(data.totalScore).toBe(0);
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

  it('isInGameShopAvailable returns true for multiples of 5', () => {
    expect(isInGameShopAvailable(5)).toBe(true);
    expect(isInGameShopAvailable(10)).toBe(true);
    expect(isInGameShopAvailable(3)).toBe(false);
    expect(isInGameShopAvailable(0)).toBe(false);
  });

  it('getRefillCost scales with purchases', () => {
    expect(getRefillCost(0)).toBe(2);
    expect(getRefillCost(1)).toBe(4);
    expect(getRefillCost(2)).toBe(6);
  });
});
