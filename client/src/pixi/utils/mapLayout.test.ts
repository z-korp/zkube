import { describe, it, expect } from 'vitest';
import {
  getMapNode,
  contractLevelToNodeIndex,
  nodeIndexToContractLevel,
  getZone,
  getNodesForZone,
  getAllNodes,
  isShopNode,
  isBossNode,
  getShopNodeForZone,
  getBossNodeForZone,
  TOTAL_NODES,
  NODES_PER_ZONE,
  TOTAL_ZONES,
} from './mapLayout';

describe('mapLayout', () => {
  describe('getMapNode', () => {
    it('first node is zone 1 classic level 1', () => {
      const node = getMapNode(0);
      expect(node.zone).toBe(1);
      expect(node.nodeInZone).toBe(0);
      expect(node.type).toBe('classic');
      expect(node.contractLevel).toBe(1);
      expect(node.displayLabel).toBe('1-1');
    });

    it('9th node (index 8) is zone 1 classic level 9', () => {
      const node = getMapNode(8);
      expect(node.zone).toBe(1);
      expect(node.nodeInZone).toBe(8);
      expect(node.type).toBe('classic');
      expect(node.contractLevel).toBe(9);
      expect(node.displayLabel).toBe('1-9');
    });

    it('10th node (index 9) is zone 1 shop', () => {
      const node = getMapNode(9);
      expect(node.zone).toBe(1);
      expect(node.nodeInZone).toBe(9);
      expect(node.type).toBe('shop');
      expect(node.contractLevel).toBeNull();
      expect(node.displayLabel).toBe('1-SHOP');
    });

    it('11th node (index 10) is zone 1 boss (contract level 10)', () => {
      const node = getMapNode(10);
      expect(node.zone).toBe(1);
      expect(node.nodeInZone).toBe(10);
      expect(node.type).toBe('boss');
      expect(node.contractLevel).toBe(10);
      expect(node.displayLabel).toBe('1-BOSS');
    });

    it('zone 2 starts at index 11', () => {
      const node = getMapNode(11);
      expect(node.zone).toBe(2);
      expect(node.nodeInZone).toBe(0);
      expect(node.type).toBe('classic');
      expect(node.contractLevel).toBe(11);
      expect(node.displayLabel).toBe('2-1');
    });

    it('zone 5 boss is the last node (index 54, contract level 50)', () => {
      const node = getMapNode(54);
      expect(node.zone).toBe(5);
      expect(node.type).toBe('boss');
      expect(node.contractLevel).toBe(50);
      expect(node.displayLabel).toBe('5-BOSS');
    });
  });

  describe('contractLevelToNodeIndex', () => {
    it('level 1 maps to node 0', () => {
      expect(contractLevelToNodeIndex(1)).toBe(0);
    });

    it('level 9 maps to node 8', () => {
      expect(contractLevelToNodeIndex(9)).toBe(8);
    });

    it('level 10 (boss) maps to node 10', () => {
      expect(contractLevelToNodeIndex(10)).toBe(10);
    });

    it('level 11 maps to node 11', () => {
      expect(contractLevelToNodeIndex(11)).toBe(11);
    });

    it('level 50 (final boss) maps to node 54', () => {
      expect(contractLevelToNodeIndex(50)).toBe(54);
    });

    it('invalid levels return -1', () => {
      expect(contractLevelToNodeIndex(0)).toBe(-1);
      expect(contractLevelToNodeIndex(51)).toBe(-1);
    });
  });

  describe('nodeIndexToContractLevel', () => {
    it('shop nodes return null', () => {
      expect(nodeIndexToContractLevel(9)).toBeNull();
      expect(nodeIndexToContractLevel(20)).toBeNull();
      expect(nodeIndexToContractLevel(31)).toBeNull();
      expect(nodeIndexToContractLevel(42)).toBeNull();
      expect(nodeIndexToContractLevel(53)).toBeNull();
    });

    it('classic/boss nodes return contract levels', () => {
      expect(nodeIndexToContractLevel(0)).toBe(1);
      expect(nodeIndexToContractLevel(10)).toBe(10);
      expect(nodeIndexToContractLevel(54)).toBe(50);
    });
  });

  describe('roundtrip', () => {
    it('contractLevel -> nodeIndex -> contractLevel roundtrips for all 50 levels', () => {
      for (let level = 1; level <= 50; level++) {
        const nodeIdx = contractLevelToNodeIndex(level);
        expect(nodeIdx).toBeGreaterThanOrEqual(0);
        const backToLevel = nodeIndexToContractLevel(nodeIdx);
        expect(backToLevel).toBe(level);
      }
    });
  });

  describe('getZone', () => {
    it('levels 1-10 are zone 1', () => {
      for (let l = 1; l <= 10; l++) expect(getZone(l)).toBe(1);
    });
    it('levels 11-20 are zone 2', () => {
      for (let l = 11; l <= 20; l++) expect(getZone(l)).toBe(2);
    });
    it('levels 41-50 are zone 5', () => {
      for (let l = 41; l <= 50; l++) expect(getZone(l)).toBe(5);
    });
  });

  describe('getAllNodes', () => {
    it('returns 55 nodes', () => {
      expect(getAllNodes()).toHaveLength(TOTAL_NODES);
    });

    it('has exactly 5 shop nodes', () => {
      const shops = getAllNodes().filter(n => n.type === 'shop');
      expect(shops).toHaveLength(TOTAL_ZONES);
    });

    it('has exactly 5 boss nodes', () => {
      const bosses = getAllNodes().filter(n => n.type === 'boss');
      expect(bosses).toHaveLength(TOTAL_ZONES);
    });

    it('has exactly 45 classic nodes', () => {
      const classics = getAllNodes().filter(n => n.type === 'classic');
      expect(classics).toHaveLength(45);
    });
  });

  describe('getNodesForZone', () => {
    it('returns 11 nodes per zone', () => {
      for (let z = 1; z <= 5; z++) {
        expect(getNodesForZone(z)).toHaveLength(NODES_PER_ZONE);
      }
    });

    it('zone nodes have correct zone field', () => {
      const zone3 = getNodesForZone(3);
      for (const node of zone3) expect(node.zone).toBe(3);
    });
  });

  describe('isShopNode / isBossNode', () => {
    it('shop nodes at indices 9, 20, 31, 42, 53', () => {
      expect(isShopNode(9)).toBe(true);
      expect(isShopNode(20)).toBe(true);
      expect(isShopNode(31)).toBe(true);
      expect(isShopNode(42)).toBe(true);
      expect(isShopNode(53)).toBe(true);
      expect(isShopNode(0)).toBe(false);
      expect(isShopNode(10)).toBe(false);
    });

    it('boss nodes at indices 10, 21, 32, 43, 54', () => {
      expect(isBossNode(10)).toBe(true);
      expect(isBossNode(21)).toBe(true);
      expect(isBossNode(32)).toBe(true);
      expect(isBossNode(43)).toBe(true);
      expect(isBossNode(54)).toBe(true);
      expect(isBossNode(9)).toBe(false);
    });
  });

  describe('getShopNodeForZone / getBossNodeForZone', () => {
    it('returns correct indices', () => {
      expect(getShopNodeForZone(1)).toBe(9);
      expect(getShopNodeForZone(3)).toBe(31);
      expect(getShopNodeForZone(5)).toBe(53);
      expect(getBossNodeForZone(1)).toBe(10);
      expect(getBossNodeForZone(5)).toBe(54);
    });
  });
});
