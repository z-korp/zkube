import { describe, it, expect } from 'vitest';
import { normalizeEntityId } from './entityId';

describe('normalizeEntityId', () => {
  it('strips leading zeros from hex entity IDs', () => {
    expect(normalizeEntityId('0x004533cf')).toBe('0x4533cf');
  });

  it('preserves non-hex strings', () => {
    expect(normalizeEntityId('some-id')).toBe('some-id');
  });

  it('handles all-zero hex', () => {
    expect(normalizeEntityId('0x0000')).toBe('0x0');
  });

  it('does not alter already-normalized IDs', () => {
    expect(normalizeEntityId('0x1')).toBe('0x1');
  });
});
