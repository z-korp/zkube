import { describe, it, expect } from 'vitest';
import { normalizeAddress } from './address';

describe('normalizeAddress', () => {
  it('strips leading zeros after 0x', () => {
    expect(normalizeAddress('0x004533cf')).toBe('0x4533cf');
  });

  it('lowercases the result', () => {
    expect(normalizeAddress('0x4A3F00')).toBe('0x4a3f00');
  });

  it('preserves a single zero', () => {
    expect(normalizeAddress('0x0000')).toBe('0x0');
  });

  it('passes through non-0x strings', () => {
    expect(normalizeAddress('hello')).toBe('hello');
  });

  it('handles already-normalized addresses', () => {
    expect(normalizeAddress('0xabc')).toBe('0xabc');
  });

  it('handles full 64-char padded addresses', () => {
    const padded = '0x' + '0'.repeat(60) + 'abcd';
    expect(normalizeAddress(padded)).toBe('0xabcd');
  });
});
